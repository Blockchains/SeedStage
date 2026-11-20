import assert from "node:assert/strict";
import test from "node:test";
import { emptyWorkspace } from "./seed.ts";
import { grantAllows, investorRoom, roomFile } from "./room.ts";
import type { Claim, DocumentRecord } from "./types.ts";

function doc(id: string, text: string): DocumentRecord {
  return {
    id,
    name: id,
    mediaType: "text/plain",
    text,
    uploadedAt: "2026-11-20T00:00:00.000Z",
    method: "user_paste",
    quarantine: "user_supplied_unscanned",
    scan: "not_connected",
    note: "",
  };
}

function claim(partial: Pick<Claim, "id" | "text" | "status" | "sourceId" | "evidenceQuote" | "metricKey" | "period" | "value">): Claim {
  return {
    ...partial,
    unit: "count",
    currency: null,
    kind: "historical",
    observed: "observed",
    extraction: "user",
    confidenceNote: "",
    updatedAt: "2026-11-20T00:00:00.000Z",
    history: [],
  };
}

test("an accepted quoted claim is visible only to the granted investor", () => {
  const workspace = emptyWorkspace();
  const text = "Six signed annual subscriptions were on the March schedule for Northline.";
  workspace.documents = [doc("accounts", text), doc("security", "Internal security notes for the founder only.")];
  workspace.roomFiles = [
    { documentId: "accounts", category: "04 Financial information", share: "approved" },
    { documentId: "security", category: "09 Security and privacy", share: "restricted" },
  ];
  workspace.roomGrants = [{ investorId: "seedcamp", documentIds: ["accounts", "security"] }];
  workspace.claims = [
    claim({
      id: "paying",
      text: "Six firms had signed annual subscriptions.",
      status: "accepted",
      sourceId: "accounts",
      evidenceQuote: "Six signed annual subscriptions were on the March schedule",
      metricKey: "paying_customers",
      period: "2026-03",
      value: 6,
    }),
  ];
  const seedcamp = investorRoom(workspace, "seedcamp");
  const other = investorRoom(workspace, "other");
  assert.deepEqual(seedcamp.documents.map((item) => item.id), ["accounts"]);
  assert.deepEqual(seedcamp.claims.map((item) => item.id), ["paying"]);
  assert.deepEqual(other.documents, []);
  assert.deepEqual(other.claims, []);
  assert.equal(seedcamp.questions.some((item) => item.text.includes("09 Security")), false);
  assert.equal(seedcamp.questions.some((item) => item.text.includes("02 Corporate")), true);
});

test("a contradicted metric stays out of the room", () => {
  const workspace = emptyWorkspace();
  const text = "MRR, March 2026: GBP 18,400 from six paying firms. March felt closer to GBP 22,000 MRR if we count the two pilots as won.";
  workspace.documents = [doc("both", text)];
  workspace.roomFiles = [{ documentId: "both", category: "04 Financial information", share: "approved" }];
  workspace.roomGrants = [{ investorId: "seedcamp", documentIds: ["both"] }];
  workspace.claims = [
    claim({
      id: "a",
      text: "March 2026 MRR was GBP 18,400.",
      status: "accepted",
      sourceId: "both",
      evidenceQuote: "MRR, March 2026: GBP 18,400 from six paying firms.",
      metricKey: "mrr",
      period: "2026-03",
      value: 18400,
    }),
    claim({
      id: "b",
      text: "A draft puts March MRR at GBP 22,000.",
      status: "pending",
      sourceId: "both",
      evidenceQuote: "March felt closer to GBP 22,000 MRR if we count the two pilots as won.",
      metricKey: "mrr",
      period: "2026-03",
      value: 22000,
    }),
  ];
  const room = investorRoom(workspace, "seedcamp");
  assert.deepEqual(room.claims, []);
  assert.equal(room.questions.some((item) => item.text.includes("mrr")), true);
});

test("a grant requires an approved document", () => {
  assert.equal(grantAllows("approved"), true);
  assert.equal(grantAllows("held"), false);
  assert.equal(grantAllows("restricted"), false);
  assert.equal(roomFile([], "missing").share, "held");
});
