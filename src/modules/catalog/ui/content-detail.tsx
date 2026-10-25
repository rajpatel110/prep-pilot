"use client";

import { useEffect, useRef, useState } from "react";
import type { AdminContentDetail } from "../dto";
import Link from "next/link";
import { LifecycleControls } from "./lifecycle-controls";

export function ContentDetail({
  id,
  onClose,
  onChanged,
}: {
  id: string;
  onClose: () => void;
  onChanged: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [item, setItem] = useState<AdminContentDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  function close() {
    dialog.current?.close();
    onClose();
  }
  useEffect(() => {
    dialog.current?.showModal();
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/v1/admin/content/${id}`, {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        const value = await response.json();
        if (!response.ok)
          throw new Error(
            `${value.error?.message ?? "Content could not be loaded."} (${value.error?.code ?? response.status})`,
          );
        if (!controller.signal.aborted) setItem(value.data);
      })
      .catch((cause: unknown) => {
        if (!controller.signal.aborted)
          setError(
            cause instanceof Error ? cause.message : "Please try again.",
          );
      });
    return () => controller.abort();
  }, [id, attempt]);
  return (
    <dialog
      className="library-dialog"
      ref={dialog}
      aria-labelledby="content-detail-title"
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
    >
      <div className="library-detail-header">
        <p className="eyebrow">Saved admin record · read only</p>
        <button className="button button-outline" autoFocus onClick={close}>
          Close details
        </button>
      </div>
      <h2 id="content-detail-title">{item?.title ?? "Content details"}</h2>
      {!item && !error && <p role="status">Loading content details…</p>}
      {error && (
        <div role="alert">
          <p>{error}</p>
          <button
            className="button button-outline"
            onClick={() => {
              setError(null);
              setAttempt((value) => value + 1);
            }}
          >
            Retry details
          </button>
        </div>
      )}
      {item && (
        <>
          <nav className="editor-actions" aria-label="Content actions">
            <Link className="button" href={`/admin/content/${item.id}/edit`}>
              {item.status === "archived"
                ? "Manage archived content"
                : "Edit content"}
            </Link>
            <Link className="button" href={`/admin/content/${item.id}/preview`}>
              Admin preview
            </Link>
            <LifecycleControls
              item={item}
              onSaved={() => {
                dialog.current?.close();
                onChanged();
              }}
            />
          </nav>
          <dl className="library-detail-grid">
            {Object.entries({
              ID: item.id,
              Slug: item.slug,
              Status: item.status,
              Revision: item.revision,
              Subject: item.subject,
              Topic: item.topic,
              Type: item.type,
              Difficulty: item.difficulty,
              "Estimated minutes": item.estimatedMinutes,
              Tags: item.tags.join(", ") || "None",
              Source: item.source,
              Attribution: item.attribution || "None",
              Reviewed: item.reviewedAt ?? "Not reviewed",
              Created: item.createdAt,
              Updated: item.updatedAt,
              Published: item.publishedAt ?? "Never",
              Archived: item.archivedAt ?? "Never",
              "External URL": item.externalUrl ?? "None",
            }).map(([key, value]) => (
              <div key={key}>
                <dt>{key}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
          <h3>Company provenance</h3>
          {item.companies.length ? (
            item.companies.map((company) => (
              <div key={company.companyId} className="library-provenance">
                <p>
                  {company.companyId} ·{" "}
                  {company.association.replaceAll("_", " ")}
                </p>
                <p>Source: {company.source}</p>
                <p>Reviewed: {company.reviewedAt}</p>
              </div>
            ))
          ) : (
            <p>Shared foundation — no company association.</p>
          )}
          {[
            ["Prompt", item.prompt],
            ["Body", item.body],
            ["Explanation", item.explanation],
          ].map(([title, text]) => (
            <section key={title}>
              <h3>{title}</h3>
              <p className="library-content-text">{text ?? "Not supplied"}</p>
            </section>
          ))}
          <h3>Attachments</h3>
          {item.attachments.length ? (
            item.attachments.map((asset) => (
              <p key={asset.id}>
                {asset.displayName} · {asset.status} ·{" "}
                {asset.sizeBytes ?? "pending"} bytes
              </p>
            ))
          ) : (
            <p>No attachments.</p>
          )}
          <p className="library-help">
            This is saved-record inspection, not the student-view preview. Text
            is displayed as plain text; links are not executed.
          </p>
        </>
      )}
    </dialog>
  );
}
