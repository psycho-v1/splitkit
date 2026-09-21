import type { RpcEndpoint } from "./types.ts";

export class DeniedHostError extends Error {
  constructor(public readonly url: string, public readonly matched: string) {
    super(`RPC host denied by pin: ${url} matched "${matched}"`);
    this.name = "DeniedHostError";
  }
}

export function hostOf(url: string): string {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    throw new Error(`Invalid RPC URL: ${url}`);
  }
}

export function assertAllowed(url: string, deniedHostSubstrings: string[]): void {
  const host = hostOf(url);
  for (const raw of deniedHostSubstrings) {
    const needle = raw.toLowerCase();
    if (needle && host.includes(needle)) {
      throw new DeniedHostError(url, raw);
    }
  }
}

export function filterAllowed(
  endpoints: RpcEndpoint[],
  deniedHostSubstrings: string[],
): { allowed: RpcEndpoint[]; denied: Array<{ endpoint: RpcEndpoint; matched: string }> } {
  const allowed: RpcEndpoint[] = [];
  const denied: Array<{ endpoint: RpcEndpoint; matched: string }> = [];
  for (const endpoint of endpoints) {
    try {
      assertAllowed(endpoint.url, deniedHostSubstrings);
      allowed.push(endpoint);
    } catch (err) {
      if (err instanceof DeniedHostError) {
        denied.push({ endpoint, matched: err.matched });
      } else {
        throw err;
      }
    }
  }
  return { allowed, denied };
}
