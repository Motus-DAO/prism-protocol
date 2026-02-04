# Prism Protocol
**Privacy infrastructure for Solana**

> Your wallet's invisible shield. Build anonymous voting, wallet protection, token gating, dark pool trading, and any privacy-preserving application with one SDK.

**[Try the Dark Pool Demo](https://prism-protocol-seven.vercel.app/demo)** · **[Install SDK](https://www.npmjs.com/package/@prism-protocol/sdk)** · [Read the docs](./docs/README.md) · [GitHub](https://github.com/Motus-DAO/prism-protocol)

### 🚀 Quick Links

- **Demo (Dark Pool)**: [https://prism-protocol-seven.vercel.app/demo](https://prism-protocol-seven.vercel.app/demo)
- **SDK Dashboard / Dev Console**: [https://prism-protocol-seven.vercel.app/dashboard](https://prism-protocol-seven.vercel.app/dashboard)
- **SDK Docs**: [./packages/sdk/README.md](./packages/sdk/README.md) + [./packages/sdk/EXAMPLES.md](./packages/sdk/EXAMPLES.md)
- **Hackathon Videos**: 
  - [Presentation Pitch](https://www.youtube.com/watch?v=MxZ5y9t_nbI)
  - [Technical Deep Dive](https://www.youtube.com/watch?v=ev7V-qwF4z0)
- **Program ID (devnet)**: `DkD3vtS6K8dJFnGmm9X9CphNDU5LYTYyP8Ve5EEVENdu`

---

## 🎯 What Prism Provides

**Prism Protocol is privacy infrastructure** – identity containers, ZK proofs, and encryption so developers can build privacy into their Solana apps.

- **🎭 Identity Containers with Cryptographic Context Bindings** – Root identity plus disposable context identities (DeFi, Social, Gaming, etc.). Each context is a tamper-proof container where identity, proofs, and encrypted data are cryptographically bound together. Your DeFi context can't leak into your social context. True compartmentalization at the protocol level.
- **🔐 ZK Solvency Proofs** – Prove "balance ≥ threshold" without revealing the amount (Noir circuits). Selective disclosure: prove what's needed, hide the rest.
- **🔒 Arcium MPC Encryption** – Encrypt balances and data; commitments cryptographically bound to contexts for maximum privacy.

**Use it for:** anonymous DAO voting, anti-drain wallet protection, token gating, private DeFi/dark pools, cross-app reputation, and custom privacy-preserving flows.

## 🛠️ Why This is Privacy Tooling (Not Just a Demo)

Prism Protocol is a **privacy SDK** that integrates into any Solana application. The dark pool demo is one example use case.

- **One SDK integrates into any Solana app** – Developers install `@prism-protocol/sdk` and get context identities, ZK proofs, and encrypted commitments in minutes
- **Context identities + ZK solvency + encrypted commitments** – Complete privacy primitives: disposable identities, selective disclosure proofs, and MPC encryption all in one package
- **Dark pool is one example** – The same SDK powers anonymous voting, token gating, wallet protection, and any privacy-preserving flow. See [EXAMPLES.md](./packages/sdk/EXAMPLES.md) for more

## 💡 Example: The Dark Pool Problem

**Dark pool traders face an impossible choice:**
- Prove you're solvent to access the pool → Reveal holdings → Get front-run
- Hide your holdings → Can't prove solvency → Locked out

**With Prism:** create a disposable context, generate a ZK solvency proof ("balance ≥ $10K"), access the pool without exposing your real balance, then burn the context. Same primitives work for voting, gating, and other use cases. [More: Dark Pools and Solana](./docs/DARK_POOLS_AND_SOLANA.md).

---

## 🔑 Key Innovations

### 1. Context-Based Identities

**The Flow:**
```
Step 1: Create Root Identity (One-time, Soulbound, encrypted)
    ↓
Step 2: Derive Context Identities
    ↓
Root Identity (Hidden, Permanent)
└── Context (DeFi, Social, Gaming, etc.)
    ├── Fresh wallet address (PDA)
    ├── Spending limits enforced
    └── Burns after use
```

**Why it matters:** You create a permanent root identity **once**, then derive unlimited disposable contexts from it. Main wallet never exposed to apps, pools, or other parties. One root identity refracts into many context-bound addresses (like light through a prism into colors).

### 2. Noir ZK Solvency Proofs
```rust
// Prove balance threshold without revealing amount
fn verify_solvency(
    actual_balance: Field,    // Private: $500K
    threshold: pub Field       // Public: $10K
) -> pub bool {
    actual_balance >= threshold
}
```

**Why it matters:** Selective disclosure - prove what's needed, hide what's not.

### 3. Arcium MPC Encryption
```typescript
// Encrypt balance before proving
const encrypted = await arcium.encrypt({
  balance: wallet.balance,
  context: contextPubkey
});

// Proof uses encrypted value
const proof = await noir.prove(encrypted, threshold);
```

**Why it matters:** End-to-end encryption ensures even proof generation is private. Commitments bound to specific contexts for isolation.

## 🔐 Arcium MPC Integration

**Prism Protocol is the first stack to combine Arcium MPC encryption with Noir ZK proofs and Solana contexts.**

### The Arcium-First Approach

Each encrypted balance is **cryptographically bound** to a disposable context identity. The dark pool sees only:
- A commitment hash (from Arcium)
- A ZK proof (from Noir)
- A context address (from Solana)

**The actual balance and root wallet remain completely hidden.**

### Cryptographic Flow

```
User Wallet ($500K SOL)
    ↓
[STEP 1: Create Root Identity] (One-time, Soulbound PDA)
    ↓
[STEP 2: Derive Context PDA] → 9CyUh3VM... (disposable identity)
    ↓
Arcium MPC Encryption
    ├── X25519 key agreement with MXE
    ├── CSplRescueCipher encryption
    ├── Commitment: H(balance || contextPubkey || nonce)
    └── Guarantee: "Only decryptable with this specific context"
    ↓
Noir ZK Proof
    ├── Private: encrypted balance (from Arcium)
    ├── Public: threshold ($10K)
    └── Proof: "Balance ≥ threshold" (without revealing)
    ↓
Dark Pool Verification
    ├── Verify ZK proof
    ├── Check Arcium commitment
    └── Grant access (balance never revealed, context isolated)
```

### Why Context Binding Matters

By including the `contextPubkey` in the Arcium commitment, we ensure:
- **Context Isolation**: Each context has its own encryption
- **Non-transferability**: A commitment from one context can't be used for another
- **Binding Guarantee**: The commitment proves the balance was encrypted for THIS specific context

### Technical Details

- **X25519 Key Agreement**: Establishes shared secret with Arcium MXE
- **CSplRescueCipher**: Arcium's threshold encryption cipher
- **Commitment Generation**: `H(balance || contextPubkey || nonce)` for verification
- **MPC Network**: Real Arcium multi-party computation (when configured)

**See [ARCIUM_INTEGRATION_DEEP_DIVE.md](./packages/sdk/src/encryption/ARCIUM_INTEGRATION_DEEP_DIVE.md) for complete technical documentation.**

---

## 🎯 Use Cases (SDK-Powered)

The **Prism SDK** (`@prism-protocol/sdk`) supports many use cases; the **demo app** showcases dark pool trading.

### Demo: Dark Pool Trading
1. **Create root identity** (one-time setup) → **Create DeFi context** → Generate ZK solvency proof → Access pool → Execute trade → Burn context. Main wallet never exposed.

### Other Use Cases (Same SDK)
- **🗳️ Anonymous DAO voting** – Vote without revealing token holdings
- **🛡️ Wallet drain protection** – Disposable contexts with low limits for unknown sites
- **🎫 Token gating** – Prove "hold ≥ N tokens" without revealing amount
- **💱 Private DeFi** – Trade without linking to main wallet
- **⭐ Cross-app reputation** – Build reputation across dApps without linking activities
- **👤 Social / professional** – Contexts for different identities and limits

*See [packages/sdk/EXAMPLES.md](./packages/sdk/EXAMPLES.md) for full code examples and [packages/sdk/README.md](./packages/sdk/README.md) for API docs.*

---

## 🛠️ For Developers

### Install & 5-Line Example

Install from npm: **[@prism-protocol/sdk](https://www.npmjs.com/package/@prism-protocol/sdk)**

```bash
npm install @prism-protocol/sdk
# or: yarn add @prism-protocol/sdk
# or: pnpm add @prism-protocol/sdk
```

```typescript
import { PrismProtocol, ContextType } from '@prism-protocol/sdk';

const prism = new PrismProtocol({ rpcUrl: 'https://api.devnet.solana.com', wallet });
await prism.initialize();

// Step 1: Create your root identity (one-time, soulbound)
await prism.createRootIdentity();

// Step 2: Create a context from your root identity
const context = await prism.createContext({ type: ContextType.DeFi, maxPerTransaction: 1_000_000_000n });

// Step 3: Generate proofs using your context
const proof = await prism.generateSolvencyProof({ actualBalance: 500_000_000n, threshold: 100_000_000n });
// Use proof for voting, gating, dark pool access, etc.
```

Full API and use-case examples: **[packages/sdk/README.md](./packages/sdk/README.md)** and **[packages/sdk/EXAMPLES.md](./packages/sdk/EXAMPLES.md)**.

### Why use Prism
- ✅ **One SDK, many use cases** – Voting, gating, dark pools, wallet protection, reputation, and more
- ✅ **Simple API** – Identity containers, contexts, proofs, encryption
- ✅ **Open source** – MIT license
- ✅ **Composable** – Works with existing Solana apps
- ✅ **Novel architecture** – Context-based identities with cryptographic bindings

---

## 🏗️ Technical Stack

### Smart Contracts (Solana/Anchor)
```rust
// Two core contracts:
1. Root Identity - Soulbound master identity
2. Context Manager - Create/revoke contexts with limits
```

### ZK Proofs (Noir)
```rust
// One production circuit:
solvency_proof.nr - Balance threshold verification
```

### Encryption (Arcium)
```typescript
// MPC encryption for sensitive data:
- Balance amounts
- Context metadata
- Cryptographic commitment binding
```

### SDK (@prism-protocol/sdk)
```typescript
// Developer interface:
class PrismProtocol {
  createRootIdentity()
  createContext(type, limits)
  generateSolvencyProof(threshold)
  revokeContext(pubkey)
}
```

### Demo Application
```
Dark Pool Trading Simulator
- Built with Next.js + React
- Solana wallet integration
- Real-time proof generation
- Context lifecycle visualization
```

---

## 📁 Project Structure

| Path | Description |
|------|-------------|
| `prism/` | Solana on-chain program (Anchor) — root identity, context manager |
| `prism/programs/prism/src/` | Rust source for the program |
| `packages/sdk/` | TypeScript SDK — `@prism-protocol/sdk` |
| `apps/demo/` | Demo app (Next.js) — landing + dark pool flow |
| `circuits/solvency_proof/` | Noir ZK circuit — balance ≥ threshold |
| `docs/` | Reference docs |

---

## 🚀 Quick Start

### Prerequisites

- Solana CLI 2.1.x / 3.x
- Rust 1.79+ (for Anchor)
- Node.js 18+
- npm or yarn
- [Noir](https://noir-lang.org/docs/getting_started/installation/) (for circuit build; SDK uses pre-built artifacts)
- [Anchor](https://www.anchor-lang.com/docs/installation) (for program build)

### Run the Demo

**For Judges / Quick Start:**

```bash
# From repo root
npm install
npm run dev
# Demo app: http://localhost:3000
# Dark pool flow: http://localhost:3000/demo
# SDK Dashboard: http://localhost:3000/dashboard
```

**What to try:**
1. **Dark Pool Demo** (`/demo`): Create root identity → Create DeFi context → Generate ZK solvency proof → Access pool → Execute trade → Burn context
2. **SDK Dashboard** (`/dashboard`): Developer console with RPC config, Arcium status, context types, parameters, and copy-paste code snippets
3. **Requirements**: Solana wallet (Phantom/Solflare) connected to devnet. If something already exists (root identity, context), the UI handles it gracefully.

**Or use the deployed demo**: 
- **[Dark Pool Demo](https://prism-protocol-seven.vercel.app/demo)**
- **[SDK Dashboard](https://prism-protocol-seven.vercel.app/dashboard)**

### Build the Anchor Program

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

## 🏆 Hackathon Track + Bounty Alignment

### Track Selection
- **Primary Track**: Privacy Tooling
- **Secondary Track**: Open Track

### Bounties Targeted

| Bounty | Prize | How Prism Fulfills It |
|--------|-------|----------------------|
| **Privacy Tooling Track** | $15,000 | Complete SDK for privacy-preserving applications. One package provides context identities, ZK proofs, and encrypted commitments. Integrates into any Solana app. |
| **Aztec/Noir** | $7,500 | First Noir-based identity SDK on Solana. Production circuit (`solvency_proof.nr`) proves balance ≥ threshold without revealing amount. Selective disclosure for voting, gating, dark pools. |
| **Arcium** | $8,000 | End-to-end private DeFi with MPC encryption. Encrypted balances and commitments cryptographically bound to contexts. X25519 key agreement + CSplRescueCipher. First stack combining Arcium MPC + Noir ZK + Solana contexts. |
| **Helius** (optional) | - | RPC/tooling integration for reliable Solana network access |

### Why We Win
- ✅ **Actually works** - Fully functional, not vaporware
- ✅ **Novel architecture** - Context-based identities (never seen before)
- ✅ **Technical depth** - Noir + Arcium + Solana smart contracts
- ✅ **Real problem** - Whale front-running costs millions in MEV
- ✅ **One SDK, multiple bounties** - Maximum ROI on time invested

**See [WINNING_STRATEGY.md](./WINNING_STRATEGY.md) for detailed execution plan.**

---

## 📚 Documentation

### Root (start here)
- **[README.md](./README.md)** - This file
- **[SUBMISSION.md](./SUBMISSION.md)** ⭐ - Hackathon submission details (track, links, judge pitch)
- **[WINNING_STRATEGY.md](./WINNING_STRATEGY.md)** ⭐ - Hackathon execution plan
- **[HACKATHON_GAP_ANALYSIS.md](./HACKATHON_GAP_ANALYSIS.md)** - Submission checklist & gaps
- [CHANGELOG.md](./CHANGELOG.md) - Project history

### [docs/](./docs/) – Reference
- [TECHNICAL_WHAT_THE_SDK_ACTUALLY_DOES.md](./docs/TECHNICAL_WHAT_THE_SDK_ACTUALLY_DOES.md) - What we do and don't claim
- [DARK_POOLS_AND_SOLANA.md](./docs/DARK_POOLS_AND_SOLANA.md) - Why dark pools matter on Solana
- [ARCIUM_CRYPTOGRAPHIC_FLOW.md](./docs/ARCIUM_CRYPTOGRAPHIC_FLOW.md) - Arcium + ZK flow
- [UNDER_THE_HOOD_EXPLANATION.md](./docs/UNDER_THE_HOOD_EXPLANATION.md) - Step-by-step execution
- [DEMO_SCRIPT.md](./docs/DEMO_SCRIPT.md) - 3-minute demo script
- [ARCHITECTURE_EXPLAINED.md](./docs/ARCHITECTURE_EXPLAINED.md), [ERROR_HANDLING.md](./docs/ERROR_HANDLING.md), [UPDATE_ENV.md](./docs/UPDATE_ENV.md), [ARCIUM_READY.md](./docs/ARCIUM_READY.md), and other setup/reference docs

### Code
- [Anchor program](./prism/) - Solana program source
- [SDK](./packages/sdk/) - [packages/sdk/README.md](./packages/sdk/README.md), API.md, EXAMPLES.md

---

## 📊 SDK Dashboard / Dev Console

The **SDK Dashboard** is a developer console for configuring and testing Prism Protocol. Access it at `/dashboard` in the demo app or [https://prism-protocol-seven.vercel.app/dashboard](https://prism-protocol-seven.vercel.app/dashboard).

**Features:**
- **RPC & Network Configuration** – View and configure Solana RPC endpoints
- **Program Information** – Devnet program ID and deployment status
- **Arcium MPC Status** – Encryption mode (simulation/live), MXE address, cluster ID
- **Context Types** – Reference table of all context types (DeFi, Social, Gaming, etc.)
- **Parameters** – Interactive parameter tuning with live code snippet generation
- **Config Snippet** – Copy-paste ready initialization code for your app

The dashboard demonstrates how developers integrate Prism into their applications. All configuration generates ready-to-use code snippets.

## 🔒 Transparency: What We Do and Don't Claim

**What this SDK provides:** Context-based identities (one address per use case), ZK solvency proofs (prove balance ≥ threshold without revealing amount), Arcium encryption binding balances to contexts, and spending limits / revocable contexts. **Application-level isolation** so dApps see a context PDA, not your main wallet.

**What we do not provide:** Signer anonymity. On Solana, the fee-payer wallet is always visible on every transaction. Root and context PDAs are derivable from the signer, so an on-chain analyst can link contexts to the same wallet. We do not break that link.

**Honesty / Limitations:** We do not provide signer anonymity on Solana; fee payer remains visible. We provide application-level privacy via contexts + proofs.

*Full technical explanation: [docs/TECHNICAL_WHAT_THE_SDK_ACTUALLY_DOES.md](./docs/TECHNICAL_WHAT_THE_SDK_ACTUALLY_DOES.md)*

---

## 🎯 Project Philosophy

**"One feature, fully working, maximum prizes."**

We're building ONE killer demo that:
- Actually works (deployed and functional)
- Solves a real problem (whale front-running)
- Demonstrates technical mastery (Noir + Arcium + Solana)
- Targets multiple bounties ($32K potential)

Not building:
- ❌ 8 half-finished features
- ❌ Vaporware architecture diagrams
- ❌ Concept demos without real code

We've learned: **Judges reward what works, not what's promised.**

---

## 📄 License

MIT License - Open source for the Solana ecosystem

---

## 🙏 Acknowledgments

Built with:
- [Aztec Noir](https://noir-lang.org) - ZK circuit language
- [Arcium](https://arcium.com) - MPC encryption
- [Anchor](https://www.anchor-lang.com) - Solana framework
- [Solana](https://solana.com) - High-performance blockchain

**Built for Solana Privacy Hackathon 2026**  
*Privacy infrastructure that actually works*

---

**Questions?** Open an issue or check the docs.