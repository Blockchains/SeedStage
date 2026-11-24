import assert from "node:assert/strict";
import test from "node:test";
import { classifyStartup, presentInvestor, presentStartup } from "./sec-class.ts";
import type { PublicStartup } from "./startups.ts";
import type { Investor } from "./types.ts";

function company(partial: Partial<PublicStartup> & Pick<PublicStartup, "name" | "summary">): PublicStartup {
  return {
    id: "sec-1",
    website: "https://www.sec.gov/Archives/edgar/data/1/x/x-index.html",
    logo: "",
    stage: "Form D",
    round: null,
    person: null,
    funder: "",
    source: "SEC Form D",
    sourceUrl: "https://www.sec.gov/Archives/edgar/data/1/x/x-index.html",
    ...partial,
  };
}

test("a pooled fund is not a seed round", () => {
  const result = classifyStartup(company({ name: "North Harbor Fund LP", summary: "Pooled Investment Fund GRAND CAYMAN Filed 2026-11-01" }));
  assert.equal(result.label, "fund_issuer");
  assert.equal(result.summary.includes("seed round"), true);
  assert.equal(/raised a seed/i.test(result.summary), false);
});

test("real estate stays out of the early-stage list", () => {
  const result = classifyStartup(company({
    name: "PI Harbor District Portfolio, LLC",
    summary: "Commercial Offering $6,165,000 OVERLAND PARK, KANSAS Filed 2026-11-23",
    round: "$6,165,000",
  }));
  assert.equal(result.label, "likely_other");
  assert.equal(result.industry, "Commercial");
});

test("technology at or under the screen is a candidate, and sold is not added to the target", () => {
  const result = classifyStartup(company({
    name: "Maven App, Inc",
    summary: "Computers Offering $5,000,000 NEWARK, DELAWARE Filed 2026-11-23",
    round: "$5,000,000",
    person: "Gregory Frasco, Executive Officer",
    files: [{ title: "Corporate contact", text: "Amount sold on the filing: $0\nRevenue range as reported: Decline to Disclose\nIndustry as reported: Computers" }],
  }));
  assert.equal(result.label, "likely_early_stage_candidate");
  assert.equal(result.offering.amount, 5_000_000);
  assert.equal(result.sold.amount, 0);
  assert.match(result.facts, /not recorded as an investor/);
  assert.match(result.facts, /Decline to Disclose|declined to disclose/i);
  assert.equal(result.facts.includes("5,000,000") && result.facts.includes("added together"), true);
});

test("a larger technology offering is kept as possible and is not dropped", () => {
  const result = classifyStartup(company({
    name: "Wide Field, Inc",
    summary: "Other Technology Offering $18,000,000 AUSTIN, TEXAS Filed 2026-02-01",
    round: "$18,000,000",
  }));
  assert.equal(result.label, "possible_early_stage_candidate");
});

test("indefinite and missing amounts stay distinct", () => {
  const indefinite = classifyStartup(company({
    name: "Open Range, Inc",
    summary: "Computers Filed 2026-04-01",
    files: [{ title: "Corporate contact", text: "Offering amount: Indefinite\nIndustry as reported: Computers" }],
  }));
  assert.equal(indefinite.offering.status, "indefinite");
  assert.equal(indefinite.label, "likely_early_stage_candidate");
  const missing = classifyStartup(company({ name: "No Numbers LLC", summary: "Filed 2026-04-01" }));
  assert.equal(missing.offering.status, "unknown");
  assert.equal(missing.sold.status, "unknown");
  assert.equal(missing.label, "insufficient_evidence");
});

test("an amendment is not a second round", () => {
  const result = classifyStartup(company({
    name: "Second Look, Inc",
    summary: "Computers Offering $3,000,000 Filed 2026-05-01",
    round: "$3,000,000",
    files: [{ title: "Corporate contact", text: "Amendment: yes\nAmount sold: $1,000,000\nIndustry as reported: Computers" }],
  }));
  assert.match(result.facts, /not counted as a second round/);
  assert.equal(result.sold.amount, 1_000_000);
  assert.equal(result.offering.amount, 3_000_000);
});

test("high reported revenue and a business combination are not seed", () => {
  const rich = classifyStartup(company({
    name: "Old Line, Inc",
    summary: "Computers Offering $2,000,000 Filed 2026-01-01",
    round: "$2,000,000",
    files: [{ title: "Corporate contact", text: "Revenue range as reported: Over $100,000,000\nIndustry as reported: Computers" }],
  }));
  assert.equal(rich.label, "likely_other");
  const deal = classifyStartup(company({
    name: "Buyco, Inc",
    summary: "Computers Offering $2,000,000 Filed 2026-01-01",
    round: "$2,000,000",
    files: [{ title: "Corporate contact", text: "Business combination: yes\nIndustry as reported: Computers" }],
  }));
  assert.equal(deal.label, "likely_other");
});

test("the public record keeps the filing facts beside the contact file", () => {
  const shown = presentStartup(company({
    name: "Maven App, Inc",
    summary: "Computers Offering $5,000,000 Filed 2026-11-23",
    round: "$5,000,000",
    files: [{ title: "Corporate contact", text: "Phone: 781-439-9734" }],
  }));
  assert.equal(shown.stage, "Early-stage candidate");
  assert.equal(shown.files?.[0]?.title, "Filing facts");
  assert.equal(shown.files?.some((file) => file.text.includes("781-439-9734")), true);
  const again = presentStartup(shown);
  assert.equal(again.files?.filter((file) => file.title === "Filing facts").length, 1);
});

test("a fund filing is not described as dry powder", () => {
  const firm = {
    id: "sec-9",
    firm: "Example Venture Fund LP",
    fund: "Example Venture Fund LP",
    partner: null,
    stages: [],
    geos: ["United States"],
    geoExclusions: [],
    sectors: [],
    sectorExclusions: [],
    sectorExclusive: false,
    chequeMinMinor: 0,
    chequeMaxMinor: 0,
    participation: "unstated",
    themes: ["Venture Capital Fund"],
    portfolio: [],
    activityDate: "2026-11-01",
    source: "SEC Form D",
    sourceUrl: "https://www.sec.gov/",
    sourceDate: "2026-11-01",
    excerpt: "Example Venture Fund LP filed Form D.",
    note: "Public Form D.",
    logo: "",
    synthetic: false,
    confirmed: false,
    currency: "USD",
  } satisfies Investor;
  const shown = presentInvestor(firm);
  assert.match(shown.files?.[0]?.text ?? "", /not capital available to invest/);
  assert.equal(presentInvestor(shown).files?.filter((file) => file.title === "What this filing is").length, 1);
});
