# Prism Protocol SDK - API Reference

Complete API documentation for the Prism Protocol SDK.

## Table of Contents

- [PrismProtocol](#prismprotocol-class)
- [Types](#types)
- [Enums](#enums)

---

## PrismProtocol Class

The main entry point for the Prism Protocol SDK.

### Constructor

```typescript
new PrismProtocol(config: PrismConfig & { wallet: Wallet })
```

**Parameters:**
- `config.rpcUrl` (string, required): Solana RPC endpoint URL
- `config.wallet` (Wallet, required): Solana wallet implementing the Wallet interface
- `config.programId` (PublicKey, optional): Prism program ID (defaults to devnet program)
- `config.commitment` ('processed' | 'confirmed' | 'finalized', optional): Commitment level (default: 'confirmed')

**Example:**
```typescript
const prism = new PrismProtocol({
  rpcUrl: 'https://api.devnet.solana.com',
  wallet: yourWallet,
  commitment: 'confirmed'
});
```

---

### Initialization

#### `initialize(): Promise<void>`

Initialize the SDK and connect to the program. Must be called before using other methods (or they will call it automatically).

**Example:**
```typescript
await prism.initialize();
```

---

### Identity Management

#### `createRootIdentity(options?: CreateRootOptions): Promise<CreateRootResult>`

Create a root identity for the connected wallet. This is a one-time operation per wallet.

**Parameters:**
- `options.privacyLevel` (PrivacyLevel, optional): Privacy level for the root identity (default: `PrivacyLevel.High`)

**Returns:**
```typescript
{
  rootAddress: PublicKey;
  signature: string;
  privacyLevel: PrivacyLevel;
}
```

**Example:**
```typescript
const root = await prism.createRootIdentity({
  privacyLevel: PrivacyLevel.Maximum
});
console.log(`Root identity: ${root.rootAddress.toBase58()}`);
```

**Note:** If a root identity already exists, this method returns the existing one without creating a new transaction.

---

#### `getRootIdentity(userPubkey?: PublicKey): Promise<RootIdentity | null>`

Get the root identity for a user.

**Parameters:**
- `userPubkey` (PublicKey, optional): User's public key (defaults to connected wallet)

**Returns:**
```typescript
{
  owner: PublicKey;
  createdAt: number;
  privacyLevel: PrivacyLevel;
  contextCount: number;
  bump: number;
} | null
```

**Example:**
```typescript
const identity = await prism.getRootIdentity();
if (identity) {
  console.log(`Contexts created: ${identity.contextCount}`);
}
```

---

#### `hasRootIdentity(userPubkey?: PublicKey): Promise<boolean>`

Check if a user has a root identity.

**Parameters:**
- `userPubkey` (PublicKey, optional): User's public key (defaults to connected wallet)

**Returns:** `boolean`

**Example:**
```typescript
const exists = await prism.hasRootIdentity();
```

---

#### `getRootIdentityPDA(userPubkey?: PublicKey): [PublicKey, number]`

Get the root identity PDA (Program Derived Address) for a user.

**Parameters:**
- `userPubkey` (PublicKey, optional): User's public key (defaults to connected wallet)

**Returns:** `[PublicKey, number]` - PDA and bump seed

**Example:**
```typescript
const [rootPDA, bump] = prism.getRootIdentityPDA();
```

---

### Context Management

#### `createContext(options: CreateContextOptions): Promise<CreateContextResult>`

Create a new context (disposable identity).

**Parameters:**
```typescript
{
  type: ContextType;
  privacyLevel?: PrivacyLevel;
  maxPerTransaction?: bigint; // Default: 1 SOL (1_000_000_000n lamports)
}
```

**Returns:**
```typescript
{
  contextAddress: PublicKey;
  signature: string;
  contextType: ContextType;
  contextIndex: number;
}
```

**Example:**
```typescript
const context = await prism.createContext({
  type: ContextType.DeFi,
  maxPerTransaction: 1000000000n // 1 SOL
});
console.log(`Context: ${context.contextAddress.toBase58()}`);
```

---

#### `createContextEncrypted(options: CreateContextOptions): Promise<CreateContextResult & { rootIdentityHash: string; encryptionCommitment: string }>`

Create a new context with encrypted root identity for enhanced privacy. Uses Arcium MPC to encrypt the root identity before storing.

**Parameters:**
```typescript
{
  type: ContextType;
  privacyLevel?: PrivacyLevel;
  maxPerTransaction?: bigint;
}
```

**Returns:**
```typescript
{
  contextAddress: PublicKey;
  signature: string;
  contextType: ContextType;
  contextIndex: number;
  rootIdentityHash: string;
  encryptionCommitment: string;
}
```

**Example:**
```typescript
const context = await prism.createContextEncrypted({
  type: ContextType.DeFi,
  maxPerTransaction: 1000000000n
});
// Root identity is encrypted - contexts are unlinkable!
```

---

#### `getContexts(): Promise<ContextIdentity[]>`

Get all contexts for the connected wallet.

**Returns:**
```typescript
Array<{
  rootIdentity: PublicKey;
  contextType: ContextType;
  createdAt: number;
  maxPerTransaction: bigint;
  totalSpent: bigint;
  revoked: boolean;
  contextIndex: number;
  bump: number;
}>
```

**Example:**
```typescript
const contexts = await prism.getContexts();
contexts.forEach(ctx => {
  console.log(`Context ${ctx.contextIndex}: ${ContextType[ctx.contextType]}`);
});
```

---

#### `revokeContextByIndex(contextIndex: number): Promise<RevokeContextResult>`

Revoke (burn) a context by its index.

**Parameters:**
- `contextIndex` (number): The index of the context to revoke

**Returns:**
```typescript
{
  signature: string;
  contextAddress: PublicKey;
  totalSpent: bigint;
}
```

**Example:**
```typescript
const result = await prism.revokeContextByIndex(0);
console.log(`Context burned. Total spent: ${result.totalSpent} lamports`);
```

**Note:** If the context is already revoked, this method returns `{ signature: 'already_revoked', ... }` without creating a new transaction.

---

#### `getContextPDA(rootPDA: PublicKey, contextIndex: number): [PublicKey, number]`

Get a context PDA.

**Parameters:**
- `rootPDA` (PublicKey): Root identity PDA
- `contextIndex` (number): Context index

**Returns:** `[PublicKey, number]` - PDA and bump seed

**Example:**
```typescript
const [rootPDA] = prism.getRootIdentityPDA();
const [contextPDA, bump] = prism.getContextPDA(rootPDA, 0);
```

---

### Proof Generation

#### `generateSolvencyProof(params: { actualBalance: bigint; threshold: bigint }): Promise<SolvencyProof>`

Generate a ZK solvency proof. Proves that balance >= threshold WITHOUT revealing actual balance.

**Parameters:**
```typescript
{
  actualBalance: bigint; // User's real balance (PRIVATE - not revealed)
  threshold: bigint;     // Minimum required (PUBLIC - visible to verifier)
}
```

**Returns:**
```typescript
{
  proof: Uint8Array;
  publicInputs: {
    threshold: bigint;
    isSolvent: boolean;
  };
  timestamp: number;
  contextAddress?: PublicKey;
}
```

**Example:**
```typescript
const proof = await prism.generateSolvencyProof({
  actualBalance: 500000000000n, // 500 SOL (HIDDEN)
  threshold: 10000000000n        // 10 SOL (PUBLIC)
});
// Proof shows balance >= 10 SOL without revealing 500 SOL
```

**Throws:** Error if `actualBalance < threshold` (proof would fail)

---

#### `verifySolvencyProof(proof: SolvencyProof): Promise<boolean>`

Verify a solvency proof.

**Parameters:**
- `proof` (SolvencyProof): The proof to verify

**Returns:** `boolean` - `true` if proof is valid

**Example:**
```typescript
const isValid = await prism.verifySolvencyProof(proof);
if (isValid) {
  console.log('Proof is valid!');
}
```

---

#### `generateEncryptedSolvencyProof(params: { actualBalance: bigint; threshold: bigint; contextPubkey: PublicKey }): Promise<{ encryptedBalance: EncryptedBalance; proof: SolvencyProof; contextPubkey: string }>`

Generate an encrypted solvency proof for dark pool access. This is the FULL PRIVACY FLOW:
1. Encrypt balance with Arcium MPC
2. Generate ZK proof of solvency
3. Return both for verification

**Parameters:**
```typescript
{
  actualBalance: bigint;      // User's real balance (PRIVATE)
  threshold: bigint;          // Minimum required (PUBLIC)
  contextPubkey: PublicKey;   // Context identity for encryption binding
}
```

**Returns:**
```typescript
{
  encryptedBalance: {
    encryptedValue: Uint8Array;
    commitment: string;
    contextPubkey: string;
    timestamp: number;
    mxeAddress?: string;
  };
  proof: SolvencyProof;
  contextPubkey: string;
}
```

**Example:**
```typescript
const result = await prism.generateEncryptedSolvencyProof({
  actualBalance: 500000000000n,
  threshold: 10000000000n,
  contextPubkey: context.contextAddress
});
// Balance encrypted + proven - maximum privacy!
```

---

### Quick Helpers

#### `quickDarkPoolAccess(params: { balance: bigint; threshold: bigint }): Promise<{ context: CreateContextResult; encryptedBalance: EncryptedBalance; proof: SolvencyProof; accessGranted: boolean }>`

Quick encrypted proof for demo. Automatically creates a context, encrypts, proves, and returns everything needed.

**Parameters:**
```typescript
{
  balance: bigint;   // User's balance
  threshold: bigint; // Minimum required
}
```

**Returns:**
```typescript
{
  context: CreateContextResult;
  encryptedBalance: EncryptedBalance;
  proof: SolvencyProof;
  accessGranted: boolean;
}
```

**Example:**
```typescript
const result = await prism.quickDarkPoolAccess({
  balance: 500000000000n,
  threshold: 10000000000n
});
// Everything ready in one call!
```

---

#### `quickDarkPoolAccessEncrypted(params: { balance: bigint; threshold: bigint }): Promise<{ context: CreateContextResult & { rootIdentityHash: string; encryptionCommitment: string }; encryptedBalance: EncryptedBalance; proof: SolvencyProof; accessGranted: boolean }>`

Quick encrypted proof with MAX PRIVACY. Uses an Arcium-encrypted context so the root identity is never stored in plaintext.

**Parameters:**
```typescript
{
  balance: bigint;
  threshold: bigint;
}
```

**Returns:**
```typescript
{
  context: CreateContextResult & {
    rootIdentityHash: string;
    encryptionCommitment: string;
  };
  encryptedBalance: EncryptedBalance;
  proof: SolvencyProof;
  accessGranted: boolean;
}
```

**Example:**
```typescript
const result = await prism.quickDarkPoolAccessEncrypted({
  balance: 500000000000n,
  threshold: 10000000000n
});
// Maximum privacy - root identity encrypted!
```

---

### Utility Methods

#### `getWalletPublicKey(): PublicKey`

Get the current wallet public key.

**Returns:** `PublicKey`

**Example:**
```typescript
const pubkey = prism.getWalletPublicKey();
```

---

#### `getProgramId(): PublicKey`

Get the program ID.

**Returns:** `PublicKey`

**Example:**
```typescript
const programId = prism.getProgramId();
```

---

#### `getArciumStatus(): { initialized: boolean; mode: 'simulation' | 'live'; network: string }`

Get Arcium encryption status.

**Returns:**
```typescript
{
  initialized: boolean;
  mode: 'simulation' | 'live';
  network: string;
}
```

**Example:**
```typescript
const status = prism.getArciumStatus();
console.log(`Arcium mode: ${status.mode}`);
```

---

#### `getInfo(): { version: string; programId: string; network: string }`

Get SDK info.

**Returns:**
```typescript
{
  version: string;
  programId: string;
  network: string;
}
```

**Example:**
```typescript
const info = prism.getInfo();
console.log(`SDK version: ${info.version}`);
```

---

## Types

### PrismConfig

```typescript
interface PrismConfig {
  rpcUrl: string;
  programId?: PublicKey;
  commitment?: 'processed' | 'confirmed' | 'finalized';
}
```

### CreateContextOptions

```typescript
interface CreateContextOptions {
  type: ContextType;
  privacyLevel?: PrivacyLevel;
  maxPerTransaction?: bigint;
}
```

### CreateRootOptions

```typescript
interface CreateRootOptions {
  privacyLevel?: PrivacyLevel;
}
```

### CreateRootResult

```typescript
interface CreateRootResult {
  rootAddress: PublicKey;
  signature: string;
  privacyLevel: PrivacyLevel;
}
```

### CreateContextResult

```typescript
interface CreateContextResult {
  contextAddress: PublicKey;
  signature: string;
  contextType: ContextType;
  contextIndex: number;
  rootIdentityHash?: string;
  encryptionCommitment?: string;
}
```

### RevokeContextResult

```typescript
interface RevokeContextResult {
  signature: string;
  contextAddress: PublicKey;
  totalSpent: bigint;
}
```

### RootIdentity

```typescript
interface RootIdentity {
  owner: PublicKey;
  createdAt: number;
  privacyLevel: PrivacyLevel;
  contextCount: number;
  bump: number;
}
```

### ContextIdentity

```typescript
interface ContextIdentity {
  rootIdentity: PublicKey;
  contextType: ContextType;
  createdAt: number;
  maxPerTransaction: bigint;
  totalSpent: bigint;
  revoked: boolean;
  contextIndex: number;
  bump: number;
}
```

### SolvencyProof

```typescript
interface SolvencyProof {
  proof: Uint8Array;
  publicInputs: {
    threshold: bigint;
    isSolvent: boolean;
  };
  timestamp: number;
  contextAddress?: PublicKey;
}
```

### EncryptedBalance

```typescript
interface EncryptedBalance {
  encryptedValue: Uint8Array;
  commitment: string;
  contextPubkey: string;
  timestamp: number;
  mxeAddress?: string;
}
```

---

## Enums

### ContextType

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

### PrivacyLevel

```typescript
enum PrivacyLevel {
  Maximum = 0,   // Full anonymity
  High = 1,      // Minimal disclosure
  Medium = 2,    // Balanced
  Low = 3,       // More transparent
  Public = 4     // Fully public
}
```

---

## Error Handling

All methods may throw errors. Common error types:

- **Network errors**: RPC connection failures
- **Validation errors**: Invalid parameters
- **Proof errors**: Proof generation/verification failures
- **Transaction errors**: Solana transaction failures

**Example:**
```typescript
try {
  const proof = await prism.generateSolvencyProof({
    actualBalance: 100n,
    threshold: 1000n // Balance too low!
  });
} catch (error) {
  if (error.message.includes('does not meet threshold')) {
    console.error('Insufficient balance for proof');
  }
}
```

---

## Best Practices

1. **Always initialize**: Call `initialize()` or let methods call it automatically
2. **Handle errors**: Wrap SDK calls in try-catch blocks
3. **Revoke contexts**: Clean up contexts after use for privacy
4. **Use encrypted contexts**: For maximum privacy, use `createContextEncrypted()`
5. **Check proofs**: Always verify proofs before trusting them

---

**See also:**
- [EXAMPLES.md](./EXAMPLES.md) - Use case examples
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - Common issues
- [README.md](./README.md) - Getting started guide
