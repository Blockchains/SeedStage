import assert from "node:assert/strict";
import test from "node:test";
import { exploreMetrics } from "./metrics.ts";
import { GOLDEN_ROUND } from "./round.ts";
import type { Claim, Investor } from "./types.ts";
import type { PlanAssumptions } from "./cash.ts";

const plan: PlanAssumptions = {
  currency: "GBP",
  horizonMonths: 6,
  openingCashMinor: 41_000_000,
  bufferMinor: 8_000_000,
  startingReceiptsMinor: 0,
  receiptGrowthBps: 0,
  confirmedThroughMonth: 6,
  receiptDelayMonths: 0,
  payrollMinor: 20_000_000,
  opexMinor: 5_000_000,
  hiringStartMonth: 6,
  hiringExtraMinor: 0,
  hiringDelayMonths: 0,
  financingMonth: null,
  financingAmountMinor: 0,
};

function investor(over: Partial<Investor>): Investor {
  return {
    id: "a",
    firm: "A",
    fund: "A",
    partner: null,
    stages: ["seed"],
    geos: ["United Kingdom"],
    geoExclusions: [],
    sectors: [],
    sectorExclusions: [],
    sectorExclusive: false,
    chequeMinMinor: 0,
    chequeMaxMinor: 0,
    participation: "unstated",
    themes: [],
    portfolio: [],
    activityDate: null,
    source: "Company site",
    sourceUrl: "https://example.com",
    sourceDate: "2026-11-20",
    excerpt: "",
    note: "",
    logo: "",
    synthetic: false,
    confirmed: false,
    currency: "GBP",
    ...over,
  };
}

test("a pending MRR claim is not shown as a metric", () => {
  const claim = {
    id: "m",
    text: "MRR",
    metricKey: "mrr",
    period: "2026-03",
    value: 1_840_000,
    unit: "money_minor",
    currency: "GBP",
    kind: "historical",
    observed: "observed",
    status: "pending",
    sourceId: "d",
    extraction: "deterministic_fixture",
    confidenceNote: "",
    evidenceQuote: "MRR",
    updatedAt: "2026-11-20",
    history: [],
  } satisfies Claim;
  const rows = exploreMetrics({
    investors: [],
    startups: [],
    claims: [claim],
    round: GOLDEN_ROUND,
    plan,
  });
  assert.equal(rows.find((row) => row.id === "mrr")?.value, null);
  assert.equal(rows.find((row) => row.id === "post")?.value, "£7,200,000.00");
});

test("cheque ranges stay in their own currency", () => {
  const rows = exploreMetrics({
    investors: [
      investor({ id: "uk", chequeMinMinor: 15_000_000, chequeMaxMinor: 300_000_000, currency: "GBP" }),
      investor({ id: "us", chequeMinMinor: 50_000_000, chequeMaxMinor: 200_000_000, currency: "USD", stages: [] }),
    ],
    startups: [],
    claims: [],
    round: GOLDEN_ROUND,
    plan,
  });
  assert.equal(rows.find((row) => row.id === "range-GBP")?.value, "£150,000.00–£3,000,000.00");
  assert.equal(rows.find((row) => row.id === "range-USD")?.value, "$500,000.00–$2,000,000.00");
  assert.equal(rows.find((row) => row.id === "cheques")?.value, "2");
});
