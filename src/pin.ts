import type { ChainPin, FamilySplit, Hex, RpcCallResult, BlockHeaderView } from "./types.js";

export function normalizeHash(hash: string): Hex {
  const h = hash.toLowerCase();
  if (!/^0x[0-9a-f]{64}$/.test(h)) {
    throw new Error(`Not a 32-byte hex hash: ${hash}`);
  }
  return h as Hex;
}

export function hashesEqual(a: string, b: string): boolean {
  return a.toLowerCase() === b.toLowerCase();
}

export function pinAt(pin: ChainPin, height: number) {
  return pin.heights.find((h) => h.height === height);
}

export function detectSplit(
  height: number,
  samples: RpcCallResult<BlockHeaderView | null>[],
  pinned?: Hex,
): FamilySplit {
  const byHash: Record<string, string[]> = {};
  for (const sample of samples) {
    if (!sample.ok || !sample.result) continue;
    const hash = sample.result.hash.toLowerCase();
    if (!byHash[hash]) byHash[hash] = [];
    byHash[hash].push(`${sample.endpoint.family}:${sample.endpoint.name}`);
  }
  const hashes = Object.keys(byHash);
  const matchesPin = pinned
    ? hashes.length === 1 && hashesEqual(hashes[0], pinned)
    : hashes.length <= 1;
  return {
    height,
    byHash,
    pinned,
    matchesPin: pinned ? matchesPin : hashes.length <= 1,
  };
}

export function assertLiveChainId(live: number, expected: number): void {
  if (live !== expected) {
    throw new Error(`eth_chainId ${live} != pinned ${expected}`);
  }
}
