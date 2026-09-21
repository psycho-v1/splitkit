#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { buildEvidencePack } from "./evidence.ts";
import type { ChainPin, Hex, RpcEndpoint } from "./types.ts";

function arg(flag: string): string | undefined {
  const i = process.argv.indexOf(flag);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

async function main() {
  const pinPath = arg("--pin");
  const endpointsPath = arg("--endpoints");
  const subject = arg("--address") as Hex | undefined;
  if (!pinPath || !endpointsPath) {
    console.error("Usage: splitkit --pin pin.json --endpoints endpoints.json [--address 0x...]");
    process.exit(2);
  }
  const pin = JSON.parse(await readFile(pinPath, "utf8")) as ChainPin;
  const endpoints = JSON.parse(await readFile(endpointsPath, "utf8")) as RpcEndpoint[];
  const pack = await buildEvidencePack({ pin, endpoints, subject });
  console.log(JSON.stringify(pack, null, 2));
  const broken = pack.splits.filter((s) => !s.matchesPin);
  if (broken.length) {
    console.error(`# splitkit: ${broken.length} height(s) disagree with the pin`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
