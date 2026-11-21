import assert from "node:assert/strict";
import test from "node:test";
import { canView, documentObject } from "./authz.ts";

test("a viewer tuple allows that document and no other", () => {
  const tuples = [{ user: "user:ada", relation: "viewer" as const, object: documentObject("deck") }];
  assert.equal(canView(tuples, "ada", documentObject("deck")), true);
  assert.equal(canView(tuples, "ada", documentObject("accounts")), false);
  assert.equal(canView(tuples, "other", documentObject("deck")), false);
});
