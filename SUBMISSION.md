# Prism Protocol - Hackathon Submission

## Track Selection

- **Primary Track**: Privacy Tooling
- **Secondary Track**: Open Track

## Official Links

- **Repository**: [https://github.com/Motus-DAO/prism-protocol](https://github.com/Motus-DAO/prism-protocol)
- **Demo (Dark Pool)**: [https://prism-protocol-seven.vercel.app/demo](https://prism-protocol-seven.vercel.app/demo)
- **SDK Dashboard / Dev Console**: [https://prism-protocol-seven.vercel.app/dashboard](https://prism-protocol-seven.vercel.app/dashboard)
- **SDK Documentation**: 
  - [SDK README](./packages/sdk/README.md)
  - [SDK EXAMPLES](./packages/sdk/EXAMPLES.md)
- **Presentation Video**: [https://www.youtube.com/watch?v=MxZ5y9t_nbI](https://www.youtube.com/watch?v=MxZ5y9t_nbI)
- **Technical Video**: [https://www.youtube.com/watch?v=ev7V-qwF4z0](https://www.youtube.com/watch?v=ev7V-qwF4z0)
- **Program ID (devnet)**: `DkD3vtS6K8dJFnGmm9X9CphNDU5LYTYyP8Ve5EEVENdu`

## Judge Pitch

**Prism Protocol is privacy infrastructure for Solana** – a complete SDK that gives developers context identities, ZK proofs, and encrypted commitments in one package. We're not just a dark pool demo; we're the first stack to combine Arcium MPC encryption with Noir ZK proofs and Solana context-based identities.

**The Problem**: Solana applications lack privacy primitives. Developers can't build anonymous voting, wallet protection, or private DeFi without complex custom implementations. Whales get front-run when they reveal holdings to prove solvency. Users can't compartmentalize their identity across different apps.

**The Solution**: One SDK (`@prism-protocol/sdk`) that provides:
- **Context-based identities**: Disposable PDAs derived from a root identity, cryptographically bound to use cases
- **ZK solvency proofs**: Prove balance ≥ threshold without revealing amount (Noir circuits)
- **Arcium MPC encryption**: Encrypt balances and data with commitments bound to contexts

**Why This Wins**: We're the first to combine Arcium + Noir + Solana contexts. The dark pool demo shows it works, but the SDK integrates into any Solana app for voting, gating, protection, and more. Fully functional, deployed, and ready for developers.

## Cryptographic Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER WALLET ($500K SOL)                       │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 1: Create Root Identity (One-time, Soulbound PDA)         │
│  • Permanent master identity                                     │
│  • Encrypted, never exposed to apps                              │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 2: Derive Context PDA (Disposable Identity)               │
│  • Example: 9CyUh3VM... (DeFi context)                           │
│  • Spending limits enforced                                      │
│  • Can be revoked after use                                      │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 3: Arcium MPC Encryption                                   │
│  • X25519 key agreement with MXE                                │
│  • CSplRescueCipher encryption                                  │
│  • Commitment: H(balance || contextPubkey || nonce)            │
│  • Guarantee: Only decryptable with this specific context        │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 4: Noir ZK Proof                                           │
│  • Private input: encrypted balance (from Arcium)                │
│  • Public input: threshold ($10K)                                │
│  • Proof: "Balance ≥ threshold" (without revealing amount)       │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 5: Dark Pool Verification                                  │
│  • Verify ZK proof (valid)                                        │
│  • Check Arcium commitment (bound to context)                    │
│  • Grant access (balance never revealed, context isolated)       │
└─────────────────────────────────────────────────────────────────┘
```

## Bounty Alignment

### Privacy Tooling Track ($15,000)
Complete SDK for privacy-preserving applications. One package provides context identities, ZK proofs, and encrypted commitments. Integrates into any Solana app. The dark pool is one example; developers use the same SDK for voting, gating, wallet protection, and more.

### Aztec/Noir Bounty ($7,500)
First Noir-based identity SDK on Solana. Production circuit (`solvency_proof.nr`) proves balance ≥ threshold without revealing amount. Selective disclosure for voting, gating, dark pools. Full integration with Solana smart contracts.

### Arcium Bounty ($8,000)
End-to-end private DeFi with MPC encryption. Encrypted balances and commitments cryptographically bound to contexts. X25519 key agreement + CSplRescueCipher. First stack combining Arcium MPC + Noir ZK + Solana contexts.

## Technical Stack

- **Smart Contracts**: Solana/Anchor (Root Identity + Context Manager)
- **ZK Proofs**: Noir (`solvency_proof.nr` circuit)
- **Encryption**: Arcium MPC (X25519 + CSplRescueCipher)
- **SDK**: TypeScript (`@prism-protocol/sdk` on npm)
- **Demo**: Next.js + React

## Quick Start for Judges

```bash
npm install
npm run dev
# Visit http://localhost:3000/demo
# Connect wallet (devnet)
# Create root identity → Create context → Generate proof → Access pool
```

Or use the deployed demo: [https://prism-protocol-seven.vercel.app/demo](https://prism-protocol-seven.vercel.app/demo)

## Honesty / Limitations

We do not provide signer anonymity on Solana; fee payer remains visible. We provide application-level privacy via contexts + proofs. Full explanation: [docs/TECHNICAL_WHAT_THE_SDK_ACTUALLY_DOES.md](./docs/TECHNICAL_WHAT_THE_SDK_ACTUALLY_DOES.md)
