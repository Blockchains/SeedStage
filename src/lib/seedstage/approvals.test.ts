import assert from "node:assert/strict";
import test from "node:test";
import { approvalHash, releaseAction, type ApprovalPayload } from "./approvals.ts";
import { can } from "./permissions.ts";

const payload: ApprovalPayload = {
  action: "release_outreach",
  recipient: "ada@harbour.test",
  sender: "amina@northline.test",
  subject: "Northline seed",
  body: "Sharing the reviewed brief.",
  attachmentIds: ["doc-1"],
  idempotencyKey: "act-1",
  expiresAt: "2026-12-01T00:00:00.000Z",
};

test("a changed body cannot reuse an approval and a repeat does not duplicate", () => {
  const hash = approvalHash(payload);
  const changed = releaseAction({
    now: "2026-11-20T00:00:00.000Z",
    approvedHash: hash,
    payload: { ...payload, body: "Sharing the reviewed brief. Also a new number." },
    alreadyReleasedKeys: [],
  });
  assert.equal(changed.ok, false);

  const first = releaseAction({
    now: "2026-11-20T00:00:00.000Z",
    approvedHash: hash,
    payload,
    alreadyReleasedKeys: [],
  });
  assert.equal(first.ok, true);
  if (!first.ok) return;
  assert.equal(first.duplicate, false);
  assert.equal(first.delivery, "not_connected");

  const second = releaseAction({
    now: "2026-11-20T00:00:00.000Z",
    approvedHash: hash,
    payload,
    alreadyReleasedKeys: [payload.idempotencyKey],
  });
  assert.equal(second.ok, true);
  if (!second.ok) return;
  assert.equal(second.duplicate, true);
});

test("expired approvals and read-only roles cannot release", () => {
  const expired = releaseAction({
    now: "2027-01-01T00:00:00.000Z",
    approvedHash: approvalHash(payload),
    payload,
    alreadyReleasedKeys: [],
  });
  assert.equal(expired.ok, false);
  assert.equal(can("board", "approve"), false);
  assert.equal(can("finance", "release_action"), false);
  assert.equal(can("founder", "approve"), true);
  assert.equal(can("adviser", "draft"), true);
  assert.equal(can("adviser", "edit_round"), false);
});
