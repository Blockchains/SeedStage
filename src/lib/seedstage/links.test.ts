import assert from "node:assert/strict";
import test from "node:test";
import { linkParts } from "./links.ts";

test("github links drop a trailing stop and gain a scheme", () => {
  const prompt = linkParts("Try https://github.com/hegelai/prompttools. If you are building.");
  assert.deepEqual(
    prompt.filter((part) => part.kind === "link"),
    [{ kind: "link", text: "https://github.com/hegelai/prompttools", href: "https://github.com/hegelai/prompttools" }],
  );
  const tesseral = linkParts("GitHub at https://github.com/tesseral-labs/tesseral.");
  assert.equal(tesseral.find((part) => part.kind === "link")?.href, "https://github.com/tesseral-labs/tesseral");
  const formance = linkParts("See github.com/formancehq/stack\nBatch");
  assert.equal(formance.find((part) => part.kind === "link")?.href, "https://github.com/formancehq/stack");
});
