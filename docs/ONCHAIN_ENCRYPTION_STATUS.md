## Is Root Identity Encrypted On-Chain? Current Status

### Current Implementation Status

#### What's Stored in `ContextIdentity` (per flow)

**Public contexts** (`create_context`):

```rust
// Standard, linkable context
context.root_identity = root.key();          // ⚠️ PLAINTEXT root identity
context.root_identity_hash = None;           // No hash stored
context.encryption_commitment = None;        // No Arcium commitment
```

**Encrypted contexts** (`create_context_encrypted`):

```rust
// Privacy-preserving context
let computed_hash = hash_root_identity(&root.key());
require!(computed_hash == root_identity_hash, PrismError::InvalidRootHash);

context.root_identity = Pubkey::default();   // ✅ Zero pubkey = do NOT store root
context.root_identity_hash = Some(root_identity_hash);        // ✅ ENCRYPTED HASH
context.encryption_commitment = Some(encryption_commitment);  // ✅ ARCIUM COMMITMENT
```

### Answer: **PARTIALLY ENCRYPTED (BY DESIGN)** ⚠️

#### What You'll See on Solscan

1. **Public context (`create_context`)**
   - `root_identity`: **PLAINTEXT** ✅ Visible  
     Root identity PDA in plaintext; anyone can link all public contexts for that root.
   - `root_identity_hash`: `None`
   - `encryption_commitment`: `None`

2. **Encrypted context (`create_context_encrypted`)**
   - `root_identity`: **Zero pubkey** (`1111...111`) ✅ Indicates encrypted mode
   - `root_identity_hash` (Option<[u8; 32]>): **ENCRYPTED HASH** ✅ Visible as bytes
   - `encryption_commitment` (Option<[u8; 32]>): **ARCIUM COMMITMENT** ✅ Visible as bytes

### How to Check on Solscan

1. Go to Solscan.
2. Search for your context PDA address (the disposable identity).
3. Look at the account data:
   - **Public context**:
     - `root_identity`: Plaintext Pubkey (visible)
   - **Encrypted context**:
     - `root_identity`: Zero pubkey
     - `root_identity_hash`: 32 bytes (encrypted hash, visible as hex)
     - `encryption_commitment`: 32 bytes (Arcium commitment, visible as hex)

### Current Privacy Level

**Public Contexts**: ❌ **NOT ENCRYPTED** (plaintext visible)
- Anyone can see `root_identity` on Solscan.
- Contexts can be linked together via this field.

**Encrypted Contexts**: ✅ **ON-CHAIN ENCRYPTED ROOT**
- `root_identity` field does **not** reveal the root (zero pubkey).
- Only `root_identity_hash` and `encryption_commitment` are stored.
- Arcium is used off-chain to compute the commitment + hash.

**Important:** PDA derivation (`[b"context", root_identity, index]`) still uses the root PDA,  
so an attacker who already knows your root PDA can derive its context PDAs.  
The value-add is that the **context account itself never points back to the root**.

# Is Root Identity Encrypted On-Chain? Current Status

## Current Implementation Status

### What's Stored in ContextIdentity Account:

Looking at line 95-97 in `lib.rs`:

```rust
// Store encrypted/hashed root identity
context.root_identity = root.key(); // ⚠️ PLAINTEXT - Still stored for program logic
context.root_identity_hash = Some(root_identity_hash); // ✅ ENCRYPTED HASH
context.encryption_commitment = Some(encryption_commitment); // ✅ ARCIUM COMMITMENT
```

## Answer: **PARTIALLY ENCRYPTED** ⚠️

### What You'll See on Solscan:

1. **`root_identity`** (Pubkey) - **PLAINTEXT** ✅ Visible
   - This is the root identity PDA in plaintext
   - Anyone can see this and link contexts together
   - Example: `J6yUQE4BDDdC76ZcBsh3hcjb98EPPrCU3Aeba7k5sR39`

2. **`root_identity_hash`** (Option<[u8; 32]>) - **ENCRYPTED HASH** ✅ Visible as bytes
   - This is the SHA-256 hash of the root identity
   - Stored as 32 bytes (hex: 64 characters)
   - Example: `a3f2b1c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2`

3. **`encryption_commitment`** (Option<[u8; 32]>) - **ARCIUM COMMITMENT** ✅ Visible as bytes
   - This is the Arcium MPC commitment hash
   - Stored as 32 bytes (hex: 64 characters)
   - Example: `10efe65a22e96857a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4`

## The Problem

**The root identity is stored in BOTH plaintext AND encrypted form!**

- ✅ We encrypt it (good)
- ❌ But we also store it in plaintext (defeats the purpose)

**Why?** Line 95 says: "Still store for program logic"

This means:
- Anyone can see the plaintext `root_identity` on Solscan
- They can link all contexts with the same `root_identity`
- The encryption doesn't help because the plaintext is still there

## How to Check on Solscan

1. **Go to Solscan**: https://solscan.io/
2. **Search for your context PDA address** (the disposable identity)
3. **Look at the account data** - you'll see:
   - `root_identity`: Plaintext Pubkey (visible)
   - `root_identity_hash`: 32 bytes (encrypted hash, but visible as hex)
   - `encryption_commitment`: 32 bytes (Arcium commitment, visible as hex)

## What Should Happen

For true privacy, we should:
1. **Remove the plaintext `root_identity`** (or make it optional)
2. **Use only the hash for verification**
3. **Update program logic** to work with the hash instead

OR

1. **Keep plaintext for program logic** (if needed)
2. **But acknowledge** that contexts are still linkable
3. **Document** that encryption is for future use or off-chain privacy

## Current Privacy Level

**On-Chain Privacy**: ❌ **NOT ENCRYPTED** (plaintext visible)
- Anyone can see `root_identity` on Solscan
- Contexts can be linked together

**Off-Chain Privacy**: ✅ **ENCRYPTED** (hash stored)
- The hash is stored (but plaintext is also there)
- Arcium commitment is stored (for verification)

## Recommendation

To truly encrypt the root identity on-chain, we need to:
1. Remove line 95: `context.root_identity = root.key();`
2. Update all program logic to use `root_identity_hash` instead
3. Update account constraints to verify using hash

This would require refactoring the program to not rely on the plaintext `root_identity` field.
