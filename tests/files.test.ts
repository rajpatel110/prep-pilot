import assert from "node:assert/strict";
import { test } from "node:test";
import { getServerEnv } from "../src/shared/server/env";
import { validateBytes } from "../src/modules/files/validation";
import { boundedRead, r2Storage } from "../src/modules/files/storage";
import {
  MAX_BYTES,
  filename,
  uploadInput,
  fileRecord,
  quotaRecord,
} from "../src/modules/files/schemas";
import { mockPdf } from "./files-mock";

test("files default off, enabled configuration fails closed and never selects a mock", () => {
  const disabled = getServerEnv({});
  assert.equal(disabled.FILES_ENABLED, false);
  assert.throws(() => getServerEnv({ FILES_ENABLED: "true" }));
  assert.throws(() => r2Storage(disabled));
});
test("strict upload limits, sanitized filenames and content signatures", () => {
  assert.equal(
    uploadInput.safeParse({
      filename: "a.pdf",
      declaredMime: "application/pdf",
      declaredBytes: MAX_BYTES,
    }).success,
    true,
  );
  for (const patch of [
    { declaredBytes: 0 },
    { declaredBytes: MAX_BYTES + 1 },
    { declaredMime: "image/svg+xml" },
    { key: "chosen" },
  ])
    assert.equal(
      uploadInput.safeParse({
        filename: "a.pdf",
        declaredMime: "application/pdf",
        declaredBytes: 1,
        ...patch,
      }).success,
      false,
    );
  assert.equal(
    validateBytes(mockPdf, "application/pdf").actualBytes,
    mockPdf.length,
  );
  for (const bytes of [
    Buffer.alloc(0),
    Buffer.from("<script>bad</script>"),
    Buffer.from("%PDF-fake"),
  ])
    assert.throws(() => validateBytes(bytes, "application/pdf"));
  assert.throws(() => validateBytes(mockPdf, "image/png"));
  const png = Buffer.alloc(24);
  Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]).copy(png);
  png.write("IHDR", 12);
  assert.equal(validateBytes(png, "image/png").detectedMime, "image/png");
  assert.equal(
    validateBytes(Buffer.from([255, 216, 255, 0, 255, 217]), "image/jpeg")
      .detectedMime,
    "image/jpeg",
  );
  const webp = Buffer.alloc(20);
  webp.write("RIFF");
  webp.writeUInt32LE(12, 4);
  webp.write("WEBPVP8 ", 8);
  assert.equal(validateBytes(webp, "image/webp").detectedMime, "image/webp");
  assert.ok(!/[\r\n/\\"]/.test(filename('../../bad\r\n".pdf')));
});
test("bounded reads stop at oversize and return inspected bytes only", async () => {
  let consumed = 0;
  const source = (async function* () {
    consumed++;
    yield Buffer.alloc(MAX_BYTES);
    consumed++;
    yield Buffer.alloc(1);
    consumed++;
    yield Buffer.alloc(100);
  })();
  await assert.rejects(() => boundedRead(source, AbortSignal.timeout(1000)), {
    code: "FILE_TOO_LARGE",
  });
  assert.equal(consumed, 2);
  const bytes = await boundedRead(
    (async function* () {
      yield mockPdf;
    })(),
    AbortSignal.timeout(1000),
  );
  assert.deepEqual(bytes, mockPdf);
});

test("offline SDK signing uses only the documented browser header and short expiries", async () => {
  const config = getServerEnv({
    AUTH_ENABLED: "true",
    MONGODB_URI: "mongodb://localhost",
    MONGODB_DB_NAME: "signing_unit",
    BETTER_AUTH_SECRET: "a".repeat(32),
    CSRF_SECRET: "b".repeat(32),
    RATE_LIMIT_SECRET: "c".repeat(32),
    FILES_ENABLED: "true",
    R2_ACCOUNT_ID: "0".repeat(32),
    R2_BUCKET: "unit-private",
    R2_ACCESS_KEY_ID: "mock-key",
    R2_SECRET_ACCESS_KEY: "mock-secret",
  });
  const storage = r2Storage(config);
  const put = new URL(
    await storage.signPut("staging/unit/fixture", "application/pdf"),
  );
  assert.equal(put.searchParams.get("X-Amz-Expires"), "300");
  assert.equal(
    put.searchParams.get("X-Amz-SignedHeaders"),
    "content-type;host",
  );
  const get = new URL(
    await storage.signGet(
      "final/unit/fixture",
      "application/pdf",
      "original.pdf",
    ),
  );
  assert.equal(get.searchParams.get("X-Amz-Expires"), "60");
  assert.match(
    get.searchParams.get("response-content-disposition")!,
    /^attachment;/,
  );
});

test("file lifecycle records and quota arithmetic reject incompatible states", () => {
  const id = "507f1f77bcf86cd799439011",
    date = new Date();
  const base = {
    _id: id,
    createdBy: "fixture",
    displayName: "fixture.pdf",
    stagingKey: `staging/${id}/fixture`,
    declaredMime: "application/pdf",
    declaredBytes: 1,
    status: "uploading",
    expiresAt: date,
    leaseId: null,
    leaseUntil: null,
    reservationBytes: MAX_BYTES,
    reservationState: "reserved",
    readyAt: null,
    deletedAt: null,
    schemaVersion: 1,
    createdAt: date,
    updatedAt: date,
  };
  assert.equal(fileRecord.safeParse(base).success, true);
  for (const change of [
    { status: "ready" },
    { status: "validating" },
    { reservationState: "released" },
    { stagingKey: "staging/another/fixture" },
  ])
    assert.equal(fileRecord.safeParse({ ...base, ...change }).success, false);
  const quota = {
    _id: "r2",
    readyBytes: 0,
    readyCount: 0,
    reservedBytes: MAX_BYTES,
    reservedCount: 1,
    limitBytes: 524288000,
    limitCount: 100,
    schemaVersion: 1,
    createdAt: date,
    updatedAt: date,
  };
  assert.equal(quotaRecord.safeParse(quota).success, true);
  assert.equal(
    quotaRecord.safeParse({ ...quota, reservedBytes: 1 }).success,
    false,
  );
});
