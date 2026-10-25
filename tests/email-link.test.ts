import assert from "node:assert/strict";
import { test } from "node:test";
import { watchEmailLink } from "../src/modules/identity/ui/email-link";

function fixture(initial = "") {
  const events = new EventTarget();
  const location = {
    hash: initial,
    pathname: "/verify-email",
    search: "?view=test",
  };
  const history = {
    state: { retained: true },
    replaceState(
      state: unknown,
      _unused: string,
      url: string | URL | null | undefined,
    ) {
      assert.deepEqual(state, { retained: true });
      assert.equal(url, "/verify-email?view=test");
      location.hash = "";
    },
  };
  const browser = {
    location,
    history,
    addEventListener: events.addEventListener.bind(events),
    removeEventListener: events.removeEventListener.bind(events),
  } as unknown as Pick<
    Window,
    "location" | "history" | "addEventListener" | "removeEventListener"
  >;
  return { browser, location, events };
}

test("same-tab links are captured passively, scrubbed and replace the previous link", () => {
  const page = fixture();
  const received: string[] = [];
  const stop = watchEmailLink(page.browser, (token) => received.push(token));
  assert.deepEqual(received, []);
  page.location.hash = "#token=mock-first";
  page.events.dispatchEvent(new Event("hashchange"));
  assert.deepEqual(received, ["mock-first"]);
  assert.equal(page.location.hash, "");
  page.location.hash = "#token=mock-second";
  page.events.dispatchEvent(new Event("hashchange"));
  assert.deepEqual(received, ["mock-first", "mock-second"]);
  page.events.dispatchEvent(new Event("popstate"));
  assert.equal(received.length, 2);
  stop();
  page.location.hash = "#token=mock-unmounted";
  page.events.dispatchEvent(new Event("hashchange"));
  assert.equal(received.length, 2);
});

test("initial capture and Strict Mode resubscription do not erase the in-memory token", () => {
  const page = fixture("#token=mock-initial");
  const received: string[] = [];
  watchEmailLink(page.browser, (token) => received.push(token))();
  watchEmailLink(page.browser, (token) => received.push(token))();
  assert.deepEqual(received, ["mock-initial"]);
  const refreshed: string[] = [];
  watchEmailLink(page.browser, (token) => refreshed.push(token))();
  assert.deepEqual(refreshed, []);
});

test("history navigation captures links and invalid fragments clear rather than reuse tokens", () => {
  const page = fixture();
  const received: string[] = [];
  const stop = watchEmailLink(page.browser, (token) => received.push(token));
  page.location.hash = "#token=mock-history";
  page.events.dispatchEvent(new Event("popstate"));
  page.location.hash = "#other=value";
  page.events.dispatchEvent(new Event("hashchange"));
  page.location.hash = `#token=${"x".repeat(8193)}`;
  page.events.dispatchEvent(new Event("hashchange"));
  assert.deepEqual(received, ["mock-history", "", ""]);
  assert.equal(page.location.hash, "");
  stop();
});
