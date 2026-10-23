import { test } from "node:test";
import assert from "node:assert/strict";
import { prepareAuthEnvironment } from "../scripts/auth-environment";

test("setup enables copied example configuration and fills empty secrets", () => {
  const result = prepareAuthEnvironment(
    'AUTH_ENABLED=false\r\nBETTER_AUTH_SECRET=""\r\nCSRF_SECRET=\r\nRATE_LIMIT_SECRET=\r\nEMAIL_MODE=test\r\nMONGODB_URI=private-placeholder\r\n',
  );
  assert.match(result, /^AUTH_ENABLED=true$/m);
  for (const key of ["BETTER_AUTH_SECRET", "CSRF_SECRET", "RATE_LIMIT_SECRET"])
    assert.match(result, new RegExp(`^${key}=[A-Za-z0-9_-]{64}$`, "m"));
  assert.match(result, /MONGODB_URI=private-placeholder/);
  assert.equal(prepareAuthEnvironment(result), result);
});
test("setup preserves existing credentials and live mode", () => {
  const current =
    'AUTH_ENABLED=false\nBETTER_AUTH_SECRET="existing-secret"\nCSRF_SECRET=existing-csrf\nRATE_LIMIT_SECRET=existing-rate\nEMAIL_MODE=live\nMONGODB_URI=private-placeholder\n';
  assert.equal(
    prepareAuthEnvironment(current),
    current.replace("AUTH_ENABLED=false", "AUTH_ENABLED=true"),
  );
});
