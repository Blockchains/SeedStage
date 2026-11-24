import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { SEC_INVESTOR_COUNT, SEC_STARTUP_COUNT } from "./sec-counts.ts";
import { publicStartups } from "./startups.ts";

test("named companies keep the public GitHub repository", () => {
  const company = publicStartups.find((item) => item.id === "formance");
  assert.ok(company);
  const text = (company.files ?? []).map((file) => file.text).join("\n");
  assert.match(text, /https:\/\/github\.com\/formancehq\/ledger/);
  assert.match(text, /yc-oss\/open-source-companies/);
});

test("the Form D wave is real filings, not invented contacts", () => {
  const wave = JSON.parse(readFileSync(new URL("./sec-wave.json", import.meta.url), "utf8")) as {
    startups: { id: string; stage: string; sourceUrl: string; files?: { text: string }[] }[];
    investors: { id: string; stages: string[]; sourceUrl: string; note: string; files?: { text: string }[] }[];
  };
  assert.equal(wave.startups.length, SEC_STARTUP_COUNT);
  assert.equal(wave.investors.length, SEC_INVESTOR_COUNT);
  assert.equal(wave.startups[0]?.stage, "Form D");
  assert.deepEqual(wave.investors[0]?.stages, []);
  assert.match(wave.startups[0]?.sourceUrl ?? "", /^https:\/\/www\.sec\.gov\/Archives\/edgar\/data\//);
  assert.match(wave.investors[0]?.note ?? "", /No email/);
  const phones = [...wave.startups, ...wave.investors].filter((row) => /Phone: \d{3}-\d{3}-\d{4}/.test((row.files ?? []).map((file) => file.text).join("\n")));
  assert.ok(phones.length > 8_000, `phones ${phones.length}`);
  const blob = JSON.stringify(wave);
  assert.equal(blob.includes("Email:"), false);
});
