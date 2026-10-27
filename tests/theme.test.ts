import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import { themeInitialization } from "../src/shared/ui/theme-script";

function fixture(
  systemDark: boolean,
  saved: string | null = null,
  blocked = false,
) {
  const events = new EventTarget();
  const mediaEvents = new EventTarget();
  const media = {
    matches: systemDark,
    addEventListener: mediaEvents.addEventListener.bind(mediaEvents),
  };
  const dataset: { theme?: string } = {};
  let stored = saved;
  const storage = {
    getItem() {
      if (blocked) throw new Error("Storage unavailable");
      return stored;
    },
    setItem(key: string, value: string) {
      assert.equal(key, "preppilot-theme");
      if (blocked) throw new Error("Storage unavailable");
      stored = value;
    },
  };
  runInNewContext(themeInitialization, {
    window: {
      matchMedia: () => media,
      localStorage: storage,
      addEventListener: events.addEventListener.bind(events),
      dispatchEvent: events.dispatchEvent.bind(events),
    },
    document: { documentElement: { dataset } },
    Event,
  });
  return {
    dataset,
    saved: () => stored,
    select(value: string) {
      events.dispatchEvent(
        new CustomEvent("preppilot-theme-select", { detail: value }),
      );
    },
    system(dark: boolean) {
      media.matches = dark;
      mediaEvents.dispatchEvent(new Event("change"));
    },
    storage(value: string | null) {
      const event = new Event("storage");
      Object.assign(event, { key: "preppilot-theme", newValue: value });
      events.dispatchEvent(event);
    },
  };
}

test("first visit follows system and follows changes until explicit selection", () => {
  for (const initial of [false, true]) {
    const browser = fixture(initial);
    assert.equal(browser.dataset.theme, initial ? "dark" : "light");
    browser.system(!initial);
    assert.equal(browser.dataset.theme, initial ? "light" : "dark");
    assert.equal(browser.saved(), null);
    browser.select("dark");
    browser.system(false);
    assert.equal(browser.dataset.theme, "dark");
    assert.equal(browser.saved(), "dark");
    assert.equal(fixture(false, browser.saved()).dataset.theme, "dark");
  }
});
test("explicit light overrides a dark system; invalid stored values are ignored", () => {
  assert.equal(fixture(true, "light").dataset.theme, "light");
  assert.equal(fixture(true, "invalid").dataset.theme, "dark");
  const browser = fixture(false);
  browser.select("invalid");
  assert.equal(browser.saved(), null);
  assert.equal(browser.dataset.theme, "light");
});
test("blocked storage keeps toggle and in-memory explicit selection functional", () => {
  const browser = fixture(true, null, true);
  browser.select("light");
  browser.system(true);
  assert.equal(browser.dataset.theme, "light");
  browser.select("dark");
  assert.equal(browser.dataset.theme, "dark");
});
test("cross-tab changes synchronize and removal resumes system following", () => {
  const browser = fixture(true, "light");
  browser.storage("dark");
  assert.equal(browser.dataset.theme, "dark");
  browser.storage(null);
  browser.system(false);
  assert.equal(browser.dataset.theme, "light");
});
test("theme tokens keep core text, feedback and button contrast accessible", () => {
  const css = readFileSync("src/shared/ui/theme.css", "utf8");
  const palettes = [
    ...css.matchAll(/:root(?:\[data-theme="dark"\])? \{([^}]+)\}/g),
  ];
  assert.equal(palettes.length, 2);
  const luminance = (hex: string) =>
    [0, 2, 4].reduce((total, offset, index) => {
      const channel = Number.parseInt(hex.slice(offset, offset + 2), 16) / 255;
      const linear =
        channel <= 0.04045
          ? channel / 12.92
          : ((channel + 0.055) / 1.055) ** 2.4;
      return total + linear * [0.2126, 0.7152, 0.0722][index]!;
    }, 0);
  for (const palette of palettes) {
    const tokens: Record<string, string> = Object.fromEntries(
      [...palette[1]!.matchAll(/--color-([\w-]+): #([\da-f]{6});/g)].map(
        (match) => [match[1], match[2]],
      ),
    );
    tokens.charcoal = tokens.text!;
    tokens.ivory = tokens.page!;
    tokens.forest = tokens.text!;
    for (const [foreground, background] of [
      ["charcoal", "ivory"],
      ["muted", "surface"],
      ["forest", "surface"],
      ["danger", "surface"],
      ["warning", "ivory"],
      ["text-success", "surface-success"],
      ["on-action", "action"],
      ["accent-text", "surface"],
      ["accent-text", "accent-surface"],
      ["on-accent", "accent"],
    ]) {
      const values = [
        luminance(tokens[foreground!]!),
        luminance(tokens[background!]!),
      ].sort((left, right) => left - right);
      assert.ok(
        (values[1]! + 0.05) / (values[0]! + 0.05) >= 4.5,
        `${foreground}/${background}`,
      );
    }
    for (const foreground of ["border-input", "focus"]) {
      for (const background of ["surface", "page", "surface-selected"]) {
        const values = [
          luminance(tokens[foreground]!),
          luminance(tokens[background]!),
        ].sort((left, right) => left - right);
        assert.ok(
          (values[1]! + 0.05) / (values[0]! + 0.05) >= 3,
          `${foreground}/${background}`,
        );
      }
    }
  }
});

test("system dark fallback matches the explicitly selected dark palette", () => {
  const css = readFileSync("src/shared/ui/theme.css", "utf8");
  const selected = css.match(/:root\[data-theme="dark"\] \{([^}]+)\}/)![1]!;
  const system = css.match(/:root:not\(\[data-theme\]\) \{([^}]+)\}/)![1]!;
  const declarations = (block: string) =>
    block
      .split(";")
      .map((declaration) => declaration.trim())
      .filter(Boolean);
  assert.deepEqual(declarations(system), declarations(selected));
});

test("interface font loads once through Next without external runtime font CSS", () => {
  const layout = readFileSync("src/app/layout.tsx", "utf8");
  assert.equal((layout.match(/Instrument_Sans\(/g) ?? []).length, 1);
  assert.match(layout, /next\/font\/google/);
  assert.match(layout, /subsets: \["latin"\]/);
  assert.match(layout, /display: "swap"/);
  const css = readFileSync("src/app/globals.css", "utf8");
  assert.match(css, /--font-sans: var\(--font-instrument-sans\)/);
  assert.doesNotMatch(css, /fonts\.googleapis|fonts\.gstatic/);
});
