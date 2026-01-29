# Prism Protocol SDK - Use Case Examples

This document provides complete, working examples for common use cases built with the Prism Protocol SDK.

## Table of Contents

1. [Anonymous DAO Voting](#1-anonymous-dao-voting)
2. [Anti-Drain Wallet Protection](#2-anti-drain-wallet-protection)
3. [Token Gating](#3-token-gating)
4. [Private DeFi Trading](#4-private-defi-trading)
5. [Social Media Privacy](#5-social-media-privacy)
6. [Age Verification (Custom Proof)](#6-age-verification-custom-proof)
7. [Professional Reputation](#7-professional-reputation)

---

## 1. Anonymous DAO Voting

**Use Case**: Vote in DAO governance without revealing your token holdings.

```typescript
import { PrismProtocol, ContextType, PrivacyLevel } from '@prism-protocol/sdk';

async function anonymousVoting() {
  const prism = new PrismProtocol({
    rpcUrl: 'https://api.devnet.solana.com',
    wallet: yourWallet
  });
  await prism.initialize();

  // Create governance context
  const context = await prism.createContext({
    type: ContextType.Governance,
    privacyLevel: PrivacyLevel.Maximum
  });

  // Get user's actual token balance
  const userBalance = await getTokenBalance(yourWallet.publicKey);
  const minimumVotingTokens = 1000n * 1_000_000_000n; // 1000 tokens

  // Generate proof: balance >= minimum (without revealing amount)
  const proof = await prism.generateSolvencyProof({
    actualBalance: userBalance,
    threshold: minimumVotingTokens
  });

  // Submit vote with proof (balance hidden!)
  await daoContract.vote({
    proposalId: 123,
    vote: 'yes',
    proof: proof,
    contextAddress: context.contextAddress
  });

  // Revoke context after voting
  await prism.revokeContextByIndex(context.contextIndex);
  
  console.log('Vote submitted anonymously!');
}
```

**Key Benefits**:
- ✅ Vote without revealing holdings
- ✅ Prevent vote buying based on holdings
- ✅ Maintain privacy while participating in governance

---

## 2. Anti-Drain Wallet Protection

**Use Case**: Use disposable contexts for suspicious sites to protect your main wallet.

```typescript
import { PrismProtocol, ContextType } from '@prism-protocol/sdk';

async function walletProtection() {
  const prism = new PrismProtocol({
    rpcUrl: 'https://api.devnet.solana.com',
    wallet: yourWallet
  });
  await prism.initialize();

  // Create temporary context with low spending limit
  const tempContext = await prism.createContext({
    type: ContextType.Temporary,
    maxPerTransaction: 0.1n * 1_000_000_000n // Only 0.1 SOL max
  });

  console.log(`Using disposable wallet: ${tempContext.contextAddress.toBase58()}`);
  console.log('Main wallet protected! Max loss: 0.1 SOL');

  // Use tempContext for suspicious site
  // If site tries to drain, max they can get is 0.1 SOL
  await suspiciousSite.connect(tempContext.contextAddress);

  // After use, revoke immediately
  await prism.revokeContextByIndex(tempContext.contextIndex);
  console.log('Context burned - no trace left!');
}
```

**Key Benefits**:
- ✅ Limit exposure to unknown sites
- ✅ Main wallet never exposed
- ✅ Easy to revoke if compromised

---

## 3. Token Gating

**Use Case**: Grant access to exclusive content based on token holdings (without revealing amount).

```typescript
import { PrismProtocol, ContextType } from '@prism-protocol/sdk';

async function tokenGating() {
  const prism = new PrismProtocol({
    rpcUrl: 'https://api.devnet.solana.com',
    wallet: yourWallet
  });
  await prism.initialize();

  // Create social context for this platform
  const context = await prism.createContext({
    type: ContextType.Social
  });

  // Get user's token balance
  const tokenBalance = await getTokenBalance(yourWallet.publicKey);
  const requiredTokens = 100n * 1_000_000_000n; // 100 tokens required

  // Generate proof: balance >= required (amount hidden)
  const proof = await prism.generateSolvencyProof({
    actualBalance: tokenBalance,
    threshold: requiredTokens
  });

  // Request access with proof
  const accessGranted = await exclusivePlatform.requestAccess({
    proof: proof,
    contextAddress: context.contextAddress
  });

  if (accessGranted) {
    console.log('Access granted! Your token amount remains private.');
  } else {
    console.log('Access denied - insufficient tokens (but amount not revealed)');
  }
}
```

**Key Benefits**:
- ✅ Prove eligibility without revealing holdings
- ✅ Prevent discrimination based on wealth
- ✅ Maintain privacy while accessing exclusive content

---

## 4. Private DeFi Trading

**Use Case**: Trade on DEX without linking transactions to your main wallet.

```typescript
import { PrismProtocol, ContextType } from '@prism-protocol/sdk';

async function privateTrading() {
  const prism = new PrismProtocol({
    rpcUrl: 'https://api.devnet.solana.com',
    wallet: yourWallet
  });
  await prism.initialize();

  // Create DeFi context for trading
  const context = await prism.createContext({
    type: ContextType.DeFi,
    maxPerTransaction: 50n * 1_000_000_000n // 50 SOL limit
  });

  // Generate encrypted proof for dark pool access
  const result = await prism.generateEncryptedSolvencyProof({
    actualBalance: 500n * 1_000_000_000n, // 500 SOL (hidden)
    threshold: 10n * 1_000_000_000n,      // 10 SOL minimum (public)
    contextPubkey: context.contextAddress
  });

  // Access dark pool with encrypted proof
  await darkPool.enter({
    proof: result.proof,
    encryptedBalance: result.encryptedBalance,
    contextAddress: context.contextAddress
  });

  // Execute trades using context address
  await dex.swap({
    from: context.contextAddress,
    amount: 20n * 1_000_000_000n,
    // Main wallet never exposed!
  });

  // Revoke context after trading
  await prism.revokeContextByIndex(context.contextIndex);
  console.log('Trading complete - no link to main wallet!');
}
```

**Key Benefits**:
- ✅ Trade without revealing main wallet
- ✅ Prevent front-running based on wallet history
- ✅ Complete transaction privacy

---

## 5. Social Media Privacy

**Use Case**: Post and interact on social platforms without revealing your main identity.

```typescript
import { PrismProtocol, ContextType } from '@prism-protocol/sdk';

async function socialPrivacy() {
  const prism = new PrismProtocol({
    rpcUrl: 'https://api.devnet.solana.com',
    wallet: yourWallet
  });
  await prism.initialize();

  // Create social context for this platform
  const socialContext = await prism.createContext({
    type: ContextType.Social,
    maxPerTransaction: 1n * 1_000_000_000n // 1 SOL for tips/tips
  });

  console.log(`Social identity: ${socialContext.contextAddress.toBase58()}`);
  console.log('Main wallet hidden!');

  // Post using context address
  await socialPlatform.post({
    author: socialContext.contextAddress,
    content: 'Hello, world!',
    // Main wallet never linked to this post
  });

  // Interact with other posts
  await socialPlatform.like({
    postId: 123,
    from: socialContext.contextAddress
  });

  // Tip creators (optional)
  await socialPlatform.tip({
    to: creatorAddress,
    amount: 0.1n * 1_000_000_000n,
    from: socialContext.contextAddress
  });

  // Keep context active for ongoing use, or revoke when done
  // await prism.revokeContextByIndex(socialContext.contextIndex);
}
```

**Key Benefits**:
- ✅ Separate social identity from main wallet
- ✅ Prevent doxxing through wallet analysis
- ✅ Maintain privacy while engaging

---

## 6. Age Verification (Custom Proof)

**Use Case**: Prove you're over 18 without revealing your exact birthdate.

> **Note**: This example shows how to extend the SDK with custom proofs. The SDK currently provides solvency proofs, but the pattern can be extended.

```typescript
import { PrismProtocol, ContextType } from '@prism-protocol/sdk';

// Custom age verification prover (conceptual example)
class AgeProver {
  async generateAgeProof(birthdate: Date, thresholdAge: number) {
    const age = this.calculateAge(birthdate);
    const thresholdTimestamp = Date.now() - (thresholdAge * 365 * 24 * 60 * 60 * 1000);
    
    // Prove: birthdate <= threshold (without revealing exact date)
    // This would use a custom Noir circuit
    return {
      proof: await this.generateZKProof({
        birthdateTimestamp: birthdate.getTime(),
        thresholdTimestamp: thresholdTimestamp
      }),
      publicInputs: {
        thresholdAge,
        isOverAge: age >= thresholdAge
      }
    };
  }

  private calculateAge(birthdate: Date): number {
    const today = new Date();
    let age = today.getFullYear() - birthdate.getFullYear();
    const monthDiff = today.getMonth() - birthdate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthdate.getDate())) {
      age--;
    }
    return age;
  }
}

async function ageVerification() {
  const prism = new PrismProtocol({
    rpcUrl: 'https://api.devnet.solana.com',
    wallet: yourWallet
  });
  await prism.initialize();

  const ageProver = new AgeProver();
  const userBirthdate = new Date('2000-01-01');

  // Generate age proof: age >= 18 (without revealing exact birthdate)
  const ageProof = await ageProver.generateAgeProof(userBirthdate, 18);

  // Access age-restricted content
  await gamingPlatform.verifyAge({
    proof: ageProof,
    // Exact birthdate never revealed!
  });
}
```

**Key Benefits**:
- ✅ Prove eligibility without revealing exact age
- ✅ Comply with regulations while maintaining privacy
- ✅ Extensible pattern for other proofs

---

## 7. Professional Reputation

**Use Case**: Prove professional experience without revealing client identities.

```typescript
import { PrismProtocol, ContextType } from '@prism-protocol/sdk';

async function professionalReputation() {
  const prism = new PrismProtocol({
    rpcUrl: 'https://api.devnet.solana.com',
    wallet: yourWallet
  });
  await prism.initialize();

  // Create professional context
  const professionalContext = await prism.createContext({
    type: ContextType.Professional,
    maxPerTransaction: 0n // No spending, just identity
  });

  // Generate proof of experience (conceptual)
  // This would use a custom circuit proving:
  // - Years of experience >= threshold
  // - Number of projects >= threshold
  // Without revealing client names or project details

  const experienceProof = await generateExperienceProof({
    yearsExperience: 10,
    projectCount: 50,
    thresholdYears: 5,
    thresholdProjects: 20
  });

  // Apply for job with proof
  await jobPlatform.apply({
    contextAddress: professionalContext.contextAddress,
    experienceProof: experienceProof,
    // Client identities remain private!
  });
}
```

**Key Benefits**:
- ✅ Prove qualifications without revealing clients
- ✅ Maintain client confidentiality
- ✅ Build reputation while preserving privacy

---

## 🎯 Common Patterns

### Pattern 1: Create → Prove → Use → Revoke

```typescript
// 1. Create context
const context = await prism.createContext({ type: ContextType.DeFi });

// 2. Generate proof
const proof = await prism.generateSolvencyProof({ ... });

// 3. Use context
await someService.use({ context, proof });

// 4. Revoke when done
await prism.revokeContextByIndex(context.contextIndex);
```

### Pattern 2: Encrypted Contexts for Maximum Privacy

```typescript
// Use encrypted contexts when you need maximum privacy
const context = await prism.createContextEncrypted({
  type: ContextType.DeFi
});

// Root identity is encrypted, contexts are unlinkable
```

### Pattern 3: Reusable Contexts

```typescript
// Keep context active for ongoing use
const context = await prism.createContext({ type: ContextType.Social });

// Use multiple times
await service1.use(context);
await service2.use(context);

// Only revoke when completely done
await prism.revokeContextByIndex(context.contextIndex);
```

---

## 🔗 Next Steps

- Read the [API Reference](./API.md) for complete method documentation
- Check [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for common issues
- See the main [README.md](./README.md) for installation and setup

---

**Have a use case not covered here?** Open an issue or contribute an example!
