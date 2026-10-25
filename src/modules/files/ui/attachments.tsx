"use client";
import { useEffect, useState } from "react";
import { apiRequest } from "@/shared/ui/api-client";

export function AttachmentLink({
  asset,
  contentId,
  admin = false,
  enabled = true,
}: {
  asset: {
    id: string;
    displayName: string;
    mimeType: string | null;
    sizeBytes: number | null;
  };
  contentId?: string;
  admin?: boolean;
  enabled?: boolean;
}) {
  const [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  const [grant, setGrant] = useState<{ url: string; expiresAt: string } | null>(
    null,
  );
  useEffect(() => {
    if (!grant) return;
    const timer = setTimeout(
      () => setGrant(null),
      Math.max(0, new Date(grant.expiresAt).getTime() - Date.now()),
    );
    return () => clearTimeout(timer);
  }, [grant]);
  async function request() {
    setBusy(true);
    setMessage("");
    setGrant(null);
    try {
      const response = await apiRequest(
        admin
          ? `/api/v1/admin/files/${asset.id}/preview`
          : `/api/v1/files/${asset.id}/download`,
        "POST",
        admin ? {} : { contentId },
      );
      setGrant(response.data);
    } catch {
      setMessage(
        "Attachment unavailable. Check your session and file availability before requesting again.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="attachment-item">
      <p>
        {asset.displayName} · {asset.mimeType ?? "Unverified format"} ·{" "}
        {asset.sizeBytes === null ? "Size pending" : `${asset.sizeBytes} bytes`}
      </p>
      <button
        className="button"
        type="button"
        disabled={!enabled || busy}
        onClick={() => void request()}
      >
        {busy
          ? "Preparing link…"
          : admin
            ? "Request admin file preview"
            : "Request download"}
      </button>
      {!enabled && <p>Files are disabled in this environment.</p>}
      {grant && (
        <p>
          <a
            href={grant.url}
            target="_blank"
            rel="noopener noreferrer"
            referrerPolicy="no-referrer"
          >
            Open attachment (short-lived link; new tab)
          </a>
        </p>
      )}
      {message && <p role="alert">{message}</p>}
    </div>
  );
}
