"use client";
import { useEffect, useState } from "react";
import type { FileDto } from "../schemas";
import { MAX_BYTES, fileMime } from "../schemas";
import { apiRequest, ApiRequestError } from "@/shared/ui/api-client";
import { AttachmentLink } from "./attachments";

type Grant = {
  assetId: string;
  uploadUrl: string;
  headers: Record<string, string>;
  uploadUrlExpiresAt: string;
  finalizeBy: string;
};
export function FileManager({
  enabled,
  selected,
  onSelect,
  disabled = false,
}: {
  enabled: boolean;
  selected?: string[];
  onSelect?: (ids: string[]) => void;
  disabled?: boolean;
}) {
  const [items, setItems] = useState<FileDto[]>([]),
    [file, setFile] = useState<File | null>(null),
    [grant, setGrant] = useState<Grant | null>(null);
  const [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [blocked, setBlocked] = useState(false),
    [cursor, setCursor] = useState<string | null>(null);
  const [inputVersion, setInputVersion] = useState(0);
  async function load(more = false) {
    const response = await apiRequest(
      `/api/v1/admin/files?limit=20${more && cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""}`,
    );
    setItems((previous) =>
      more ? [...previous, ...response.data] : response.data,
    );
    setCursor(response.meta.page.nextCursor);
    return response.data as FileDto[];
  }
  useEffect(() => {
    let active = true;
    void apiRequest("/api/v1/admin/files?limit=20")
      .then((response) => {
        if (active) {
          setItems(response.data);
          setCursor(response.meta.page.nextCursor);
        }
      })
      .catch(() => {
        if (active)
          setMessage("File metadata could not be loaded. Refresh to retry.");
      });
    return () => {
      active = false;
    };
  }, []);
  async function action(work: () => Promise<void>) {
    if (busy) return;
    setBusy(true);
    setMessage("");
    try {
      await work();
    } catch (error) {
      setMessage(
        error instanceof ApiRequestError
          ? error.message
          : "Transfer could not be confirmed. Read file status before retrying; your selected file is preserved.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function upload() {
    if (!file) return;
    if (
      !fileMime.safeParse(file.type).success ||
      file.size < 1 ||
      file.size > MAX_BYTES
    ) {
      setMessage("Choose a nonempty PDF, PNG, JPEG or WebP file up to 10 MiB.");
      return;
    }
    await action(async () => {
      let current = grant;
      if (!current) {
        try {
          current = (
            await apiRequest("/api/v1/admin/files/uploads", "POST", {
              filename: file.name,
              declaredMime: file.type,
              declaredBytes: file.size,
            })
          ).data;
          setGrant(current);
        } catch (error) {
          if (error instanceof ApiRequestError && error.uncertain)
            setBlocked(true);
          throw error;
        }
      }
      if (!current) return;
      const status = (
        await apiRequest(`/api/v1/admin/files/${current.assetId}`)
      ).data as FileDto;
      if (status.status === "ready") {
        setMessage(
          "The upload is already ready. Select it below and save the content.",
        );
        await load();
        return;
      }
      if (status.status === "validating") {
        setMessage(
          "Finalization may still be running. Refresh status; do not send another upload.",
        );
        await load();
        return;
      }
      if (new Date(current.uploadUrlExpiresAt).getTime() <= Date.now()) {
        setMessage(
          "The transfer URL expired. Clean up the old reservation after its deadline, then explicitly start a new upload.",
        );
        await load();
        return;
      }
      const response = await fetch(current.uploadUrl, {
        method: "PUT",
        headers: current.headers,
        body: file,
        credentials: "omit",
        referrerPolicy: "no-referrer",
        signal: AbortSignal.timeout(60000),
      });
      if (!response.ok) throw new Error("Transfer failed");
      await apiRequest(
        `/api/v1/admin/files/${current.assetId}/finalize`,
        "POST",
        {},
      );
      await load();
      setMessage(
        "File is ready. Select it below and save the content to attach it.",
      );
    });
  }
  return (
    <section className="student-card" aria-busy={busy}>
      <h2>Attachments and uploads</h2>
      <p>
        PDF, PNG, JPEG or WebP · maximum 10 MiB · content allows five
        attachments. Uploading does not attach or publish a file.
      </p>
      {!enabled && (
        <p role="status">
          Files are disabled. Metadata remains available; no transfer or
          download will be attempted.
        </p>
      )}
      <label>
        Choose an attachment
        <input
          key={inputVersion}
          type="file"
          accept="application/pdf,image/png,image/jpeg,image/webp"
          disabled={!enabled || busy || disabled || !!grant || blocked}
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
        />
      </label>
      <div className="editor-actions">
        <button
          type="button"
          className="button"
          disabled={!enabled || !file || busy || disabled || blocked}
          onClick={() => void upload()}
        >
          {busy
            ? "Working…"
            : grant
              ? "Retry transfer after checking status"
              : "Upload and finalize"}
        </button>
        <button
          type="button"
          className="button"
          disabled={busy}
          onClick={() =>
            void action(async () => {
              await load();
              setMessage(
                "Metadata refreshed. Inspect pending grants before explicitly retrying.",
              );
            })
          }
        >
          Refresh status
        </button>
        <button
          type="button"
          disabled={busy || disabled}
          onClick={() => {
            setGrant(null);
            setFile(null);
            setInputVersion((version) => version + 1);
            setBlocked(false);
            setMessage(
              "New upload explicitly unlocked. Existing reservations remain visible and require cleanup after expiry.",
            );
          }}
        >
          Start another file after inspection
        </button>
      </div>
      {blocked && (
        <p role="alert">
          Grant outcome unknown. Inspect the file list before creating another
          reservation.
        </p>
      )}
      {grant && (
        <p>
          Current asset: {grant.assetId} · finalize by {grant.finalizeBy}
        </p>
      )}
      {message && <p role="status">{message}</p>}
      {selected?.length ? (
        <div>
          <p>
            Selected IDs: {selected.join(", ")}. Omitted selections are
            preserved when saving other fields.
          </p>
          {selected.map((id) => (
            <button
              key={id}
              type="button"
              disabled={busy || disabled}
              onClick={() =>
                onSelect?.(selected.filter((value) => value !== id))
              }
            >
              Detach {id}
            </button>
          ))}
        </div>
      ) : null}
      {!items.length && <p>No file metadata in this page.</p>}
      <ul>
        {items.map((item) => (
          <li key={item.id}>
            <p>
              {item.displayName} · {item.status} ·{" "}
              {item.errorCode ?? "No processing error"}
            </p>
            {onSelect && selected && (
              <label>
                <input
                  type="checkbox"
                  checked={selected.includes(item.id)}
                  disabled={
                    busy ||
                    disabled ||
                    (!selected.includes(item.id) &&
                      (!["uploading", "validating", "ready"].includes(
                        item.status,
                      ) ||
                        selected.length >= 5))
                  }
                  onChange={(event) =>
                    onSelect(
                      event.target.checked
                        ? [...selected, item.id]
                        : selected.filter((id) => id !== item.id),
                    )
                  }
                />
                Attach {item.displayName}
              </label>
            )}
            {["uploading", "validating"].includes(item.status) && (
              <button
                type="button"
                disabled={!enabled || busy || disabled}
                onClick={() =>
                  void action(async () => {
                    const response = await apiRequest(
                      `/api/v1/admin/files/${item.id}/finalize`,
                      "POST",
                      {},
                    );
                    await load();
                    setMessage(
                      `File status confirmed: ${response.data.status}.`,
                    );
                  })
                }
              >
                Finalize / retry eligible processing
              </button>
            )}
            {item.status === "ready" && (
              <AttachmentLink asset={item} admin enabled={enabled} />
            )}
            {item.status !== "deleted" && (
              <button
                type="button"
                disabled={
                  !enabled || busy || disabled || !!selected?.includes(item.id)
                }
                onClick={() => {
                  if (
                    window.confirm(
                      "Remove this unreferenced file? Referenced files and active uploads will be skipped.",
                    )
                  )
                    void action(async () => {
                      const response = await apiRequest(
                        "/api/v1/admin/files/cleanup",
                        "POST",
                        { assetIds: [item.id] },
                      );
                      await load();
                      setMessage(
                        `Cleanup ${response.data.results[0].outcome}: ${response.data.results[0].code ?? "complete"}.`,
                      );
                    });
                }}
              >
                Clean up unreferenced file
              </button>
            )}
          </li>
        ))}
      </ul>
      {cursor && (
        <button
          type="button"
          disabled={busy}
          onClick={() =>
            void action(async () => {
              await load(true);
            })
          }
        >
          Load more files
        </button>
      )}
    </section>
  );
}
