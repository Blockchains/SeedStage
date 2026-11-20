import assert from "node:assert/strict";
import test from "node:test";
import { buildStartupRoom } from "./startup-room.ts";
import type { PublicStartup } from "./startups.ts";

function company(over: Partial<PublicStartup> = {}): PublicStartup {
  return {
    id: "ravical",
    name: "Ravical",
    website: "https://ravical.com/",
    logo: "/logos/ravical.png",
    stage: "Seed",
    round: "$17m seed, led by MMC",
    summary: "MMC is leading Ravical’s $17m Seed round.",
    person: "Joris Van Der Gucht, CEO",
    funder: "MMC",
    source: "MMC",
    sourceUrl: "https://mmc.vc/accountings-next-act-why-we-invested-in-ravical/",
    ...over,
  };
}

test("a startup room uses only the fields on the record", () => {
  const room = buildStartupRoom(company());
  assert.deepEqual(room.sections.map((section) => section.id), ["overview", "people", "financing"]);
  assert.equal(room.sections[0].lines.some((line) => line.value.includes("410,000")), false);
  assert.equal(room.missing.includes("Financial statements"), true);
  assert.equal(room.missing.includes("Security"), true);
});

test("blank financing stays off the page", () => {
  const room = buildStartupRoom(company({ stage: "", round: null, funder: "", person: null }));
  assert.deepEqual(room.sections.map((section) => section.id), ["overview"]);
  assert.equal(room.missing.includes("Financing"), true);
  assert.equal(room.missing.includes("People"), true);
});
