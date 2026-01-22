# Arcium Cryptographic Binding Flow
**Visual Guide to Prism Protocol's Privacy Stack**

---

## 🔐 Complete Cryptographic Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER WALLET                                  │
│              Balance: $500,000 SOL                             │
│              Address: 7xKXtg2C... (HIDDEN)                     │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│              CONTEXT PDA DERIVATION                             │
│                                                                 │
│  Seeds: ["context", rootPDA, index]                            │
│  Algorithm: findProgramAddressSync()                           │
│  Result: 9CyUh3VM... (disposable identity)                     │
│                                                                 │
│  ✓ Fresh wallet address                                        │
│  ✓ No link to root wallet                                      │
│  ✓ On-chain identity                                           │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│           ARCIUM MPC ENCRYPTION                                 │
│                                                                 │
│  Input:                                                         │
│    • balance: $500,000 SOL (PRIVATE)                           │
│    • contextPubkey: 9CyUh3VM... (PUBLIC)                       │
│                                                                 │
│  Process:                                                       │
│    1. X25519 Key Agreement                                     │
│       ├── Client generates ephemeral keypair                   │
│       ├── Fetch MXE public key from chain                     │
│       └── Compute shared secret                                │
│                                                                 │
│    2. CSplRescueCipher Encryption                              │
│       ├── Initialize cipher with shared secret                │
│       ├── Encrypt balance: [500000000000]                     │
│       └── Generate nonce: random 16 bytes                      │
│                                                                 │
│    3. Commitment Generation                                    │
│       └── H(balance || contextPubkey || nonce)                │
│                                                                 │
│  Output:                                                        │
│    • encryptedValue: 128 bytes (ciphertext)                    │
│    • commitment: a3f2b1c4... (hash)                             │
│    • contextPubkey: 9CyUh3VM... (binding)                      │
│                                                                 │
│  Guarantee:                                                     │
│    "Only decryptable with this specific context"               │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│              NOIR ZK PROOF GENERATION                           │
│                                                                 │
│  Private Inputs:                                                │
│    • actualBalance: $500,000 SOL (ENCRYPTED)                    │
│                                                                 │
│  Public Inputs:                                                 │
│    • threshold: $10,000 SOL                                     │
│                                                                 │
│  Circuit: solvency_proof.nr                                     │
│    fn main(actual_balance: u64, threshold: pub u64) -> pub bool│
│      actual_balance >= threshold                                │
│                                                                 │
│  Proof:                                                         │
│    • proof bytes: [ZK proof data]                              │
│    • publicInputs: { threshold: 10000000000, isSolvent: true } │
│                                                                 │
│  Reveals:                                                       │
│    ✓ Balance meets threshold                                    │
│    ✗ Actual balance amount                                      │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│           DARK POOL VERIFICATION                                 │
│                                                                 │
│  Receives:                                                      │
│    • Commitment hash: a3f2b1c4...                              │
│    • ZK proof: [proof bytes]                                    │
│    • Context address: 9CyUh3VM...                               │
│                                                                 │
│  Verifies:                                                      │
│    1. ✓ ZK proof is valid                                       │
│    2. ✓ Commitment matches context                              │
│    3. ✓ Balance ≥ threshold                                     │
│                                                                 │
│  Never Sees:                                                    │
│    ✗ Actual balance ($500K)                                     │
│    ✗ Root wallet address                                        │
│    ✗ Encrypted value (only commitment)                         │
│                                                                 │
│  Result:                                                        │
│    ✅ ACCESS GRANTED                                            │
│    ✅ Privacy preserved                                          │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔗 Context Binding: The Key Innovation

### Traditional Encryption (Without Binding)

```
Balance: $500K
    ↓
Encrypt → Ciphertext: abc123...
    ↓
Problem: Ciphertext can be used with ANY context
         No way to prove it was encrypted for THIS context
```

### Prism Protocol (With Context Binding)

