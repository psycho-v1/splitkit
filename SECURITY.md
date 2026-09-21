# Security

This library never asks for a seed, private key, or mnemonic.
It only talks to JSON-RPC endpoints you pass in.

## Do not

- Put secrets in issues, configs committed to git, or evidence JSON
- Point a tool at an RPC you do not trust for *reads* if the payload matters in court
- Treat a matching pin as proof the rest of the chain is honest

## Report

Open a private advisory on this repo or write Telegram @psycho_v1.
Do not file a public issue for a key-handling bug if you ever fork this into a signer.
