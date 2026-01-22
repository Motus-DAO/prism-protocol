# Encryption vs ZK Proofs: When to Use Each

## Two Different Use Cases

### 1. **Root Identity Encryption (Arcium)**
**Purpose**: Hide which contexts belong to the same user

**When**: When creating a context (`createContextEncrypted`)

**What it does**:
- Encrypts the root identity PDA with Arcium MPC
- Stores encrypted hash in context account
- Prevents linking multiple contexts together

**Flow**:
```
Your Wallet → Root Identity PDA → Encrypt with Arcium → Store hash in context
```

**Result**: 
- ✅ Contexts can't be linked (different encrypted hashes)
- ✅ Root identity hidden from blockchain analysis
- ❌ Doesn't prove anything about balance

---

### 2. **Balance Encryption + ZK Proof (Arcium + Noir)**
**Purpose**: Prove solvency without revealing balance

**When**: When accessing dark pool (`generateEncryptedSolvencyProof`)

**What it does**:
1. **Arcium encrypts** your balance → Creates commitment
2. **Noir proves** encrypted balance ≥ threshold → ZK proof

**Flow**:
```
Your Balance ($500K) 
  → Encrypt with Arcium (binds to context)
  → Generate ZK proof (balance ≥ $10K threshold)
  → Dark pool verifies both
```

**Result**:
- ✅ Balance encrypted (Arcium commitment)
- ✅ Solvency proven (Noir ZK proof)
- ✅ Balance never revealed
- ❌ Doesn't hide root identity

---

## The Complete Picture

### For Context Creation:
```
createContextEncrypted()
  ├── Encrypt root identity (Arcium) ← Hides context linking
  └── Store encrypted hash on-chain
```

### For Dark Pool Access:
```
generateEncryptedSolvencyProof()
  ├── Encrypt balance (Arcium) ← Hides balance amount
  ├── Generate ZK proof (Noir) ← Proves solvency
  └── Dark pool verifies both
```

---

## Answer: Use BOTH, but for different purposes!

1. **Encrypt root identity** → When creating contexts (prevents linking)
2. **Encrypt balance + ZK proof** → When proving solvency (proves without revealing)

They're complementary:
- Root identity encryption = Identity privacy
- Balance encryption + ZK = Balance privacy + Proof

---

## Current Implementation

Looking at the code:

### ✅ Root Identity Encryption (Implemented)
```typescript
// PrismProtocol.ts:267-274
const encryptionResult = await this.arciumEncryption.encryptData({
  data: rootPDA,  // Encrypt root identity
  bindingKey: contextPDA
});
```

### ✅ Balance Encryption + ZK (Implemented)
```typescript
// PrismProtocol.ts:592-611
// Step 1: Encrypt balance
const encryptionResult = await this.arciumEncryption.encryptBalance({
  balance: params.actualBalance,
  contextPubkey: params.contextPubkey
});

// Step 2: Generate ZK proof
const proof = await this.solvencyProver.generateProof({
  actualBalance: params.actualBalance,
  threshold: params.threshold
});
```

Both are already implemented! They serve different purposes in the privacy stack.
