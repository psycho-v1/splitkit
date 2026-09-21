import assert from "node:assert/strict";
import { test } from "node:test";
import { assertAllowed, DeniedHostError, filterAllowed, hostOf } from "../src/deny.ts";

test("hostOf parses hostname", () => {
  assert.equal(hostOf("https://rpc.east.example.org:8545/"), "rpc.east.example.org");
});

test("assertAllowed blocks substring match", () => {
  assert.throws(
    () => assertAllowed("https://rpc.bdagscan.com", ["bdagscan.com"]),
    DeniedHostError,
  );
});

test("assertAllowed allows unrelated host", () => {
  assert.doesNotThrow(() =>
    assertAllowed("https://rpc.east.bdag-us.org", ["bdagscan.com", "blockdag.works"]),
  );
});

test("filterAllowed partitions a list", () => {
  const { allowed, denied } = filterAllowed(
    [
      { name: "ok", url: "https://rpc.community.example", family: "community" },
      { name: "bad", url: "https://rpc.bdagscan.com", family: "scan" },
    ],
    ["bdagscan"],
  );
  assert.equal(allowed.length, 1);
  assert.equal(denied.length, 1);
  assert.equal(denied[0].endpoint.name, "bad");
});
