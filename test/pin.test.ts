import assert from "node:assert/strict";
import { test } from "node:test";
import { detectSplit, hashesEqual, normalizeHash } from "../src/pin.ts";
import type { BlockHeaderView, RpcCallResult, RpcEndpoint } from "../src/types.ts";

const endpoint = (name: string, family: string): RpcEndpoint => ({
  name,
  family,
  url: `https://${name}.example`,
});

const header = (hash: `0x${string}`): BlockHeaderView => ({
  number: 316002,
  hash,
  parentHash: `0x${"11".repeat(32)}`,
  stateRoot: `0x${"22".repeat(32)}`,
  timestamp: 1,
});

const sample = (
  name: string,
  family: string,
  hash: `0x${string}`,
): RpcCallResult<BlockHeaderView | null> => ({
  endpoint: endpoint(name, family),
  ok: true,
  result: header(hash),
  ms: 1,
});

test("normalizeHash rejects short values", () => {
  assert.throws(() => normalizeHash("0xabc"));
});

test("detectSplit agrees when every family returns the pin", () => {
  const pin = `0x${"aa".repeat(32)}` as `0x${string}`;
  const split = detectSplit(
    316002,
    [sample("east", "community", pin), sample("west", "community", pin)],
    pin,
  );
  assert.equal(split.matchesPin, true);
  assert.equal(Object.keys(split.byHash).length, 1);
});

test("detectSplit flags two histories at the same height", () => {
  const community = `0x${"aa".repeat(32)}` as `0x${string}`;
  const other = `0x${"bb".repeat(32)}` as `0x${string}`;
  const split = detectSplit(
    316002,
    [sample("east", "community", community), sample("scan", "official", other)],
    community,
  );
  assert.equal(split.matchesPin, false);
  assert.equal(Object.keys(split.byHash).length, 2);
});

test("hashesEqual is case-insensitive", () => {
  assert.equal(hashesEqual(`0x${"AA".repeat(32)}`, `0x${"aa".repeat(32)}`), true);
});
