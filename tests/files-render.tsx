import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { FileManager } from "../src/modules/files/ui/file-manager";
import { AttachmentLink } from "../src/modules/files/ui/attachments";

const disabled = renderToStaticMarkup(
  createElement(FileManager, { enabled: false }),
);
assert.match(disabled, /Files are disabled/);
assert.match(disabled, /disabled=""/);
assert.match(disabled, /application\/pdf,image\/png,image\/jpeg,image\/webp/);
assert.match(disabled, /Refresh status/);
assert.ok(!disabled.includes("uploadUrl"));
const editor = renderToStaticMarkup(
  createElement(FileManager, {
    enabled: true,
    selected: ["507f1f77bcf86cd799439011"],
    onSelect: () => {},
  }),
);
assert.match(editor, /Detach 507f1f77bcf86cd799439011/);
assert.match(editor, /Upload and finalize/);
assert.match(editor, /Start another file after inspection/);
const attachment = renderToStaticMarkup(
  createElement(AttachmentLink, {
    asset: {
      id: "507f1f77bcf86cd799439011",
      displayName: "Original.pdf",
      mimeType: "application/pdf",
      sizeBytes: 42,
    },
    enabled: false,
  }),
);
assert.match(attachment, /Original.pdf/);
assert.match(attachment, /disabled=""/);
assert.ok(!attachment.includes("https://"));
console.log(
  "PASS attachment UI render contracts: honest disabled states, allowlisted formats, status/recovery controls, selection removal and no preissued signed links. Not interactive browser evidence.",
);
