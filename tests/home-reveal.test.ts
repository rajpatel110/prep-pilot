import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { initializeHomeReveals } from "../src/shared/ui/home-reveal";

class ElementFixture extends EventTarget {
  attributes = new Map<string, string>();
  children: ElementFixture[] = [];
  section: ElementFixture | undefined;
  unsafe = false;
  constructor(public top: number) {
    super();
  }
  getBoundingClientRect() {
    return { top: this.top };
  }
  querySelector() {
    return this.unsafe ? {} : null;
  }
  matches() {
    return false;
  }
  setAttribute(name: string, value: string) {
    this.attributes.set(name, value);
  }
  removeAttribute(name: string) {
    this.attributes.delete(name);
  }
  getAttribute(name: string) {
    return this.attributes.get(name) ?? null;
  }
  contains(target: ElementFixture): boolean {
    return (
      this === target || this.children.some((child) => child.contains(target))
    );
  }
  closest(selector: string) {
    if (selector === "section") return this.section;
    if (selector === "a[href]" && this.attributes.has("href")) return this;
    return null;
  }
}

function fixture(
  options: {
    reduced?: boolean;
    unavailable?: boolean;
    broken?: boolean;
    hash?: string;
  } = {},
) {
  const visible = new ElementFixture(200);
  const below = new ElementFixture(1100);
  const later = new ElementFixture(1800);
  const section = new ElementFixture(1000);
  section.children = [below, later];
  below.section = section;
  later.section = section;
  const targets = [visible, below, later];
  const root = new ElementFixture(0);
  root.children = targets;
  const media = Object.assign(new EventTarget(), {
    matches: options.reduced ?? false,
  });
  let callback: IntersectionObserverCallback | undefined;
  const observed = new Set<ElementFixture>();
  let disconnected = false;
  const view = Object.assign(new EventTarget(), {
    innerHeight: 844,
    location: new URL(`http://localhost/${options.hash ?? ""}`),
    matchMedia: () => media,
    IntersectionObserver: options.unavailable
      ? undefined
      : class {
          constructor(handler: IntersectionObserverCallback) {
            if (options.broken) throw new Error("Unsupported observer");
            callback = handler;
          }
          observe(target: ElementFixture) {
            observed.add(target);
          }
          unobserve(target: ElementFixture) {
            observed.delete(target);
          }
          disconnect() {
            observed.clear();
            disconnected = true;
          }
        },
  });
  const document = Object.assign(new EventTarget(), {
    defaultView: view,
    visibilityState: "visible",
    getElementById: (id: string) => (id === "about" ? section : null),
  });
  Object.assign(root, {
    ownerDocument: document,
    querySelectorAll: () => targets,
  });
  function event(
    source: EventTarget,
    name: string,
    target?: ElementFixture,
    extra = {},
  ) {
    const event = new Event(name);
    if (target) Object.defineProperty(event, "target", { value: target });
    Object.assign(event, extra);
    source.dispatchEvent(event);
  }
  return {
    root,
    visible,
    below,
    later,
    section,
    targets,
    media,
    view,
    document,
    observed,
    initialize: () => initializeHomeReveals(root as unknown as HTMLElement),
    intersect(target = below, top = target.top) {
      callback?.(
        [
          { target, isIntersecting: true, boundingClientRect: { top } },
        ] as unknown as IntersectionObserverEntry[],
        {} as IntersectionObserver,
      );
    },
    event,
    disconnected: () => disconnected,
  };
}

test("visible and restored-above content never starts an animation", () => {
  const page = fixture();
  page.visible.top = -300;
  const cleanup = page.initialize();
  assert.equal(page.observed.has(page.visible), false);
  assert.equal(page.observed.has(page.below), true);
  assert.equal(page.visible.getAttribute("data-revealing"), null);
  cleanup();
});

test("entry animates once, with no hidden state after completion or scrolling back", () => {
  const page = fixture();
  const cleanup = page.initialize();
  page.intersect(page.below, 700);
  assert.equal(page.below.getAttribute("data-revealing"), "");
  assert.equal(page.observed.has(page.below), false);
  page.below.closest = () => page.below;
  page.event(page.root, "animationend", page.below);
  assert.equal(page.below.getAttribute("data-revealing"), null);
  page.intersect(page.below, 400);
  assert.equal(page.below.getAttribute("data-revealing"), null);
  cleanup();
});

test("fast scrolling past a target leaves it immediately readable", () => {
  const page = fixture();
  const cleanup = page.initialize();
  page.intersect(page.below, -40);
  assert.equal(page.below.getAttribute("data-revealing"), null);
  assert.equal(page.observed.has(page.below), false);
  cleanup();
});

