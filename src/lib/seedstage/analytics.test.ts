import assert from "node:assert/strict";
import test from "node:test";
import { record, type AnalyticsRecord } from "./analytics.ts";

test("analytics records only the event name and time", () => {
  const next = record([], "first_output", "2026-11-20T00:00:00.000Z");
  assert.deepEqual(next, [{ name: "first_output", at: "2026-11-20T00:00:00.000Z" }]);
  assert.equal(Object.keys(next[0]).join(","), "name,at");
});

test("analytics keeps the latest fifty events", () => {
  let events: AnalyticsRecord[] = [];
  for (let i = 0; i < 60; i += 1) events = record(events, "preview_started", String(i));
  assert.equal(events.length, 50);
  assert.equal(events[0].at, "10");
});
