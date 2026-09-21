# splitkit

Chain-agnostic toolkit for an EVM network that may have **more than one history**.

It does four things and nothing else:

1. Refuse RPC hosts on a deny list.
2. Pin `eth_chainId` and block hash (optionally state root) at named heights.
3. Scan `eth_getTransactionCount` across families and say whether they agree.
4. Export a timestamped JSON evidence pack. No keys. No sends.

This is the portable core behind the 1404 desk / pending / evidence tools.
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

Node 20+.

## Library

```ts
import { assertAllowed, detectSplit, buildEvidencePack } from "@psycho-v1/splitkit";

assertAllowed("https://rpc.example.org", ["blocked.example"]);

const pack = await buildEvidencePack({
  pin: {
    chainId: 1,
    deniedHostSubstrings: [],
    heights: [
      {
        height: 0,
        blockHash: "0xd4e56740f876aef8c010b86a40d5f56745a118d0906a34e69aec8c0db1cb8fa3",
      },
    ],
  },
  endpoints: [{ name: "publicnode", url: "https://ethereum.publicnode.com", family: "public" }],
});
```

## CLI

```bash
node dist/cli.js --pin examples/pin.example.json --endpoints examples/endpoints.example.json
```

Exit `1` if any pinned height disagrees across live RPCs.

## What this is not

- Not a wallet, relayer, or custodian.
- Not legal advice and not an accusation.
- Not a BlockDAG product. Chain 1404 can be *one config*, not the type system.

## Why this repo exists

A static HTML page that hard-codes one chain teaches nobody how you think.
A tested library with pins, deny-lists, and an evidence schema does.

MIT.
