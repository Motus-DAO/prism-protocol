# Prism Protocol Architecture Explained

## The Three Layers

### 1. **Signing Wallet (Your Phantom Wallet)**
- **What it is**: Your actual wallet address (e.g., `2poR...E3UM`)
- **Role**: Signs all transactions
- **Privacy**: This is what you want to keep private!

### 2. **Root Identity (Master Identity PDA)**
- **What it is**: A Program Derived Address (PDA) created from your wallet
- **Derivation**: `[b"root", your_wallet_public_key]` → `J6yUQE4B...`
- **Role**: Your "master identity" on-chain that owns all contexts
- **Stores**: 
  - `owner`: Your signing wallet (public)
  - `context_count`: How many contexts you've created
  - `privacy_level`: Your privacy settings
- **Privacy**: Can be derived from your wallet, so it's linkable to you

### 3. **Context Identity (Disposable Identity PDA)**
- **What it is**: A PDA created from your root identity
- **Derivation**: `[b"context", root_identity, context_index]` → `32nGnZkj...`
- **Role**: Your "disposable identity" for dark pool trading
- **Stores**:
  - `root_identity`: Link to root (this is what we encrypt!)
  - `context_type`: DeFi, Social, Gaming, etc.
  - `max_per_transaction`: Spending limits
- **Privacy**: This is your anonymous identity - no direct link to your wallet

## The Privacy Problem

```
Your Phantom Wallet (2poR...E3UM)
    ↓ (derivable)
Root Identity PDA (J6yUQE4B...)
    ↓ (stored in context)
Context Identity PDA (32nGnZkj...)
```

**The Issue**: 
- If someone sees the `root_identity` in a context, they can't directly get your wallet
- BUT if they know your wallet, they can derive your root identity
- AND if they see multiple contexts with the same root_identity, they can link them together

## What Should We Encrypt?

### Option 1: Encrypt the Signing Wallet
- **Pros**: Hides your actual wallet address
- **Cons**: The root identity PDA can still be derived from wallet (if someone has it)

### Option 2: Encrypt the Root Identity (Current Implementation)
- **Pros**: Prevents linking contexts together (they all have encrypted root_identity)
- **Cons**: Root identity can still be derived from wallet

### Option 3: Encrypt Both (Best Privacy)
- Encrypt the signing wallet hash in the context
- This way, even if someone knows your wallet, they can't verify it matches the context

## Current Implementation

Right now, we encrypt the **root identity PDA** because:
1. The root identity is what's stored in the context
2. Encrypting it prevents linking multiple contexts together
3. The signing wallet is already hidden (not stored in context)

But we just changed it to encrypt the **signing wallet** - let me check what makes more sense...
