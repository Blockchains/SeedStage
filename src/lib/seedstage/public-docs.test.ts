import assert from "node:assert/strict";
import test from "node:test";
import { extraInvestors } from "./directory.generated.ts";
import { companyEntities } from "./entities.ts";
import { investorDocuments, startupDocuments } from "./public-docs.ts";
import { publicStartups } from "./startups.ts";
import type { PublicStartup } from "./startups.ts";

const company: PublicStartup = {
  id: "suno",
  name: "Suno",
  website: "https://suno.com/",
  logo: "/logos/suno.png",
  stage: "Early",
  round: null,
  summary: "Create original music.",
  person: null,
  funder: "MMC",
  source: "Company site",
  sourceUrl: "https://suno.com/",
  files: [{ title: "Product", text: "A browser-based studio." }],
};

test("a public page is a room file, not a financial statement", () => {
  const documents = startupDocuments(company);
  assert.equal(documents.find((document) => document.title === "Product")?.category, "06 Product and technology");
  assert.equal(documents.some((document) => document.category === "04 Financial information"), false);
  assert.equal(documents.some((document) => document.text.includes("Create original music.")), true);
});

test("held public pages increase the room beyond the profile line", () => {
  assert.ok(publicStartups.length >= 500);
  assert.ok(extraInvestors.length >= 250);
  let companySummary = 0;
  let companyFiles = 0;
  let companyDocs = 0;
  for (const item of publicStartups) {
    companySummary += item.summary.length;
    companyFiles += (item.files ?? []).reduce((sum, file) => sum + file.text.length, 0);
    companyDocs += startupDocuments(item).reduce((sum, document) => sum + document.text.length, 0);
  }
  let firmExcerpt = 0;
  let firmFiles = 0;
  let firmDocs = 0;
  for (const firm of extraInvestors) {
    firmExcerpt += firm.excerpt.length;
    firmFiles += (firm.files ?? []).reduce((sum, file) => sum + file.text.length, 0);
    firmDocs += investorDocuments(firm).reduce((sum, document) => sum + document.text.length, 0);
  }
  assert.ok(companyFiles > 400_000);
  assert.ok(firmFiles > 100_000);
  assert.ok(companyDocs > companySummary);
  assert.ok(firmDocs > firmExcerpt);
  const entities = companyEntities(company, extraInvestors);
  assert.equal(entities.some((row) => row.schema === "LegalEntity" && row.kind === "Investor"), true);
});

test("data companies and data firms are on the directory routes", () => {
  const estuary = publicStartups.find((company) => company.id === "estuary");
  const decibel = extraInvestors.find((firm) => firm.id === "decibel");
  assert.ok(estuary);
  assert.ok(decibel);
  assert.match(estuary.logo, /^\/logos\/estuary\./);
  assert.match(decibel.logo, /^\/logos\/decibel\./);
  assert.match(startupDocuments(estuary).map((document) => document.text).join("\n"), /pipeline/i);
  assert.match(investorDocuments(decibel).map((document) => document.text).join("\n"), /infrastructure/i);
  const circuit = publicStartups.find((company) => company.id === "circuithub");
  assert.ok(circuit);
  assert.match(circuit.logo, /^https:\/\/bookface-images\.s3\.amazonaws\.com\//);
  assert.match(startupDocuments(circuit).map((document) => document.text).join("\n"), /electronics manufacturing/i);
  assert.ok(publicStartups.length >= 6000);
});
