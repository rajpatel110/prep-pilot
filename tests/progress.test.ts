import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";
test("Progress renders honest empty scopes, no zero-denominator percentage and text equivalents for outcome bars", () => {
  const result = spawnSync(
    process.execPath,
    ["--import", "tsx", "tests/progress-render.tsx"],
    {
      encoding: "utf8",
      env: { ...process.env, TSX_TSCONFIG_PATH: "tests/tsconfig.render.json" },
    },
  );
  assert.equal(result.status, 0, result.stderr || result.stdout);
});
