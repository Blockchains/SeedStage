import assert from "node:assert/strict";
import test from "node:test";
import { assessInvestor, type Investor } from "./match.ts";

const profile = {
  stage: "seed",
  geos: ["United Kingdom"],
  sectors: ["B2B software", "accountancy"],
  raiseMinor: 120_000_000,
  currency: "GBP",
  needLead: true,
  asOf: "2026-11-20",
};

function investor(over: Partial<Investor>): Investor {
  return {
    id: "i",
    firm: "Example",
    fund: "Fund I",
    partner: null,
    stages: ["seed"],
    geos: ["United Kingdom"],
    geoExclusions: [],
    sectors: ["B2B software"],
    sectorExclusions: [],
    sectorExclusive: false,
    chequeMinMinor: 40_000_000,
    chequeMaxMinor: 150_000_000,
    participation: "lead",
    themes: ["B2B software"],
    portfolio: [],
    activityDate: "2026-08-01",
    source: "Synthetic mandate card",
    sourceDate: "2026-08-01",
    synthetic: true,
    confirmed: false,
    currency: "GBP",
    ...over,
  };
}

test("hard constraints disqualify without a score", () => {
  const geo = assessInvestor(investor({ geoExclusions: ["United Kingdom"] }), profile);
  assert.equal(geo.category, "disqualified");
  assert.equal(geo.aid, null);
  const stage = assessInvestor(investor({ stages: ["pre-seed"] }), profile);
  assert.equal(stage.category, "disqualified");
  const cheque = assessInvestor(investor({ chequeMinMinor: 200_000_000 }), profile);
  assert.equal(cheque.category, "disqualified");
  const sector = assessInvestor(investor({ sectorExclusions: ["accountancy"] }), profile);
  assert.equal(sector.category, "disqualified");
});

test("a fitting lead with fresh activity is priority and the aid is labelled", () => {
  const match = assessInvestor(investor({}), profile);
  assert.equal(match.category, "priority");
  assert.equal(match.aidVersion, "match-aid-1");
  assert.match(match.aidNote, /not a probability/i);
  assert.ok(match.unknowns.some((item) => /capital/i.test(item)));
});

test("follow-only and stale activity stay possible rather than priority", () => {
  const follow = assessInvestor(investor({ participation: "follow" }), profile);
  assert.equal(follow.category, "possible");
  const stale = assessInvestor(investor({ activityDate: "2023-01-01" }), profile);
  assert.equal(stale.category, "possible");
  assert.ok(stale.reasonsAgainst.length > 0);
});
