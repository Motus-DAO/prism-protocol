# Prism Protocol
**Privacy infrastructure for Solana**

Prove solvency without revealing your balance. Private dark pool access, anonymous voting, token gating, and wallet protection with one SDK. *Your wallet's invisible shield.*

**[Try the Dark Pool Demo](https://prism-protocol-demo.vercel.app/demo)** · [Read the docs](./docs/README.md) · [GitHub](https://github.com/Motus-DAO/prism-protocol)

---

## Overview

This project implements a privacy protocol on Solana that allows users to:

- **Create context** — Derive a disposable identity (PDA) per app or use case. One root identity refracts into many context-bound addresses (like light through a prism into colors). Spending limits and revocation on-chain.
- **Prove solvency** — Generate a zero-knowledge proof (Noir) that balance ≥ threshold without revealing the amount. Selective disclosure: prove what's needed, hide the rest.
- **Encrypt & bind** — Arcium MPC encrypts balances; commitments are bound to the context. Verifiers see commitment + proof, not plaintext.
- **Access or revoke** — Use the context and proof for dark pool access, voting, gating, etc.; or burn the context when done. Main wallet never exposed.

The implementation uses **Noir ZK proofs** and **Arcium MPC encryption** with **Solana PDAs** so that dApps see a context address and verified credentials, not your main wallet or full balance.

### Example: The Dark Pool Problem

Dark pool traders face an impossible choice: prove solvency → reveal holdings → get front-run; or hide holdings → can't prove solvency → locked out. **With Prism:** create a disposable context, generate a ZK solvency proof ("balance ≥ $10K"), access the pool without exposing your real balance, then burn the context. [More: Dark Pools and Solana](./docs/DARK_POOLS_AND_SOLANA.md).

---

## Project Structure

| Path | Description |
|------|-------------|
| `prism/` | Solana on-chain program (Anchor) — root identity, context manager |
| `prism/programs/prism/src/` | Rust source for the program |
| `packages/sdk/` | TypeScript SDK — `@prism-protocol/sdk` |
| `apps/demo/` | Demo app (Next.js) — landing + dark pool flow |
| `circuits/solvency_proof/` | Noir ZK circuit — balance ≥ threshold |
| `docs/` | Reference docs |

---

## Prerequisites

- Solana CLI 2.1.x / 3.x
- Rust 1.79+ (for Anchor)
- Node.js 18+
- npm or yarn
- [Noir](https://noir-lang.org/docs/getting_started/installation/) (for circuit build; SDK uses pre-built artifacts)
- [Anchor](https://www.anchor-lang.com/docs/installation) (for program build)

---

## SDK

If you want to integrate Prism into your project, use the **Prism Protocol SDK**.

**Install**

```bash
npm install @prism-protocol/sdk
# or: yarn add @prism-protocol/sdk
# or: pnpm add @prism-protocol/sdk
```

**5-line example**

```typescript
import { PrismProtocol, ContextType } from '@prism-protocol/sdk';

const prism = new PrismProtocol({ rpcUrl: 'https://api.devnet.solana.com', wallet });
await prism.initialize();
const context = await prism.createContext({ type: ContextType.DeFi, maxPerTransaction: 1_000_000_000n });
const proof = await prism.generateSolvencyProof({ actualBalance: 500_000_000n, threshold: 100_000_000n });
// Use proof for voting, gating, dark pool access, etc.
```

Full API and examples: [packages/sdk/README.md](./packages/sdk/README.md) and [packages/sdk/EXAMPLES.md](./packages/sdk/EXAMPLES.md).

---

## Anchor Program

Navigate to the program directory:

```bash
cd prism
```

**Build the program**

```bash
anchor build
```

**Run tests**

```bash
anchor test
# or from repo root: cargo test in prism/programs/prism
```

**Deploy to devnet**

Program ID (devnet): `DkD3vtS6K8dJFnGmm9X9CphNDU5LYTYyP8Ve5EEVENdu`

```bash
anchor build
anchor deploy --provider.cluster devnet
```

(Use your own keypair and cluster config as needed; see `prism/Anchor.toml`.)

---

## Run the Demo

```bash
# From repo root
npm install
npm run dev
# Demo app: http://localhost:3000
# Dark pool flow: http://localhost:3000/demo
```

Or use the deployed demo: **[Try the Dark Pool Demo](https://prism-protocol-demo.vercel.app/demo)**.

---

## Documentation

| Doc | Description |
|-----|-------------|
| [docs/README.md](./docs/README.md) | Docs homepage |
| [TECHNICAL_WHAT_THE_SDK_ACTUALLY_DOES.md](./docs/TECHNICAL_WHAT_THE_SDK_ACTUALLY_DOES.md) | What we do and don't claim (privacy, signer visibility) |
| [DARK_POOLS_AND_SOLANA.md](./docs/DARK_POOLS_AND_SOLANA.md) | Why dark pools matter on Solana and what Prism solves |
| [ARCIUM_CRYPTOGRAPHIC_FLOW.md](./docs/ARCIUM_CRYPTOGRAPHIC_FLOW.md) | Arcium + ZK flow |
| [packages/sdk/README.md](./packages/sdk/README.md) | SDK API |

---

## Transparency: What We Do and Don't Claim

**What this SDK provides:** Context-based identities (one address per use case), ZK solvency proofs (prove balance ≥ threshold without revealing amount), Arcium encryption binding balances to contexts, and spending limits / revocable contexts. **Application-level isolation** so dApps see a context PDA, not your main wallet.

**What we do not provide:** Signer anonymity. On Solana, the fee-payer wallet is always visible on every transaction. Root and context PDAs are derivable from the signer. We do not break that link. See [TECHNICAL_WHAT_THE_SDK_ACTUALLY_DOES.md](./docs/TECHNICAL_WHAT_THE_SDK_ACTUALLY_DOES.md).

---

## License

MIT License — open source for the Solana ecosystem.

---

## Acknowledgments

Built with [Aztec Noir](https://noir-lang.org), [Arcium](https://arcium.com), [Anchor](https://www.anchor-lang.com), and [Solana](https://solana.com).

**Built for Solana Privacy Hackathon 2026**
