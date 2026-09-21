# splitkit

Chain-agnostic toolkit for an EVM network that may have **more than one history**.

It does four things and nothing else:

1. Refuse RPC hosts on a deny list.
2. Pin `eth_chainId` and block hash (optionally state root) at named heights.
3. Scan `eth_getTransactionCount` across families and say whether they agree.
4. Export a timestamped JSON evidence pack. No keys. No sends.

This is the portable core behind the 1404 desk / kedge / evidence tools.
The library does not mention a token ticker in its API.
You pass pins and endpoints in.

## Install

```bash
git clone https://github.com/psycho-v1/splitkit.git
cd splitkit
npm install
npm test
npm run build
```

Node 20+. Thirteen tests, including a mock JSON-RPC pair that reproduces the 1404 split at block 316002 without touching the live net.

## Chain 1404 as a config, not the type system

```text
examples/chain-1404.pin.json         community hash at 316002 + deny list
examples/chain-1404.endpoints.json   labelled community + scan hosts
browser/splitkit.js                  IIFE used by Desk and Kedge
```

Send tools apply `deniedHostSubstrings` (bdagscan / blockdag.works).
Compare tools (Desk) pass both families and let `detectSplit` score the pin.

## Library

```ts
import { assertAllowed, detectSplit, buildEvidencePack } from "@psycho-v1/splitkit";

assertAllowed("https://rpc.example.org", ["blocked.example"]);
```

## CLI

```bash
node dist/cli.js --pin examples/pin.example.json --endpoints examples/endpoints.example.json
```

Exit `1` if any pinned height disagrees across live RPCs.

## Consumers

- [Chain-1404-Desk](https://github.com/psycho-v1/Chain-1404-Desk) — inspect scores 316002 with `Splitkit.detectSplit`
- [kedge](https://github.com/psycho-v1/kedge) — `assertAllowed` refuses scan-family hosts before a write

MIT.
