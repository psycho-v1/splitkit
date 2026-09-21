import { ethGetTransactionCount } from "./rpc.ts";
import type { Hex, NonceScan, RpcEndpoint } from "./types.ts";

export async function scanNonce(address: Hex, endpoints: RpcEndpoint[]): Promise<NonceScan> {
  const rows = await Promise.all(
    endpoints.map(async (endpoint) => {
      const call = await ethGetTransactionCount(endpoint, address, "latest");
      return {
        name: endpoint.name,
        family: endpoint.family,
        transactionCount: call.ok ? call.result : undefined,
        error: call.ok ? undefined : call.error,
      };
    }),
  );
  const uniqueCounts = [
    ...new Set(rows.map((r) => r.transactionCount).filter((n): n is number => n !== undefined)),
  ].sort((a, b) => a - b);
  return {
    address,
    byEndpoint: rows,
    uniqueCounts,
    agree: uniqueCounts.length <= 1,
  };
}
