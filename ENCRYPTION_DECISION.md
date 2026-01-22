# What Should We Encrypt? Analysis

## Current State

### What's Stored in ContextIdentity:
```rust
pub struct ContextIdentity {
    pub root_identity: Pubkey,                    // PLAINTEXT - stored for program logic
    pub root_identity_hash: Option<[u8; 32]>,    // ENCRYPTED - for privacy
    pub encryption_commitment: Option<[u8; 32]>, // Arcium commitment
    // ... other fields
}
```

### What's Visible in Transactions:
- **Signing Wallet**: Always visible in transaction signature (can't hide - required for signing)
- **Root Identity**: Stored in plaintext in context account
- **Context Identity**: The PDA address itself

## The Privacy Problem

### Scenario: Someone analyzes the blockchain

1. **They see a context transaction:**
   - Signing wallet: `2poR...E3UM` (visible in tx signature)
   - Context PDA: `32nGnZkj...` (the disposable identity)
   - Root identity: `J6yUQE4B...` (stored in plaintext in account)

2. **They can derive:**
   - From signing wallet → Root identity PDA (deterministic)
   - From root identity → Link multiple contexts together

3. **Result:** All your contexts are linkable!

## What Should We Encrypt?

### Option 1: Encrypt Root Identity ✅ (RECOMMENDED)

**What it does:**
- Encrypts the root identity PDA before storing
- Stores hash instead of (or in addition to) plaintext

**Pros:**
- Prevents linking multiple contexts together
- Root identity is what's stored in context, so encrypting it directly addresses the problem
- The signing wallet isn't stored in context, so encrypting it wouldn't help

**Cons:**
- Root identity still stored in plaintext for program logic (line 95)
- Someone who knows your wallet can still derive your root identity

**Current Implementation:**
- ✅ Encrypting root identity
- ❌ But still storing it in plaintext (defeats the purpose!)

### Option 2: Encrypt Signing Wallet ❌

**What it does:**
- Encrypts the signing wallet address

**Pros:**
- Hides your actual wallet

**Cons:**
- Signing wallet is NOT stored in context (it's only in tx signature)
- Doesn't prevent linking contexts (they still share same root_identity)
- Can't hide signing wallet from transaction signature (required for Solana)

### Option 3: Encrypt Both ⚠️

**What it does:**
- Encrypts both signing wallet and root identity

**Pros:**
- Maximum privacy

**Cons:**
- Signing wallet encryption doesn't help (not stored in context)
- More complex, minimal benefit

## The Real Issue

**The problem is on line 95:**
```rust
context.root_identity = root.key(); // Still store for program logic
```

We're storing the root identity in **plaintext** even though we encrypt it! This defeats the purpose.

## Recommendation

**Encrypt the Root Identity** because:
1. It's what's stored in the context
2. It's what links contexts together
3. Encrypting it prevents context linking

**BUT** we need to either:
- Remove the plaintext storage (if program logic allows)
- OR make it optional/encrypted-only for privacy contexts

The signing wallet doesn't need to be encrypted in the context because:
- It's not stored there
- It's only visible in transaction signatures (which we can't hide)
- Encrypting it wouldn't prevent context linking anyway
