export function watchAccountReturn(
  view: Window & Pick<typeof globalThis, "BroadcastChannel">,
  refresh: () => void,
) {
  let pending: number | undefined;
  function invalidate() {
    if (view.document.visibilityState === "hidden") return;
    view.clearTimeout(pending);
    pending = view.setTimeout(refresh, 0);
  }
  function restored(event: Event) {
    if ((event as PageTransitionEvent).persisted) invalidate();
  }
  view.addEventListener("focus", invalidate);
  view.addEventListener("pageshow", restored);
  view.addEventListener("preppilot-account-change", invalidate);
  view.document.addEventListener("visibilitychange", invalidate);
  let channel: BroadcastChannel | undefined;
  try {
    const current = new view.BroadcastChannel("preppilot-account");
    current.addEventListener("message", invalidate);
    channel = current;
  } catch {}
  return () => {
    view.clearTimeout(pending);
    channel?.close();
    view.removeEventListener("focus", invalidate);
    view.removeEventListener("pageshow", restored);
    view.removeEventListener("preppilot-account-change", invalidate);
    view.document.removeEventListener("visibilitychange", invalidate);
  };
}
