import assert from "node:assert/strict";
import test from "node:test";
import { GOLDEN_ROUND, modelPricedRound, unsupportedInstrument } from "./round.ts";

test("golden pre-money pool reconciles shares and proceeds", () => {
  const result = modelPricedRound(GOLDEN_ROUND);
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.holderShares + result.investorShares + result.unallocatedAfter, result.totalShares);
  assert.ok(result.investorShares > 0);
  assert.ok(result.poolTopUp >= 0);
  assert.ok(Math.abs(result.proceedsDeltaMinor) <= Math.ceil(GOLDEN_ROUND.preMoneyMinor / GOLDEN_ROUND.existingShares));
  assert.ok(Math.abs(result.investorBps - result.targetInvestorBps) <= 5);
  assert.equal(result.holderBps + result.investorBps + result.poolBps >= 9998, true);
});

test("zero investment issues nothing", () => {
  const result = modelPricedRound({ ...GOLDEN_ROUND, investmentMinor: 0 });
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.investorShares, 0);
  assert.equal(result.poolTopUp, 0);
  assert.equal(result.totalShares, GOLDEN_ROUND.existingShares);
  assert.equal(result.proceedsMinor, 0);
});

test("a larger investment does not shrink investor ownership", () => {
  const low = modelPricedRound({ ...GOLDEN_ROUND, investmentMinor: 800_000_00 });
  const high = modelPricedRound({ ...GOLDEN_ROUND, investmentMinor: 1_600_000_00 });
  assert.equal(low.ok && high.ok, true);
  if (!low.ok || !high.ok) return;
  assert.ok(high.investorBps > low.investorBps);
  assert.ok(high.investorShares > low.investorShares);
});

test("post-money pool dilutes the new investor below the headline fraction", () => {
  const result = modelPricedRound({ ...GOLDEN_ROUND, mechanic: "post-money-pool" });
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.ok(result.poolTopUp > 0);
  assert.ok(result.investorBps < result.targetInvestorBps);
  assert.equal(result.holderShares + result.investorShares + result.unallocatedAfter, result.totalShares);
});

test("rejects a pool that consumes the company and blocks generic SAFEs", () => {
  const bad = modelPricedRound({ ...GOLDEN_ROUND, targetPoolBps: 9000, investmentMinor: 3_000_000_00 });
  assert.equal(bad.ok, false);
  const safe = unsupportedInstrument("SAFE");
  assert.equal(safe.ok, false);
  if (!safe.ok) assert.match(safe.reason, /not enabled/i);
});

test("no negative shares when the existing pool is already large", () => {
  const result = modelPricedRound({ ...GOLDEN_ROUND, unallocatedShares: 2_000_000, targetPoolBps: 500 });
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.poolTopUp, 0);
  assert.ok(result.holderShares >= 0);
  assert.ok(result.investorShares >= 0);
});
