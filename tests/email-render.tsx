import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { EmailPanel } from "../src/modules/identity/ui/email-panel";
const disabled = {
  deliveryMode: "disabled",
  emailMode: "test",
  passwordRecovery: false,
} as const;
const owner = {
  ...disabled,
  deliveryMode: "owner_test",
  passwordRecovery: true,
} as const;
const forgot = renderToStaticMarkup(
  createElement(EmailPanel, { mode: "forgot", availability: disabled }),
);
assert.match(forgot, /Email delivery is unavailable/);
assert.match(forgot, /Request reset link/);
assert.match(forgot, /disabled=""/);
assert.match(forgot, /autoComplete="email"/);
const reset = renderToStaticMarkup(
  createElement(EmailPanel, { mode: "reset", availability: owner }),
);
assert.match(reset, /Local owner-inbox testing only/);
assert.match(reset, /minLength="12"/);
assert.match(reset, /maxLength="128"/);
assert.match(reset, /Confirm new password/);
assert.match(reset, /resetting|Resetting/);
assert.ok(!reset.includes("Password reset confirmed"));
const verify = renderToStaticMarkup(
  createElement(EmailPanel, { mode: "verification", availability: owner }),
);
assert.match(verify, /Opening this page does not verify/);
assert.match(verify, /60 minutes/);
assert.ok(!verify.includes("verification confirmed"));
assert.ok(!verify.includes("#token="));
console.log(
  "PASS email screen render contracts: honest unavailable/owner-only states, passive verification, reset labels and password policy. Interactive/browser checks remain separate.",
);
