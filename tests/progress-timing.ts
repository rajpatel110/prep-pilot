import assert from "node:assert/strict";
import { performance } from "node:perf_hooks";

async function main() {
  const session = await fetch("http://127.0.0.1:3152/student", {
    redirect: "manual",
  });
  assert.equal(session.status, 302, "Disposable UI fixture must be running");
  const cookie = session.headers
    .getSetCookie()
    .map((value) => value.split(";")[0])
    .join("; ");
  assert.ok(cookie);
  for (let run = 1; run <= 3; run++) {
    const start = performance.now();
    const response = await fetch("http://127.0.0.1:3151/progress", {
      headers: { cookie },
    });
    assert.equal(response.status, 200);
    const headersMs = performance.now() - start;
    let shellMs: number | null = null;
    let metricsMs: number | null = null;
    let html = "";
    const decoder = new TextDecoder();
    const reader = response.body!.getReader();
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      html += decoder.decode(chunk.value, { stream: true });
      if (shellMs === null && /Loading progress|Your progress/.test(html))
        shellMs = performance.now() - start;
      if (metricsMs === null && html.includes("Summary as of "))
        metricsMs = performance.now() - start;
    }
    assert.notEqual(
      metricsMs,
      null,
      "Metrics must render, not an error or zero fallback",
    );
    console.log(
      JSON.stringify({
        run,
        headersMs: Math.round(headersMs),
        shellMs: Math.round(shellMs!),
        metricsMs: Math.round(metricsMs!),
        completeMs: Math.round(performance.now() - start),
      }),
    );
  }
}
main().catch(() => {
  console.error(
    "Disposable Progress timing failed; no credentials or response bodies logged.",
  );
  process.exitCode = 1;
});
