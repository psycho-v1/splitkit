import assert from "node:assert/strict";
import { test } from "node:test";
import type { NonceScan } from "../src/types.js";

function agreeFrom(scan: Pick<NonceScan, "uniqueCounts">): boolean {
  return scan.uniqueCounts.length <= 1;
}

test("nonce agreement is unique-count length", () => {
  assert.equal(agreeFrom({ uniqueCounts: [7] }), true);
  assert.equal(agreeFrom({ uniqueCounts: [] }), true);
  assert.equal(agreeFrom({ uniqueCounts: [7, 8] }), false);
});
