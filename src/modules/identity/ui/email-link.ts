export function watchEmailLink(
  browser: Pick<
    Window,
    "location" | "history" | "addEventListener" | "removeEventListener"
  >,
  receive: (token: string) => void,
) {
  function capture() {
    if (!browser.location.hash) return;
    const token =
      new URLSearchParams(browser.location.hash.slice(1)).get("token") ?? "";
    browser.history.replaceState(
      browser.history.state,
      "",
      browser.location.pathname + browser.location.search,
    );
    receive(token.length <= 8192 ? token : "");
  }
  browser.addEventListener("hashchange", capture);
  browser.addEventListener("popstate", capture);
  capture();
  return () => {
    browser.removeEventListener("hashchange", capture);
    browser.removeEventListener("popstate", capture);
  };
}
