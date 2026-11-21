import assert from "node:assert/strict";
import test from "node:test";
import { startupDocuments } from "./public-docs.ts";
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
  funder: "",
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
