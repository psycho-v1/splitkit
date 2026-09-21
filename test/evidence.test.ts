import assert from "node:assert/strict";
import { test } from "node:test";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildEvidencePack } from "../src/evidence.js";
import { filterAllowed } from "../src/deny.js";
import type { ChainPin, RpcEndpoint } from "../src/types.js";
import { startMockRpc } from "./mock-rpc.js";

const COMMUNITY_316002 =
  "0xcd4d2568e9cba6725329e8cf6d96217ace7acb03d71d9b519c8b2560bb6bb781" as const;
const GK_316002 =
  "0xe2c7a9b0ff6206e6ac93f2cceead3992e081a4be64f5a5975d6e2158cc02a824" as const;

const here = dirname(fileURLToPath(import.meta.url));

test("1404 example pin is well-formed", async () => {
  const raw = JSON.parse(
    await readFile(join(here, "../examples/chain-1404.pin.json"), "utf8"),
  ) as ChainPin;
  assert.equal(raw.chainId, 1404);
  assert.equal(raw.heights[0].height, 316002);
  assert.equal(raw.heights[0].blockHash, COMMUNITY_316002);
  assert.ok(raw.deniedHostSubstrings.includes("bdagscan.com"));
});

test("1404 example endpoints drop scan hosts when the pin deny list is applied", async () => {
  const pin = JSON.parse(
    await readFile(join(here, "../examples/chain-1404.pin.json"), "utf8"),
  ) as ChainPin;
  const file = JSON.parse(
    await readFile(join(here, "../examples/chain-1404.endpoints.json"), "utf8"),
  ) as { community: RpcEndpoint[]; scan: RpcEndpoint[] };
  const { allowed, denied } = filterAllowed(
    [...file.community, ...file.scan],
    pin.deniedHostSubstrings,
  );
  assert.equal(denied.length, 2);
  assert.ok(allowed.every((e) => e.family === "community"));
});

test("buildEvidencePack flags two histories at 316002 against a mock pair", async () => {
  const community = await startMockRpc({
    chainId: 1404,
    blocks: {
      316002: { number: 316002, hash: COMMUNITY_316002 },
    },
    nonces: { "0x1111111111111111111111111111111111111111": 7 },
  });
  const scan = await startMockRpc({
    chainId: 1404,
    blocks: {
      316002: { number: 316002, hash: GK_316002 },
    },
    nonces: { "0x1111111111111111111111111111111111111111": 4 },
  });

  try {
    const pack = await buildEvidencePack({
      pin: {
        chainId: 1404,
        deniedHostSubstrings: [],
        heights: [{ height: 316002, blockHash: COMMUNITY_316002 }],
      },
      endpoints: [
        { name: "east", url: community.url, family: "community" },
        { name: "scan", url: scan.url, family: "scan" },
      ],
      subject: "0x1111111111111111111111111111111111111111",
    });
    assert.equal(pack.liveChainIds.every((c) => c.ok && c.result === 1404), true);
    assert.equal(pack.splits[0].matchesPin, false);
    assert.equal(Object.keys(pack.splits[0].byHash).length, 2);
    assert.equal(pack.nonce?.agree, false);
    assert.deepEqual(pack.nonce?.uniqueCounts, [4, 7]);
  } finally {
    await community.close();
    await scan.close();
  }
});

test("buildEvidencePack matches the community pin when both mocks agree", async () => {
  const a = await startMockRpc({
    chainId: 1404,
    blocks: { 316002: { number: 316002, hash: COMMUNITY_316002 } },
  });
  const b = await startMockRpc({
    chainId: 1404,
    blocks: { 316002: { number: 316002, hash: COMMUNITY_316002 } },
  });
  try {
    const pack = await buildEvidencePack({
      pin: {
        chainId: 1404,
        deniedHostSubstrings: [],
        heights: [{ height: 316002, blockHash: COMMUNITY_316002 }],
      },
      endpoints: [
        { name: "east", url: a.url, family: "community" },
        { name: "west", url: b.url, family: "community" },
      ],
    });
    assert.equal(pack.splits[0].matchesPin, true);
  } finally {
    await a.close();
    await b.close();
  }
});
