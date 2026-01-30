# Prism Protocol SDK

**Privacy infrastructure for building privacy-preserving applications on Solana**

[![npm version](https://img.shields.io/npm/v/@prism-protocol/sdk)](https://www.npmjs.com/package/@prism-protocol/sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

The Prism Protocol SDK provides the building blocks for privacy on Solana. Developers use our SDK to build anonymous voting, wallet protection, token gating, dark pool trading, and any privacy-preserving application.

## 🚀 Quick Start

Install the SDK:

```bash
npm install @prism-protocol/sdk
```

5-line example:

```typescript
import { PrismProtocol, ContextType } from '@prism-protocol/sdk';

const prism = new PrismProtocol({ rpcUrl: 'https://api.devnet.solana.com', wallet });
await prism.initialize();
const context = await prism.createContext({ type: ContextType.DeFi });
const proof = await prism.generateSolvencyProof({ actualBalance: 500n, threshold: 100n });
```

That's it! You now have a disposable identity and a privacy-preserving proof.

## 📦 Installation

Install from npm: **[@prism-protocol/sdk](https://www.npmjs.com/package/@prism-protocol/sdk)**

```bash
npm install @prism-protocol/sdk
# or
yarn add @prism-protocol/sdk
# or
pnpm add @prism-protocol/sdk
```

### Requirements

- Node.js 18+ or browser with ES2020 support
- Solana wallet (compatible with `@solana/web3.js` Wallet interface)
- Solana RPC endpoint (devnet or mainnet)

## 🎯 What the SDK Provides

### 1. Identity Management
- **Root Identity**: Master identity for your wallet (one per wallet)
- **Context Identities**: Disposable identities for different use cases
- **Context Revocation**: Burn contexts after use for complete privacy

### 2. Privacy-Preserving Proofs
- **ZK Solvency Proofs**: Prove balance ≥ threshold without revealing amount
- **Arcium MPC Encryption**: Encrypt balances/data with multi-party computation
- **Encrypted Proofs**: Combine ZK + encryption for maximum privacy

### 3. Context System
- **Create Contexts**: Different contexts for DeFi, Social, Gaming, etc.
- **Spending Limits**: Set max per transaction per context
- **Track Spending**: Monitor usage per context
- **Revoke Contexts**: Burn contexts when done

## 📖 Core Concepts

### Root Identity

Your root identity is your master identity on Prism Protocol. It's created once per wallet and serves as the anchor for all your contexts.

```typescript
// Create root identity (one-time operation)
const root = await prism.createRootIdentity({
  privacyLevel: PrivacyLevel.High
});
```

### Context Identities

Contexts are disposable identities derived from your root. Each context:
- Has its own address (PDA)
- Can have spending limits
- Can be revoked (burned) after use
- Is unlinkable to your root identity (when using encrypted contexts)

```typescript
// Create a context (e.g. for DeFi, governance, or trading)
const context = await prism.createContext({
  type: ContextType.DeFi,
  maxPerTransaction: 1000000000n // 1 SOL limit
});
```

### Solvency Proofs

Prove you meet a balance requirement without revealing your actual balance.

```typescript
// Prove balance >= 10 SOL without revealing actual amount
const proof = await prism.generateSolvencyProof({
  actualBalance: 500000000000n,  // 500 SOL (HIDDEN)
  threshold: 10000000000n         // 10 SOL (PUBLIC)
});
```

### Encrypted Proofs

For maximum privacy, combine encryption with ZK proofs:

```typescript
// Encrypt + prove in one call
const result = await prism.generateEncryptedSolvencyProof({
  actualBalance: 500000000000n,
  threshold: 10000000000n,
  contextPubkey: context.contextAddress
});
```

## 🔧 API Overview

### Initialization

```typescript
import { PrismProtocol } from '@prism-protocol/sdk';
import { Wallet } from '@solana/web3.js';

const prism = new PrismProtocol({
  rpcUrl: 'https://api.devnet.solana.com',
  wallet: yourWallet,
  programId: optionalProgramId, // Defaults to devnet program
  commitment: 'confirmed' // Optional
});

await prism.initialize();
```

### Identity Management

```typescript
// Create root identity
const root = await prism.createRootIdentity({ privacyLevel: PrivacyLevel.High });

// Get root identity
const identity = await prism.getRootIdentity();

// Check if root exists
const exists = await prism.hasRootIdentity();
```

### Context Management

```typescript
// Create context
const context = await prism.createContext({
  type: ContextType.DeFi,
  maxPerTransaction: 1000000000n
});

// Create encrypted context (maximum privacy)
const encryptedContext = await prism.createContextEncrypted({
  type: ContextType.DeFi,
  maxPerTransaction: 1000000000n
});

// Get all contexts
const contexts = await prism.getContexts();

// Revoke context
await prism.revokeContextByIndex(context.contextIndex);
```

### Proof Generation

```typescript
// Basic solvency proof
const proof = await prism.generateSolvencyProof({
  actualBalance: 500000000000n,
  threshold: 10000000000n
});

// Verify proof
const isValid = await prism.verifySolvencyProof(proof);

// Encrypted proof (recommended)
const encryptedProof = await prism.generateEncryptedSolvencyProof({
  actualBalance: 500000000000n,
  threshold: 10000000000n,
  contextPubkey: context.contextAddress
});
```

### Quick Helpers

```typescript
// Quick dark pool access (creates context + proof)
const result = await prism.quickDarkPoolAccess({
  balance: 500000000000n,
  threshold: 10000000000n
});

// Quick encrypted access (maximum privacy)
const encryptedResult = await prism.quickDarkPoolAccessEncrypted({
  balance: 500000000000n,
  threshold: 10000000000n
});
```

## 💡 Use Case Examples

The SDK is composable - developers combine these primitives to build custom use cases:

1. **Anonymous DAO Voting** - Vote without revealing holdings
2. **Anti-Drain Wallet Protection** - Use disposable contexts for suspicious sites
3. **Age Verification** - Prove age without revealing exact birthdate
4. **Token Gating** - Grant access based on token holding (amount hidden)
5. **Private DeFi Trading** - Trade without linking to main wallet
6. **Social Media Privacy** - Post/interact without revealing main identity

See [EXAMPLES.md](./EXAMPLES.md) for complete code examples.

## 🎨 Context Types

```typescript
enum ContextType {
  DeFi = 0,        // Dark pool trading, swaps
  Social = 1,      // Social interactions
  Gaming = 2,      // Gaming activities
  Professional = 3, // Work-related
  Temporary = 4,   // Auto-burn after use
  Public = 5       // Fully public
}
```

## 🔐 Privacy Levels

```typescript
enum PrivacyLevel {
  Maximum = 0,   // Full anonymity
  High = 1,      // Minimal disclosure
  Medium = 2,    // Balanced
  Low = 3,       // More transparent
  Public = 4     // Fully public
}
```

## 🌐 Network Configuration

### Devnet (Default)

```typescript
const prism = new PrismProtocol({
  rpcUrl: 'https://api.devnet.solana.com',
  wallet: yourWallet
});
```

### Mainnet

```typescript
const prism = new PrismProtocol({
  rpcUrl: 'https://api.mainnet-beta.solana.com',
  wallet: yourWallet
});
```

### Custom RPC

```typescript
const prism = new PrismProtocol({
  rpcUrl: 'https://your-custom-rpc.com',
  wallet: yourWallet
});
```

## 🔧 Arcium MPC Encryption

The SDK integrates with Arcium MPC for end-to-end encryption. By default, it runs in simulation mode. To enable real MPC:

```bash
# Set environment variables
export ARCIUM_MXE_ADDRESS=your_mxe_address
export ARCIUM_CLUSTER_ID=your_cluster_id
```

```typescript
// Check encryption status
const status = prism.getArciumStatus();
console.log(status.mode); // 'simulation' or 'live'
```

## 📚 Documentation

- **[EXAMPLES.md](./EXAMPLES.md)** - Complete use case examples
- **[API.md](./API.md)** - Full API reference
- **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** - Common issues and solutions
- **[MIGRATION.md](./MIGRATION.md)** - Version migration guides

## 🐛 Troubleshooting

### Common Issues

**"Program not initialized"**
- Make sure to call `await prism.initialize()` before using the SDK

**"Root identity already exists"**
- This is normal! The SDK will return the existing identity

**"Circuit not found"**
- Make sure the circuit artifact is available (see TROUBLESHOOTING.md)

**"Arcium encryption failed"**
- Check your environment variables or use simulation mode

See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for more solutions.

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines (coming soon).

## 📄 License

MIT License - see [LICENSE](./LICENSE) file for details.

## 🔗 Links

- **npm**: [@prism-protocol/sdk](https://www.npmjs.com/package/@prism-protocol/sdk) – install with `npm install @prism-protocol/sdk`
- **GitHub**: [Prism Protocol](https://github.com/Motus-DAO/Prism-protocol)
- **Documentation**: [https://docs.prismprotocol.com](https://docs.prismprotocol.com) *(if applicable)*
- **Discord**: [Join our community](https://discord.gg/prism-protocol) *(if applicable)*

## 🙏 Acknowledgments

Built with:
- [Aztec Noir](https://noir-lang.org) - ZK circuit language
- [Arcium](https://arcium.com) - MPC encryption
- [Anchor](https://www.anchor-lang.com) - Solana framework
- [Solana](https://solana.com) - High-performance blockchain

---

**Questions?** Open an issue or check the [troubleshooting guide](./TROUBLESHOOTING.md).
