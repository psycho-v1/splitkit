import http from "node:http";
import type { AddressInfo } from "node:net";

export interface MockBlock {
  number: number;
  hash: `0x${string}`;
  parentHash?: `0x${string}`;
  stateRoot?: `0x${string}`;
  timestamp?: number;
}

export interface MockChain {
  chainId: number;
  blocks: Record<number, MockBlock>;
  nonces?: Record<string, number>;
}

function qty(n: number): `0x${string}` {
  return `0x${n.toString(16)}`;
}

export function startMockRpc(chain: MockChain): Promise<{ url: string; close: () => Promise<void> }> {
  const server = http.createServer((req, res) => {
    const chunks: Buffer[] = [];
    req.on("data", (c) => chunks.push(c as Buffer));
    req.on("end", () => {
      res.setHeader("content-type", "application/json");
      try {
        const msg = JSON.parse(Buffer.concat(chunks).toString("utf8")) as {
          id: number;
          method: string;
          params: unknown[];
        };
        const result = handle(chain, msg.method, msg.params || []);
        res.end(JSON.stringify({ jsonrpc: "2.0", id: msg.id ?? 1, result }));
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        res.end(JSON.stringify({ jsonrpc: "2.0", id: 1, error: { code: -32000, message } }));
      }
    });
  });

  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address() as AddressInfo;
      resolve({
        url: `http://127.0.0.1:${port}`,
        close: () =>
          new Promise((done, fail) => server.close((e) => (e ? fail(e) : done()))),
      });
    });
  });
}

function handle(chain: MockChain, method: string, params: unknown[]): unknown {
  if (method === "eth_chainId") return qty(chain.chainId);
  if (method === "eth_getTransactionCount") {
    const addr = String(params[0] || "").toLowerCase();
    return qty(chain.nonces?.[addr] ?? 0);
  }
  if (method === "eth_getBlockByNumber") {
    const raw = String(params[0]);
    const height = raw === "latest"
      ? Math.max(...Object.keys(chain.blocks).map(Number))
      : Number(BigInt(raw));
    const block = chain.blocks[height];
    if (!block) return null;
    return {
      number: qty(block.number),
      hash: block.hash,
      parentHash: block.parentHash || (`0x${"11".repeat(32)}` as const),
      stateRoot: block.stateRoot || (`0x${"22".repeat(32)}` as const),
      timestamp: qty(block.timestamp ?? 1),
    };
  }
  throw new Error(`unimplemented ${method}`);
}
