import assert from "node:assert/strict";
import test from "node:test";
import { buildInvestorRoom, linkedPortfolio } from "./investor-room.ts";
import type { Investor } from "./types.ts";
import type { PublicStartup } from "./startups.ts";

function investor(over: Partial<Investor> = {}): Investor {
  return {
    id: "mmc",
    firm: "MMC",
    fund: "MMC",
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
    themes: ["software"],
    portfolio: ["Ravical"],
    activityDate: null,
    source: "Company site",
    sourceUrl: "https://mmc.vc/",
    sourceDate: "2026-11-20",
    excerpt: "MMC backs software companies.",
    note: "",
    logo: "/logos/mmc.png",
    synthetic: false,
    confirmed: false,
    currency: "GBP",
    ...over,
  };
}

test("an investor room keeps only fields that are filled", () => {
  const room = buildInvestorRoom(investor());
  assert.deepEqual(room.sections.map((section) => section.id), ["profile", "geography", "stage", "themes", "portfolio"]);
  assert.equal(room.missing.includes("Cheque"), true);
  assert.equal(room.missing.includes("People"), true);
});

test("portfolio links only match a company by name", () => {
  const startup = {
    id: "ravical",
    name: "Ravical",
    website: "https://ravical.com/",
    logo: "/logos/ravical.png",
    stage: "Seed",
    round: null,
    summary: "Accounting software.",
    person: null,
    funder: "MMC",
    source: "MMC",
    sourceUrl: "https://mmc.vc/",
  } satisfies PublicStartup;
  const linked = linkedPortfolio(investor(), [startup]);
  assert.deepEqual(linked.map((item) => item.id), ["ravical"]);
  assert.deepEqual(linkedPortfolio(investor({ portfolio: [] }), [startup]), []);
});
