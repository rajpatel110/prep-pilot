import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { SafeMarkdown } from "../src/modules/catalog/ui/safe-markdown";
const text =
  "# Safe heading\n\n<script>alert(1)</script>\n\n<img src=x onerror=alert(1)>\n\n[bad](javascript:alert%281%29)\n[entity](jav&#x61;script:alert%281%29)\n[credential](https://user:pass@example.com)\n[relative](/api/v1/me)\n![tracker](https://example.com/pixel)\n[good](https://example.com/practice)\n**bold**";
const html = renderToStaticMarkup(createElement(SafeMarkdown, { text }));
assert.ok(!html.includes("<script"));
assert.ok(!html.includes("<img"));
assert.ok(!html.includes('href="javascript'));
assert.ok(!html.includes('href="/api'));
assert.ok(!html.includes('href="https://user:pass'));
assert.ok(html.includes('href="https://example.com/practice"'));
assert.ok(html.includes('rel="noopener noreferrer"'));
assert.ok(html.includes("<strong>bold</strong>"));
