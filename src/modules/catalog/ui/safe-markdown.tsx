import Markdown from "react-markdown";

export function safePreviewUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password
      ? url.href
      : "";
  } catch {
    return "";
  }
}

export function SafeMarkdown({ text }: { text: string }) {
  return (
    <div className="content-markdown">
      <Markdown
        skipHtml
        disallowedElements={["img"]}
        urlTransform={safePreviewUrl}
        components={{
          a: ({ href, children }) =>
            href ? (
              <a href={href} target="_blank" rel="noopener noreferrer">
                {children}{" "}
                <span className="sr-only">
                  (external link, opens in a new tab)
                </span>
              </a>
            ) : (
              <span>{children}</span>
            ),
        }}
      >
        {text.slice(0, 12000)}
      </Markdown>
    </div>
  );
}
