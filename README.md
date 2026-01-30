# Prism Protocol
**Privacy infrastructure for Solana**

> Build anonymous voting, wallet protection, token gating, dark pool trading, and any privacy-preserving application with one SDK.

## 🎯 What Prism Provides

**Prism Protocol is infrastructure** – identity, contexts, ZK proofs, and encryption so developers can build privacy into their apps.

- **Identity & contexts** – Root identity plus disposable context identities (DeFi, Social, Gaming, etc.) with spending limits and revocation.
- **ZK solvency proofs** – Prove “balance ≥ threshold” without revealing the amount (Noir).
- **Arcium MPC encryption** – Encrypt balances and data; combine with proofs for maximum privacy.

**Use it for:** anonymous DAO voting, anti-drain wallet protection, token gating, private DeFi/dark pools, social privacy, and custom privacy-preserving flows.

## 💡 Example: The Dark Pool Problem

**Dark pool traders face an impossible choice:**
- Prove you're solvent to access the pool → Reveal holdings → Get front-run
- Hide your holdings → Can't prove solvency → Locked out

**With Prism:** create a disposable context, generate a ZK solvency proof (“balance ≥ $10K”), access the pool without exposing your real balance, then burn the context. Same primitives work for voting, gating, and other use cases.

## 🔑 Key Innovations (MVP Scope)

### 1. Context-Based Identities
```
Root Identity (Hidden)
└── Context (DeFi, Social, Gaming, etc.)
    ├── Fresh wallet address (PDA)
    ├── Spending limits enforced
    └── Burns after use
```

**Why it matters:** Main wallet never exposed to apps, pools, or other parties.

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

**Why it matters:** End-to-end encryption ensures even proof generation is private.

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
Context PDA Derivation → 9CyUh3VM... (disposable identity)
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

## 🎯 Use Cases (SDK-Powered)

The **Prism SDK** (`@prism-protocol/sdk`) supports many use cases; the **demo app** showcases dark pool trading.

### Demo: Dark Pool Trading
1. Connect wallet → Create context → Generate ZK solvency proof → Access pool → Execute trade → Burn context. Main wallet never exposed.

### Other Use Cases (Same SDK)
- **Anonymous DAO voting** – Vote without revealing token holdings
- **Wallet drain protection** – Disposable contexts with low limits for unknown sites
- **Token gating** – Prove “hold ≥ N tokens” without revealing amount
- **Private DeFi** – Trade without linking to main wallet
- **Social / professional** – Contexts for different identities and limits

*See [packages/sdk/EXAMPLES.md](./packages/sdk/EXAMPLES.md) for full code examples and [packages/sdk/README.md](./packages/sdk/README.md) for API docs.*

## 🏗️ Technical Stack (MVP)

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
const context = await prism.createContext({ type: ContextType.DeFi, maxPerTransaction: 1_000_000_000n });
const proof = await prism.generateSolvencyProof({ actualBalance: 500_000_000n, threshold: 100_000_000n });
// Use proof for voting, gating, dark pool access, etc.
```

Full API and use-case examples: **[packages/sdk/README.md](./packages/sdk/README.md)** and **[packages/sdk/EXAMPLES.md](./packages/sdk/EXAMPLES.md)**.

### Why use Prism
- ✅ **One SDK, many use cases** – Voting, gating, dark pools, wallet protection, and more
- ✅ **Simple API** – Identity, contexts, proofs, encryption
- ✅ **Open source** – MIT license
- ✅ **Composable** – Works with existing Solana apps

## 🏆 Hackathon Strategy

### Target Bounties (Total: $32K)

| Bounty | Prize | Our Angle |
|--------|-------|-----------|
| **Privacy Tooling Track** | $15,000 | SDK for privacy-preserving dark pools |
| **Aztec/Noir** | $7,500 | First Noir-based identity SDK |
| **Arcium** | $8,000 | End-to-end private DeFi with MPC |
| **Range** | $1,500 | Selective disclosure proofs |

### Why We Win
- ✅ **Actually works** - Fully functional, not vaporware
- ✅ **Novel architecture** - Context-based identities (never seen before)
- ✅ **Technical depth** - Noir + Arcium + Solana smart contracts
- ✅ **Real problem** - Whale front-running costs millions in MEV
- ✅ **One demo, four bounties** - Maximum ROI on time invested

## 🚀 7-Day Build Timeline

| Day | Focus | Deliverable |
|-----|-------|-------------|
| **Day 1** | Smart contracts | Deployed to devnet |
| **Day 2** | Noir circuits | Working solvency proofs |
| **Day 3** | SDK core | TypeScript SDK functional |
| **Day 4** | Arcium integration | Encrypted balance proofs |
| **Day 5** | Demo app | Dark pool simulator |
| **Day 6** | Polish & docs | Submission-ready |
| **Day 7** | Video & submit | Submitted to all bounties |

**See [WINNING_STRATEGY.md](./WINNING_STRATEGY.md) for detailed execution plan.**

## 🔧 Development Setup

```bash
# Clone repository
git clone https://github.com/yourusername/prism-protocol
cd prism-protocol

# Install dependencies
npm install

# Build Solana programs
cd prism
anchor build
anchor test

# Install Noir
curl -L https://noir-lang.org/install | bash
noirup

# Run demo
npm run dev
```

## 🎥 Demo

**Coming soon:** Live demo and 3-minute video (Feb 1, 2026)

## 📚 Documentation

### For Hackathon Execution
- **[WINNING_STRATEGY.md](./WINNING_STRATEGY.md)** ⭐ - **START HERE** - Focused MVP plan
- [Anchor Smart Contracts](./prism/) - Solana program source
- SDK Documentation - Coming after Day 3

### Full Vision & Research
- [/ideation/](./ideation/) - Complete product vision, use cases, and research
  - PRD.md - Full feature specifications
  - ARCHITECTURE.md - Complete technical architecture
  - USE_CASES.md - All potential applications
  - And more...

*Note: Focus on WINNING_STRATEGY.md during hackathon. Ideation docs are for reference and post-hackathon development.*

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

## 📄 License

MIT License - Open source for the Solana ecosystem

---

**Built for Solana Privacy Hackathon 2026**  
*Privacy infrastructure that actually works*

---

## 🙏 Acknowledgments

Built with:
- [Aztec Noir](https://noir-lang.org) - ZK circuit language
- [Arcium](https://arcium.com) - MPC encryption
- [Anchor](https://www.anchor-lang.com) - Solana framework
- [Solana](https://solana.com) - High-performance blockchain

---

**Questions?** Open an issue or check the ideation docs.
