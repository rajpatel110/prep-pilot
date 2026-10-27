export function initializeHomeReveals(root: HTMLElement) {
  const document = root.ownerDocument;
  const view = document.defaultView;
  if (!view || !view.IntersectionObserver || !view.matchMedia) return () => {};

  const targets = Array.from(
    root.querySelectorAll<HTMLElement>("[data-home-reveal]"),
  ).filter(
    (target) =>
      !target.querySelector(
        "a, button, input, select, textarea, summary, img",
      ) && !target.matches("a, button, input, select, textarea, summary, img"),
  );
  let observer: IntersectionObserver | undefined;
  const seen = new Set<HTMLElement>();
  const removers: (() => void)[] = [];

  function reveal(target: HTMLElement) {
    seen.add(target);
    target.removeAttribute("data-revealing");
    observer?.unobserve(target);
  }

  function revealAll() {
    targets.forEach(reveal);
    observer?.disconnect();
  }

  function revealViewport() {
    targets.forEach((target) => {
      if (target.getBoundingClientRect().top < view!.innerHeight)
        reveal(target);
    });
  }

  function revealRelated(node: Element) {
    targets.forEach((target) => {
      if (target === node || node.contains(target) || target.contains(node))
        reveal(target);
    });
  }

  function revealHash(hash = view!.location.hash) {
    try {
      const destination = document.getElementById(
        decodeURIComponent(hash.slice(1)),
      );
      if (destination) revealRelated(destination);
    } catch {}
  }

  function listen(source: EventTarget, name: string, listener: EventListener) {
    source.addEventListener(name, listener);
    removers.push(() => source.removeEventListener(name, listener));
  }

  function cleanup() {
    observer?.disconnect();
    targets.forEach((target) => target.removeAttribute("data-revealing"));
    removers.forEach((remove) => remove());
  }

  try {
    const media = view.matchMedia("(prefers-reduced-motion: reduce)");
    if (media.matches) return cleanup;

    observer = new view.IntersectionObserver(
      (entries) => {
        try {
          entries.forEach((entry) => {
            const target = entry.target as HTMLElement;
            if (!entry.isIntersecting || seen.has(target)) return;
            reveal(target);
            if (
              !media.matches &&
              document.visibilityState !== "hidden" &&
              entry.boundingClientRect.top >= 0
            )
              target.setAttribute("data-revealing", "");
          });
        } catch {
          revealAll();
        }
      },
      { threshold: 0, rootMargin: "0px 0px -64px 0px" },
    );

    revealViewport();
    revealHash();
    targets.forEach((target) => {
      if (!seen.has(target)) observer!.observe(target);
    });

    listen(media, "change", () => {
      if (media.matches) revealAll();
    });
    listen(view, "hashchange", () => {
      revealHash();
      revealViewport();
    });
    listen(view, "popstate", revealAll);
    listen(view, "pageshow", (event) => {
      if ((event as PageTransitionEvent).persisted) revealAll();
      else {
        revealViewport();
        revealHash();
      }
    });
    listen(document, "click", (event) => {
      const node = event.target as Element | null;
      const link = node?.closest?.("a[href]");
      if (!link) return;
      try {
        const url = new URL(link.getAttribute("href")!, view.location.href);
        if (
          url.origin === view.location.origin &&
          url.pathname === view.location.pathname &&
          url.search === view.location.search &&
          url.hash
        )
          revealHash(url.hash);
      } catch {}
    });
    listen(root, "focusin", (event) => {
      const node = event.target as Element | null;
      if (node?.closest) revealRelated(node.closest("section") ?? node);
    });
    listen(root, "animationend", (event) => {
      const node = event.target as Element | null;
      const target = node?.closest?.<HTMLElement>("[data-home-reveal]");
      if (target && targets.includes(target)) reveal(target);
    });
  } catch {
    cleanup();
  }

  return cleanup;
}
