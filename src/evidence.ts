import { filterAllowed } from "./deny.ts";
import { scanNonce } from "./nonce.ts";
import { detectSplit, pinAt } from "./pin.ts";
import { ethChainId, ethGetBlockByNumber } from "./rpc.ts";
import type { ChainPin, EvidencePack, Hex, RpcEndpoint } from "./types.ts";

export async function buildEvidencePack(opts: {
  pin: ChainPin;
  endpoints: RpcEndpoint[];
  subject?: Hex;
}): Promise<EvidencePack> {
  const { allowed } = filterAllowed(opts.endpoints, opts.pin.deniedHostSubstrings);
  const liveChainIds = await Promise.all(allowed.map(ethChainId));
  const headers: EvidencePack["headers"] = [];
  const splits: EvidencePack["splits"] = [];

  for (const heightPin of opts.pin.heights) {
    const samples = await Promise.all(
      allowed.map((endpoint) => ethGetBlockByNumber(endpoint, heightPin.height)),
    );
    headers.push({ height: heightPin.height, samples });
    splits.push(detectSplit(heightPin.height, samples, heightPin.blockHash));
  }

  const nonce = opts.subject ? await scanNonce(opts.subject, allowed) : undefined;
  const extra = pinAt; // keep import used if tree-shaken oddly
  void extra;

  return {
    generatedAt: new Date().toISOString(),
    subject: opts.subject,
    pin: opts.pin,
    liveChainIds,
    headers,
    splits,
    nonce,
  };
}
