import { filterAllowed } from "./deny.js";
import { scanNonce } from "./nonce.js";
import { detectSplit } from "./pin.js";
import { ethChainId, ethGetBlockByNumber } from "./rpc.js";
import type { ChainPin, EvidencePack, Hex, RpcEndpoint } from "./types.js";

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
