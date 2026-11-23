import assert from "node:assert/strict";
import test from "node:test";
import { assessFit, parseBrief, rankInvestors, type FitBrief } from "./fit.ts";
import type { Investor } from "./types.ts";

const brief: FitBrief = {
  name: "Northline",
  stage: "seed",
  geos: ["United Kingdom"],
  sectors: ["B2B software", "fintech"],
  raiseMinor: 150_000_000,
  currency: "GBP",
  needLead: true,
  text: "Northline sells compliance software to UK banks. Seed round of £1.5m. We need a lead.",
  asOf: "2026-11-23",
};

function investor(over: Partial<Investor> = {}): Investor {
  return {
    id: "example",
    firm: "Example",
    fund: "Fund I",
    partner: "Ada",
    stages: ["seed"],
    geos: ["United Kingdom"],
    geoExclusions: [],
    sectors: ["fintech"],
    sectorExclusions: [],
    sectorExclusive: false,
    chequeMinMinor: 50_000_000,
    chequeMaxMinor: 200_000_000,
    participation: "lead",
    themes: ["fintech"],
    portfolio: ["Ledgerly"],
    activityDate: "2026-08-01",
    source: "Firm page",
    sourceUrl: "https://example.com",
    sourceDate: "2026-08-01",
    excerpt: "Seed cheques into fintech software.",
    note: "",
    logo: "",
    synthetic: false,
    confirmed: false,
    currency: "GBP",
    ...over,
  };
}

test("a binding exclusion removes the score", () => {
  const result = assessFit(investor({ geoExclusions: ["United Kingdom"] }), brief, []);
  assert.equal(result.eligibility, "EXCLUDED");
  assert.equal(result.fit, null);
  assert.match(result.next, /do not prioritise/i);
});

test("a covered seed lead is ranked as fit, not as a probability", () => {
  const [result] = rankInvestors([investor()], brief, [{ name: "Ledgerly", summary: "Compliance software for banks and fintech teams.", stage: "seed" }]);
  assert.equal(result.eligibility, "ELIGIBLE");
  assert.equal(result.role, "lead");
  assert.ok((result.fit ?? 0) > 50);
  assert.ok(result.unknowns.some((item) => /not a probability/i.test(item)));
  assert.match(result.dimensions.find((item) => item.id === "H")?.note ?? "", /Ledgerly/);
});

test("a blank cheque stays unknown and a follow-only firm stays off the lead list", () => {
  const cheque = assessFit(investor({ chequeMinMinor: 0, chequeMaxMinor: 0 }), brief, []);
  assert.equal(cheque.gates.find((gate) => gate.name === "Cheque")?.status, "UNKNOWN");
  assert.match(cheque.dimensions.find((item) => item.id === "R")?.note ?? "", /not stated/);
  const follow = assessFit(investor({ participation: "follow" }), brief, []);
  assert.notEqual(follow.eligibility, "EXCLUDED");
  assert.equal(follow.role, "participant");
  assert.ok(follow.blockers.some((item) => /lead shortlist/i.test(item)));
});

test("an upload extracts the round without inventing a sector", () => {
  const parsed = parseBrief("Harbor\nWe are raising a $2m seed in New York for warehouse robotics.", "2026-11-23");
  assert.equal(parsed.stage, "seed");
  assert.equal(parsed.currency, "USD");
  assert.equal(parsed.raiseMinor, 200_000_000);
  assert.ok(parsed.geos.includes("United States"));
  assert.equal(parsed.sectors.length, 0);
  const bare = parseBrief("A note with no place and no round.", "2026-11-23");
  assert.deepEqual(bare.geos, []);
  assert.equal(assessFit(investor(), bare, []).gates.find((gate) => gate.name === "Geography")?.status, "UNKNOWN");
});
