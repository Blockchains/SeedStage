import assert from "node:assert/strict";
import test from "node:test";
import { investorFacts, startupFacts } from "./record-facts.ts";
import type { PublicStartup } from "./startups.ts";
import type { Investor } from "./types.ts";

const company = {
  id: "sec-1",
  name: "Maven App, Inc",
  website: "https://www.sec.gov/Archives/edgar/data/1/x/x-index.html",
  logo: "",
  stage: "Early-stage candidate",
  round: "$5,000,000",
  summary: "Filed an offering notice. Industry as reported: Computers. Offering amount $5,000,000. Amount sold $0. This is not labelled a seed round.",
  person: "Gregory Frasco, Executive Officer",
  funder: "",
  source: "SEC Form D",
  sourceUrl: "https://www.sec.gov/Archives/edgar/data/1/x/x-index.html",
  files: [{
    title: "Corporate contact",
    text: [
      "Industry as reported: Computers",
      "Incorporation year as reported: 2026",
      "Incorporation timing: within five years",
      "Revenue range as reported: Decline to Disclose",
      "Offering amount: $5,000,000",
      "Amount sold: $0",
      "Phone: 781-439-9734",
      "Issuer address: 131 CONTINENTAL DR, NEWARK, DELAWARE",
      "People named on the filing: Gregory Lyons Frasco, Executive Officer",
      "This notice does not name the outside investors.",
    ].join("\n"),
  }],
} satisfies PublicStartup;

test("key filing fields come first and prose is not a field", () => {
  const facts = startupFacts(company);
  assert.deepEqual(facts.map((fact) => fact.label).slice(0, 6), ["Stage", "Industry", "Offering amount", "Amount sold", "Person", "Phone"]);
  assert.equal(facts.find((fact) => fact.label === "Offering amount")?.value, "$5,000,000");
  assert.equal(facts.find((fact) => fact.label === "Amount sold")?.value, "$0");
  assert.equal(facts.find((fact) => fact.label === "Incorporated")?.value, "2026 · within five years");
  assert.equal(facts.find((fact) => fact.label === "Revenue")?.value, "Decline to Disclose");
  assert.equal(facts.some((fact) => fact.value.includes("outside investors")), false);
  assert.equal(startupFacts(company, "card").some((fact) => fact.label === "Revenue"), false);
});

test("a narrative round is not shown as an offering amount", () => {
  const facts = startupFacts({ ...company, round: "$17m seed, led by MMC", files: [], stage: "Seed", funder: "MMC", person: "Joris Van Der Gucht, CEO", website: "https://ravical.com/" });
  assert.equal(facts.find((fact) => fact.label === "Round")?.value, "$17m seed, led by MMC");
  assert.equal(facts.some((fact) => fact.label === "Offering amount"), false);
  assert.equal(facts.find((fact) => fact.label === "Website")?.value, "ravical.com");
});

test("an unstated cheque and role are omitted", () => {
  const investor = {
    id: "sec-9",
    firm: "Example Fund LP",
    fund: "Example Fund LP",
    partner: "Ada Lovelace",
    stages: [],
    geos: ["CALIFORNIA", "United States"],
    geoExclusions: [],
    sectors: [],
    sectorExclusions: [],
    sectorExclusive: false,
    chequeMinMinor: 0,
    chequeMaxMinor: 0,
    participation: "unstated",
    themes: ["Venture Capital Fund"],
    portfolio: [],
    activityDate: "2026-11-23",
    source: "SEC Form D",
    sourceUrl: "https://www.sec.gov/",
    sourceDate: "2026-11-23",
    excerpt: "Example Fund LP filed Form D.",
    note: "Public Form D. No email is on the form, so none is shown.",
    logo: "",
    synthetic: false,
    confirmed: false,
    currency: "USD",
    files: [{ title: "Contact", text: "Phone: 650-308-6570\nAddress: 750 22ND AVE., SAN FRANCISCO, CALIFORNIA" }],
  } satisfies Investor;
  const facts = investorFacts(investor);
  assert.equal(facts.some((fact) => fact.label === "Cheque" || fact.label === "Role"), false);
  assert.equal(facts.find((fact) => fact.label === "Fund type")?.value, "Venture Capital Fund");
  assert.equal(facts.find((fact) => fact.label === "Phone")?.value, "650-308-6570");
  assert.equal(facts.find((fact) => fact.label === "Address")?.value?.includes("SAN FRANCISCO"), true);
  assert.equal(facts.some((fact) => /no email/i.test(fact.value)), false);
});
