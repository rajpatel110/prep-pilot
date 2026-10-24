import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ProgressView } from "../src/modules/planning/ui/progress-view";
const empty = {
  asOf: "2026-10-24T00:00:00.000Z",
  studyDate: "2026-10-24",
  timezone: "Asia/Kolkata",
  stateRevision: 0,
  submissions: 0,
  practiceSubmissions: 0,
  revisionSubmissions: 0,
  distinctAttempted: 0,
  currentlySolved: 0,
  activePlan: null,
  historicalPlanVersions: 0,
  revisions: { due: 0, unavailable: 0 },
  topics: [],
};
const emptyHtml = renderToStaticMarkup(
  createElement(ProgressView, { data: empty }),
);
assert.match(emptyHtml, /No active plan/);
assert.match(emptyHtml, /No recorded question activity/);
assert.ok(!emptyHtml.includes("<progress"));
const html = renderToStaticMarkup(
  createElement(ProgressView, {
    data: {
      ...empty,
      submissions: 3,
      practiceSubmissions: 2,
      revisionSubmissions: 1,
      distinctAttempted: 1,
      activePlan: {
        id: "507f1f77bcf86cd799439011",
        windowStart: "2026-10-24",
        windowEnd: "2026-10-30",
        completed: 0,
        total: 0,
        completionPercent: null,
        readingCompleted: 0,
      },
      topics: [
        {
          subject: "dsa",
          topic: "arrays",
          distinctAttempted: 1,
          currentlySolved: 0,
          neededHelp: 0,
          failed: 1,
          readingCompleted: 2,
        },
      ],
    },
  }),
);
assert.match(html, /percentage not applicable/);
assert.match(
  html,
  /latest independent outcomes among distinct attempted questions/,
);
assert.match(html, /max="1"/);
assert.match(html, /value="0"/);
assert.match(html, /not graded|self-reported/);
assert.match(html, /No readiness score/);