for (const options of [
  { reduced: true },
  { unavailable: true },
  { broken: true },
]) {
  test(`initialization remains visible with ${JSON.stringify(options)}`, () => {
    const page = fixture(options);
    const cleanup = page.initialize();
    assert.equal(page.observed.size, 0);
    assert.ok(
      page.targets.every(
        (target) => target.getAttribute("data-revealing") === null,
      ),
    );
    cleanup();
  });
}

test("changing reduced motion cancels active and future animations", () => {
  const page = fixture();
  const cleanup = page.initialize();
  page.intersect(page.below, 700);
  page.media.matches = true;
  page.event(page.media, "change");
  assert.equal(page.disconnected(), true);
  assert.equal(page.below.getAttribute("data-revealing"), null);
  page.media.matches = false;
  page.intersect(page.later, 700);
  assert.equal(page.later.getAttribute("data-revealing"), null);
  cleanup();
});

test("direct hashes and same-hash clicks bypass motion for the destination section", () => {
  const direct = fixture({ hash: "#about" });
  const cleanupDirect = direct.initialize();
  assert.equal(direct.observed.size, 0);
  cleanupDirect();
  const page = fixture();
  const cleanup = page.initialize();
  page.intersect(page.below, 700);
  const link = new ElementFixture(0);
  link.setAttribute("href", "/#about");
  page.event(page.document, "click", link);
  assert.equal(page.below.getAttribute("data-revealing"), null);
  assert.equal(page.observed.size, 0);
  cleanup();
});

test("hash changes cancel destination motion and malformed hashes do not throw", () => {
  const page = fixture();
  const cleanup = page.initialize();
  page.view.location.hash = "#about";
  page.event(page.view, "hashchange");
  assert.equal(page.observed.size, 0);
  page.view.location.hash = "#%broken";
  assert.doesNotThrow(() => page.event(page.view, "hashchange"));
  cleanup();
});

test("keyboard focus immediately reveals its section", () => {
  const page = fixture();
  const cleanup = page.initialize();
  page.intersect(page.below, 700);
  page.event(page.root, "focusin", page.below);
  assert.equal(page.below.getAttribute("data-revealing"), null);
  assert.equal(page.observed.size, 0);
  cleanup();
});

for (const [name, extra] of [
  ["popstate", {}],
  ["pageshow", { persisted: true }],
] as const) {
  test(`${name} restoration cancels motion without scrolling the document`, () => {
    const page = fixture();
    const cleanup = page.initialize();
    page.intersect(page.below, 700);
    page.event(page.view, name, undefined, extra);
    assert.equal(page.below.getAttribute("data-revealing"), null);
    assert.equal(page.observed.size, 0);
    cleanup();
  });
}

test("controls and images are excluded and cleanup removes observers/listeners", () => {
  const page = fixture();
  page.later.unsafe = true;
  const cleanup = page.initialize();
  assert.equal(page.observed.has(page.later), false);
  page.intersect(page.below, 700);
  cleanup();
  assert.equal(page.disconnected(), true);
  assert.equal(page.below.getAttribute("data-revealing"), null);
  page.below.setAttribute("data-revealing", "");
  page.event(page.view, "popstate");
  assert.equal(page.below.getAttribute("data-revealing"), "");
  page.below.removeAttribute("data-revealing");
});

test("a hidden document never starts a reveal", () => {
  const page = fixture();
  const cleanup = page.initialize();
  page.document.visibilityState = "hidden";
  page.intersect(page.below, 700);
  assert.equal(page.below.getAttribute("data-revealing"), null);
  cleanup();
});

test("pageshow bypasses animation for content already in the restored viewport", () => {
  const page = fixture();
  const cleanup = page.initialize();
  page.below.top = 400;
  page.event(page.view, "pageshow", undefined, { persisted: false });
  assert.equal(page.observed.has(page.below), false);
  assert.equal(page.below.getAttribute("data-revealing"), null);
  assert.equal(page.observed.has(page.later), true);
  cleanup();
});

test("CSS has finite, non-filling animations, reduced-motion override and bounded blur", () => {
  const css = readFileSync("src/app/home.module.css", "utf8");
  assert.match(css, /650ms/);
  assert.match(css, /translateY\(12px\)/);
  assert.match(css, /blur\(3px\)/);
  assert.match(css, /prefers-reduced-motion: reduce/);
  assert.doesNotMatch(css, /animation-fill-mode|infinite|visibility:\s*hidden/);
  const page = readFileSync("src/app/page.tsx", "utf8");
  const hero = page.slice(
    page.indexOf('<section className="hero'),
    page.indexOf('id="how-it-works"'),
  );
  assert.doesNotMatch(hero, /data-home-reveal/);
});
