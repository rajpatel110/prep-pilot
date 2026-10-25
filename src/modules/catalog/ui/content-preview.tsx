import { SafeMarkdown, safePreviewUrl } from "./safe-markdown";
import type { FileDto } from "@/modules/files/schemas";
import { AttachmentLink } from "@/modules/files/ui/attachments";

export type PreviewContent = {
  title: string;
  subject: string;
  topic: string;
  type: string;
  difficulty: string;
  estimatedMinutes: number;
  status: string;
  revision?: number | undefined;
  prompt?: string | null;
  body?: string | null;
  explanation?: string | null;
  externalUrl?: string | null;
  source: string;
  attribution: string;
  attachments?: FileDto[];
  companies: {
    companyId: string;
    association: string;
    source: string;
    reviewedAt: string;
  }[];
};

export function ContentPreview({
  content,
  local = false,
  filesEnabled = false,
}: {
  content: PreviewContent;
  local?: boolean;
  filesEnabled?: boolean;
}) {
  const url = safePreviewUrl(content.externalUrl ?? "");
  return (
    <article className="content-preview">
      <p className="eyebrow">
        Admin preview ·{" "}
        {local ? "Unsaved local changes" : `Saved revision ${content.revision}`}
      </p>
      <p className="library-notice">
        {local
          ? "This local preview does not save content or change student availability. "
          : ""}
        {content.status === "published"
          ? "Saved published content is available through student reads."
          : `${content.status} content is unavailable to students.`}{" "}
        No attempts or task completions are recorded here.
      </p>
      <h2>{content.title || "Untitled content"}</h2>
      <p>
        {content.subject.toUpperCase()} · {content.topic.replaceAll("_", " ")} ·{" "}
        {content.type} · {content.difficulty} · {content.estimatedMinutes}{" "}
        minutes
      </p>
      {content.prompt && (
        <section>
          <h3>Question</h3>
          <SafeMarkdown text={content.prompt} />
        </section>
      )}
      {content.body && (
        <section>
          <h3>Resource</h3>
          <SafeMarkdown text={content.body} />
        </section>
      )}
      {url && (
        <p>
          <a
            className="button"
            href={url}
            target="_blank"
            rel="noopener noreferrer"
          >
            {content.type === "question"
              ? "External practice link"
              : "External resource link"}{" "}
            (new tab)
          </a>
        </p>
      )}
      {content.explanation && (
        <details key={content.explanation}>
          <summary>Reveal explanation</summary>
          <SafeMarkdown text={content.explanation} />
        </details>
      )}
      <h3>Source and attribution</h3>
      {!!content.attachments?.length && (
        <section>
          <h3>Saved attachments</h3>
          {content.attachments.map((asset) => (
            <div key={asset.id}>
              <p>
                {asset.displayName} · {asset.status}
              </p>
              {asset.status === "ready" && (
                <AttachmentLink asset={asset} admin enabled={filesEnabled} />
              )}
            </div>
          ))}
        </section>
      )}
      <p>{content.source || "No source yet"}</p>
      <p>{content.attribution || "No attribution notes"}</p>
      <h3>Company provenance</h3>
      {content.companies.length ? (
        content.companies.map((company) => (
          <div key={company.companyId}>
            <p>
              {company.companyId} · {company.association.replaceAll("_", " ")}
            </p>
            <p>
              {company.source} · reviewed {company.reviewedAt || "not set"}
            </p>
          </div>
        ))
      ) : (
        <p>Shared foundation content.</p>
      )}
    </article>
  );
}
