"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
export function RefreshStudy({
  label = "Refresh progress",
}: {
  label?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <button
      className="button button-outline"
      disabled={pending}
      aria-busy={pending}
      onClick={() => startTransition(() => router.refresh())}
    >
      {pending ? "Refreshing…" : label}
    </button>
  );
}
