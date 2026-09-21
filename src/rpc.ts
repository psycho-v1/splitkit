import type { BlockHeaderView, Hex, RpcCallResult, RpcEndpoint } from "./types.js";

interface JsonRpcOk<T> {
  jsonrpc: "2.0";
  id: number;
  result: T;
}

interface JsonRpcErr {
  jsonrpc: "2.0";
  id: number;
  error: { code: number; message: string };
}

export async function jsonRpc<T>(
  endpoint: RpcEndpoint,
  method: string,
  params: unknown[],
  timeoutMs = 8_000,
): Promise<RpcCallResult<T>> {
  const started = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(endpoint.url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
      signal: controller.signal,
    });
    if (!res.ok) {
      return {
        endpoint,
        ok: false,
        error: `HTTP ${res.status}`,
        ms: Date.now() - started,
      };
    }
    const body = (await res.json()) as JsonRpcOk<T> | JsonRpcErr;
    if ("error" in body && body.error) {
      return {
        endpoint,
        ok: false,
        error: body.error.message,
        ms: Date.now() - started,
      };
    }
    return {
      endpoint,
      ok: true,
      result: (body as JsonRpcOk<T>).result,
      ms: Date.now() - started,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { endpoint, ok: false, error: message, ms: Date.now() - started };
  } finally {
    clearTimeout(timer);
  }
}

export function hexToNumber(hex: string): number {
  return Number(BigInt(hex));
}

export async function ethChainId(endpoint: RpcEndpoint): Promise<RpcCallResult<number>> {
  const raw = await jsonRpc<Hex>(endpoint, "eth_chainId", []);
  if (!raw.ok || raw.result === undefined) {
    return { ...raw, result: undefined, ok: false };
  }
  return { ...raw, result: hexToNumber(raw.result) };
}

export async function ethGetTransactionCount(
  endpoint: RpcEndpoint,
  address: Hex,
  blockTag: "latest" | "pending" = "latest",
): Promise<RpcCallResult<number>> {
  const raw = await jsonRpc<Hex>(endpoint, "eth_getTransactionCount", [address, blockTag]);
  if (!raw.ok || raw.result === undefined) {
    return { ...raw, result: undefined, ok: false };
  }
  return { ...raw, result: hexToNumber(raw.result) };
}

interface RawBlock {
  number: Hex;
  hash: Hex;
  parentHash: Hex;
  stateRoot: Hex;
  timestamp: Hex;
}

export async function ethGetBlockByNumber(
  endpoint: RpcEndpoint,
  height: number,
): Promise<RpcCallResult<BlockHeaderView | null>> {
  const raw = await jsonRpc<RawBlock | null>(endpoint, "eth_getBlockByNumber", [
    `0x${height.toString(16)}`,
    false,
  ]);
  if (!raw.ok) {
    return { ...raw, result: undefined };
  }
  if (!raw.result) {
    return { ...raw, result: null };
  }
  return {
    ...raw,
    result: {
      number: hexToNumber(raw.result.number),
      hash: raw.result.hash,
      parentHash: raw.result.parentHash,
      stateRoot: raw.result.stateRoot,
      timestamp: hexToNumber(raw.result.timestamp),
    },
  };
}
