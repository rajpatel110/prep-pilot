"use client";
import { useEffect, useRef, useState } from "react";

type PendingNavigation =
  | { href: string; trigger: HTMLElement | null }
  | { href: null; trigger: HTMLElement };

export function UnsavedGuard({ dirty }: { dirty: boolean }) {
  const [pending, setPending] = useState<PendingNavigation | null>(null);
  const allowed = useRef(false);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (pending) {
      dialog.current?.showModal();
      dialog.current?.querySelector("button")?.focus();
    }
  }, [pending]);
  useEffect(() => {
    if (!dirty) return;
    const currentUrl = window.location.href;
    const currentHistory = window.history.state;
    function unload(event: BeforeUnloadEvent) {
      if (!allowed.current) {
        event.preventDefault();
        event.returnValue = "";
      }
    }
    function click(event: MouseEvent) {
      if (
        allowed.current ||
        event.button !== 0 ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey
      )
        return;
      const target = event.target instanceof Element ? event.target : null;
      const anchor = target?.closest("a[href]");
      const button = target?.closest("button");
      if (
        anchor instanceof HTMLAnchorElement &&
        anchor.target !== "_blank" &&
        !anchor.getAttribute("href")?.startsWith("#")
      ) {
        event.preventDefault();
        event.stopImmediatePropagation();
        setPending({ href: anchor.href, trigger: anchor });
      } else if (button?.textContent?.trim() === "Sign out") {
        event.preventDefault();
        event.stopImmediatePropagation();
        setPending({ href: null, trigger: button });
      }
    }
    function pop(event: PopStateEvent) {
      if (allowed.current) return;
      const href = window.location.href;
      event.stopImmediatePropagation();
      window.history.pushState(currentHistory, "", currentUrl);
      setPending({ href, trigger: null });
    }
    window.addEventListener("beforeunload", unload);
    window.addEventListener("popstate", pop, true);
    document.addEventListener("click", click, true);
    return () => {
      window.removeEventListener("beforeunload", unload);
      window.removeEventListener("popstate", pop, true);
      document.removeEventListener("click", click, true);
    };
  }, [dirty]);
  function stay() {
    dialog.current?.close();
    pending?.trigger?.focus();
    setPending(null);
  }
  function leave() {
    if (!pending) return;
    allowed.current = true;
    dialog.current?.close();
    if (pending.href !== null) window.location.assign(pending.href);
    else {
      pending.trigger.click();
      allowed.current = false;
      setPending(null);
    }
  }
  return pending ? (
    <dialog
      ref={dialog}
      className="library-dialog"
      aria-labelledby="unsaved-title"
      onCancel={(event) => {
        event.preventDefault();
        stay();
      }}
    >
      <h2 id="unsaved-title">Unsaved changes</h2>
      <p>
        Your local input has not been saved. Stay to continue editing or
        explicitly discard it and leave.
      </p>
      <div className="editor-actions">
        <button className="button" onClick={stay}>
          Stay and keep editing
        </button>
        <button className="button" onClick={leave}>
          Discard and leave
        </button>
      </div>
    </dialog>
  ) : null;
}