```
Balance: $500K
Context: 9CyUh3VM...
    ↓
Encrypt → Ciphertext: abc123...
    ↓
Commitment: H($500K || 9CyUh3VM... || nonce)
    ↓
Guarantee: Commitment proves encryption was for THIS context
           Cannot be reused with another context
```

### Why This Matters

1. **Isolation**: Each context's encryption is independent
2. **Non-transferability**: Can't reuse encryption from one context in another
3. **Auditability**: Commitment proves binding without revealing balance
4. **Privacy**: Balance never revealed, even to Arcium MPC nodes

---

## 🎯 Three-Layer Privacy Stack

```
┌─────────────────────────────────────────────────────────────┐
│  LAYER 1: Solana Contexts                                    │
│  • Disposable wallet addresses                               │
│  • On-chain identity isolation                               │
│  • No link to root wallet                                    │
└─────────────────────────────────────────────────────────────┘
                            +
┌─────────────────────────────────────────────────────────────┐
│  LAYER 2: Arcium MPC Encryption                              │
│  • X25519 key agreement                                      │
│  • CSplRescueCipher threshold encryption                     │
│  • Context-bound commitments                                 │
└─────────────────────────────────────────────────────────────┘
                            +
┌─────────────────────────────────────────────────────────────┐
│  LAYER 3: Noir ZK Proofs                                     │
│  • Threshold proofs without revealing amount                 │
│  • On-chain verifiable                                       │
│  • Private inputs hidden                                     │
└─────────────────────────────────────────────────────────────┘
                            =
┌─────────────────────────────────────────────────────────────┐
│  RESULT: End-to-End Privacy                                  │
│  • Balance never revealed                                     │
│  • Root wallet never exposed                                 │
│  • Context isolated                                           │
│  • Proof verifiable                                           │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 What Each Party Sees

### User (You)
```
✓ Your actual balance: $500K
✓ Your root wallet: 7xKXtg2C...
✓ Your context: 9CyUh3VM...
✓ Your encrypted balance
✓ Your ZK proof
```

### Arcium MPC Network
```
✓ Encrypted balance (ciphertext)
✓ Commitment hash
✗ Actual balance amount
✗ Root wallet address
✗ Context purpose
```

### Dark Pool Operator
```
✓ Commitment hash: a3f2b1c4...
✓ ZK proof: [proof bytes]
✓ Context address: 9CyUh3VM...
✓ Proof validity: true
✓ Threshold met: true
✗ Actual balance amount
✗ Root wallet address
✗ Encrypted value
```

### Public (On-Chain)
```
✓ Context PDA: 9CyUh3VM... (created)
✓ Context PDA: 9CyUh3VM... (revoked)
✗ Link to root wallet
✗ Balance information
✗ Proof details
```

---

## 🔐 Security Guarantees

### What's Protected ✅

- **Balance Amount**: Encrypted with Arcium MPC, never revealed
- **Root Wallet**: Never exposed to dark pool or other traders
- **Context Binding**: Cryptographically guaranteed via commitment
- **Forward Secrecy**: New session per encryption

### What's Revealed (By Design) ✅

- **Threshold**: Public input to ZK proof (required for verification)
- **Context Address**: Public (needed for on-chain verification)
- **Commitment Hash**: Public (needed for verification)
- **Proof Validity**: Public (needed for access control)

### Attack Resistance 🛡️

- **Replay Attacks**: Prevented by nonce uniqueness
- **Context Substitution**: Prevented by commitment binding
- **Balance Inference**: Prevented by ZK proof (only threshold revealed)
- **Timing Attacks**: Mitigated by MPC threshold encryption

---

## 🎓 Key Takeaways

1. **Arcium encrypts** the balance using X25519 + CSplRescueCipher
2. **Commitment binds** the encryption to a specific context
3. **Noir proves** the balance meets threshold without revealing it
4. **Dark pool verifies** both commitment and proof
5. **Balance never revealed** at any step

**This is the first end-to-end private DeFi stack on Solana.**

---

**Last Updated**: January 2026  
**Status**: Production-ready, deployed on devnet
