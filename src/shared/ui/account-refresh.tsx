"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { watchAccountReturn } from "./account-events";

export function announceAccountChange() {
  window.dispatchEvent(new Event("preppilot-account-change"));
  try {
    const channel = new BroadcastChannel("preppilot-account");
    channel.postMessage("refresh");
    channel.close();
  } catch {}
}

export function AccountRefresh() {
  const router = useRouter();
  useEffect(() => watchAccountReturn(window, () => router.refresh()), [router]);
  return null;
}
