import assert from "node:assert/strict";
import test from "node:test";
import { projectPlan, suggestedRaise, type PlanAssumptions } from "./cash.ts";

const base: PlanAssumptions = {
  currency: "GBP",
  horizonMonths: 4,
  openingCashMinor: 10_000,
  bufferMinor: 4_000,
  startingReceiptsMinor: 0,
  receiptGrowthBps: 0,
  confirmedThroughMonth: 0,
  receiptDelayMonths: 0,
  payrollMinor: 3_000,
  opexMinor: 0,
  hiringStartMonth: 9,
  hiringExtraMinor: 0,
  hiringDelayMonths: 0,
  financingMonth: null,
  financingAmountMinor: 0,
};

test("runway walks the bridge instead of dividing by average burn", () => {
  const plan = projectPlan(base);
  assert.equal(plan.ok, true);
  if (!plan.ok) return;
  assert.equal(plan.usesAverageBurn, false);
  assert.equal(plan.rows[0].closingMinor, 7_000);
  assert.equal(plan.rows[1].closingMinor, 4_000);
  assert.equal(plan.rows[2].closingMinor, 1_000);
  assert.equal(plan.runwayMonths, 2);
});

test("zero burn never crosses the buffer inside the horizon", () => {
  const plan = projectPlan({ ...base, payrollMinor: 0, bufferMinor: 1_000 });
  assert.equal(plan.ok, true);
  if (!plan.ok) return;
  assert.equal(plan.runwayMonths, null);
  assert.equal(plan.rows.every((row) => row.closingMinor === 10_000), true);
});

test("cash-positive months rise and delays shift receipts", () => {
  const rising = projectPlan({
    ...base,
    payrollMinor: 1_000,
    startingReceiptsMinor: 2_000,
    confirmedThroughMonth: 4,
    bufferMinor: 1_000,
  });
  assert.equal(rising.ok, true);
  if (!rising.ok) return;
  assert.ok(rising.rows[3].closingMinor > rising.rows[0].closingMinor);

  const delayed = projectPlan({
    ...base,
    payrollMinor: 0,
    startingReceiptsMinor: 5_000,
    confirmedThroughMonth: 4,
    receiptDelayMonths: 2,
    bufferMinor: 0,
  });
  assert.equal(delayed.ok, true);
  if (!delayed.ok) return;
  assert.equal(delayed.rows[0].receiptsConfirmedMinor, 0);
  assert.equal(delayed.rows[2].receiptsConfirmedMinor, 5_000);
});

test("suggested raise is the smallest amount that clears the buffer", () => {
  const suggestion = suggestedRaise(base, 0);
  assert.equal(suggestion.amountMinor, 6_000);
  const cleared = projectPlan({ ...base, financingMonth: 0, financingAmountMinor: 6_000 });
  assert.equal(cleared.ok, true);
  if (!cleared.ok) return;
  assert.equal(cleared.firstShortfallIndex, null);
  const shy = projectPlan({ ...base, financingMonth: 0, financingAmountMinor: 5_999 });
  assert.equal(shy.ok, true);
  if (!shy.ok) return;
  assert.notEqual(shy.firstShortfallIndex, null);
});

test("negative cash is shown rather than clamped", () => {
  const plan = projectPlan({ ...base, horizonMonths: 6, bufferMinor: 0 });
  assert.equal(plan.ok, true);
  if (!plan.ok) return;
  assert.ok(plan.minClosingMinor < 0);
  assert.equal(plan.rows.some((row) => row.negative), true);
});
