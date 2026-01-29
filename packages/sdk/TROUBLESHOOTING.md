# Prism Protocol SDK - Troubleshooting Guide

Common issues and their solutions.

## Table of Contents

- [Initialization Issues](#initialization-issues)
- [Proof Generation Issues](#proof-generation-issues)
- [Context Management Issues](#context-management-issues)
- [Network Issues](#network-issues)
- [Arcium Encryption Issues](#arcium-encryption-issues)
- [Circuit Issues](#circuit-issues)
- [General Issues](#general-issues)

---

## Initialization Issues

### "Program not initialized"

**Error:**
```
Error: Program not initialized
```

**Solution:**
Make sure to call `initialize()` before using the SDK:

```typescript
const prism = new PrismProtocol({ rpcUrl, wallet });
await prism.initialize(); // Don't forget this!
```

**Note:** Most methods will automatically initialize if not already done, but it's best practice to call it explicitly.

---

### "Failed to initialize PrismProtocol"

**Error:**
```
Error: Failed to initialize PrismProtocol: ...
```

**Possible Causes:**
1. Invalid RPC URL
2. Network connectivity issues
3. Invalid wallet object

**Solutions:**

1. **Check RPC URL:**
```typescript
// Test your RPC endpoint
const connection = new Connection('https://api.devnet.solana.com');
const version = await connection.getVersion();
console.log('RPC working:', version);
```

2. **Verify wallet object:**
```typescript
// Ensure wallet implements the Wallet interface
const wallet = {
  publicKey: keypair.publicKey,
  signTransaction: async (tx) => {
    tx.sign(keypair);
    return tx;
  },
  signAllTransactions: async (txs) => {
    txs.forEach(tx => tx.sign(keypair));
    return txs;
  }
};
```

3. **Check network connectivity:**
```typescript
// Test connection
try {
  const blockHeight = await connection.getBlockHeight();
  console.log('Connected! Block height:', blockHeight);
} catch (error) {
  console.error('Connection failed:', error);
}
```

---

## Proof Generation Issues

### "Balance does not meet threshold - proof would fail"

**Error:**
```
Error: Balance does not meet threshold - proof would fail
```

**Cause:** You're trying to prove that `actualBalance >= threshold`, but your balance is less than the threshold.

**Solution:**
Ensure your balance meets the threshold:

```typescript
const actualBalance = 500000000000n; // 500 SOL
const threshold = 10000000000n;        // 10 SOL

if (actualBalance < threshold) {
  console.error('Insufficient balance for proof');
  return;
}

const proof = await prism.generateSolvencyProof({
  actualBalance,
  threshold
});
```

---

### "Circuit not found" or "Circuit bytecode not found"

**Error:**
```
Error: Circuit artifact not found. Run `nargo compile` first.
```

**Cause:** The Noir circuit hasn't been compiled or the artifact isn't accessible.

**Solutions:**

1. **For development (browser/Next.js):**
   - Ensure `circuits/solvency_proof.json` exists in your `public/` folder
   - Or ensure the circuit is bundled with your build

2. **For Node.js:**
   - Run `nargo compile` in the `circuits/solvency_proof/` directory
   - Ensure the compiled JSON is at the expected path

3. **Fallback to simulation mode:**
   The SDK will automatically fall back to simulation mode if the circuit isn't available. This is fine for development but not for production.

---

### "Noir or backend not initialized"

**Error:**
```
Error: Noir or backend not initialized
```

**Cause:** The ZK proof backend failed to initialize (usually WASM-related).

**Solutions:**

1. **Browser environment:**
   - Ensure you're running in a browser (not Node.js)
   - Check browser console for WASM loading errors
   - Try a different browser (Chrome/Firefox recommended)

2. **Server-side:**
   - The SDK automatically uses simulation mode on the server
   - This is expected behavior - proofs will be simulated

3. **Check dependencies:**
```bash
npm install @noir-lang/noir_js @aztec/bb.js
```

---

## Context Management Issues

### "Root identity already exists"

**Message:**
```
Root identity already exists
```

**Note:** This is **not an error** - it's informational. The SDK will return the existing root identity.

**If you want to check first:**
```typescript
const exists = await prism.hasRootIdentity();
if (exists) {
  const root = await prism.getRootIdentity();
  console.log('Using existing root:', root.rootAddress.toBase58());
} else {
  const root = await prism.createRootIdentity();
  console.log('Created new root:', root.rootAddress.toBase58());
}
```

---

### "Context already exists at this index"

**Error:**
```
Error: Context already exists at this index
```

**Cause:** You're trying to create a context at an index that already has a context.

**Solutions:**

1. **Use the next available index:**
```typescript
const root = await prism.getRootIdentity();
const nextIndex = root.contextCount;
// The SDK handles this automatically, but you can check first
```

2. **Revoke the existing context first:**
```typescript
await prism.revokeContextByIndex(existingIndex);
// Then create new context
const context = await prism.createContext({ ... });
```

3. **Check existing contexts:**
```typescript
const contexts = await prism.getContexts();
console.log('Existing contexts:', contexts.length);
```

---

### "Context was already revoked"

**Message:**
```
Context was already revoked
```

**Note:** This is **not an error** - the SDK returns `{ signature: 'already_revoked', ... }` without creating a new transaction.

**If you want to check first:**
```typescript
const contexts = await prism.getContexts();
const context = contexts.find(c => c.contextIndex === index);
if (context && context.revoked) {
  console.log('Context already revoked');
} else {
  await prism.revokeContextByIndex(index);
}
```

---

### "Failed to fetch root identity after creation"

**Error:**
```
Error: Failed to fetch root identity after creation
```

**Cause:** The transaction was confirmed but the account isn't available yet (timing issue).

**Solution:**
The SDK includes automatic retries, but if this persists:

```typescript
// Wait a bit longer
await new Promise(resolve => setTimeout(resolve, 2000));

// Try again
let root = await prism.getRootIdentity();
let retries = 0;
while (!root && retries < 5) {
  await new Promise(resolve => setTimeout(resolve, 1000));
  root = await prism.getRootIdentity();
  retries++;
}
```

---

## Network Issues

### "Transaction failed" or "Transaction simulation failed"

**Error:**
```
Error: Transaction simulation failed
```

**Possible Causes:**
1. Insufficient SOL for transaction fees
2. Network congestion
3. Invalid transaction parameters

**Solutions:**

1. **Check balance:**
```typescript
const balance = await connection.getBalance(wallet.publicKey);
console.log('Balance:', balance / 1e9, 'SOL');
// Need at least 0.001 SOL for fees
```

2. **Retry with higher commitment:**
```typescript
const prism = new PrismProtocol({
  rpcUrl,
  wallet,
  commitment: 'finalized' // Wait for finality
});
```

3. **Check transaction logs:**
```typescript
try {
  const result = await prism.createContext({ ... });
} catch (error) {
  console.error('Transaction error:', error);
  // Check error.logs for details
  if (error.logs) {
    console.error('Transaction logs:', error.logs);
  }
}
```

---

### "RPC connection timeout"

**Error:**
```
Error: RPC connection timeout
```

**Solutions:**

1. **Use a different RPC endpoint:**
```typescript
// Try different RPC providers
const rpcUrls = [
  'https://api.devnet.solana.com',
  'https://api.mainnet-beta.solana.com',
  'https://your-custom-rpc.com'
];
```

2. **Increase timeout (if using custom connection):**
```typescript
const connection = new Connection(rpcUrl, {
  commitment: 'confirmed',
  httpHeaders: { /* ... */ },
  // Some RPC providers support timeout config
});
```

3. **Check network connectivity:**
```typescript
// Test connection
const version = await connection.getVersion();
```

---

## Arcium Encryption Issues

### "Arcium MPC not initialized"

**Error:**
```
Error: Arcium MPC not initialized. Call initialize() first.
```

**Solution:**
The SDK initializes Arcium automatically, but you can check status:

```typescript
const status = prism.getArciumStatus();
console.log('Arcium status:', status);

if (!status.initialized) {
  await prism.initialize();
}
```

---

### "Encryption failed" or "Balance encryption failed"

**Error:**
```
Error: Balance encryption failed: ...
```

**Solutions:**

1. **Check environment variables (for live mode):**
```bash
export ARCIUM_MXE_ADDRESS=your_mxe_address
export ARCIUM_CLUSTER_ID=your_cluster_id
```

2. **Use simulation mode (for development):**
   - If environment variables aren't set, the SDK automatically uses simulation mode
   - This is fine for development and demos

3. **Check Arcium status:**
```typescript
const status = prism.getArciumStatus();
if (status.mode === 'simulation') {
  console.log('Using simulation mode (no real MPC)');
}
```

---

### "MXE address not configured"

**Error:**
```
Error: MXE address not configured
```

**Solution:**
Set the Arcium environment variables:

```bash
# In your .env file or environment
ARCIUM_MXE_ADDRESS=your_mxe_address_here
ARCIUM_CLUSTER_ID=your_cluster_id_here
```

Or in code (not recommended for production):
```typescript
process.env.ARCIUM_MXE_ADDRESS = 'your_mxe_address';
process.env.ARCIUM_CLUSTER_ID = 'your_cluster_id';
```

---

## Circuit Issues

### "Circuit bytecode not found" in browser

**Error:**
```
Error: Circuit not available in browser - using simulation mode
```

**Solution:**
Ensure the circuit JSON is accessible:

1. **For Next.js:**
   - Place `solvency_proof.json` in `public/circuits/`
   - Access via `/circuits/solvency_proof.json`

2. **For Create React App:**
   - Place in `public/circuits/`
   - Access via `/circuits/solvency_proof.json`

3. **For Vite:**
   - Place in `public/circuits/`
   - Or import directly (may need webpack config)

---

### "WASM backend not available"

**Message:**
```
SolvencyProver: Using simulation mode (WASM backend not available)
```

**Note:** This is **not an error** - the SDK falls back to simulation mode automatically.

**If you need real proofs:**

1. **Ensure you're in a browser environment** (WASM requires browser APIs)
2. **Check browser compatibility** (Chrome/Firefox/Safari modern versions)
3. **Check dependencies:**
```bash
npm install @aztec/bb.js @noir-lang/noir_js
```

---

## General Issues

### TypeScript errors

**Error:**
```
Cannot find module '@prism-protocol/sdk'
```

**Solution:**
1. **Install the package:**
```bash
npm install @prism-protocol/sdk
```

2. **Check TypeScript config:**
```json
{
  "compilerOptions": {
    "moduleResolution": "node",
    "esModuleInterop": true
  }
}
```

---

### "Cannot read property 'publicKey' of undefined"

**Error:**
```
TypeError: Cannot read property 'publicKey' of undefined
```

**Cause:** Wallet object is not properly initialized.

**Solution:**
Ensure wallet is properly set up:

```typescript
// For @solana/wallet-adapter
import { useWallet } from '@solana/wallet-adapter-react';

const { wallet } = useWallet();
if (!wallet?.adapter) {
  return <div>Please connect wallet</div>;
}

const prism = new PrismProtocol({
  rpcUrl,
  wallet: wallet.adapter
});
```

---

### Performance issues

**Issue:** Proof generation is slow.

**Solutions:**

1. **Use simulation mode for development:**
   - Real ZK proofs take time (this is expected)
   - Simulation mode is faster for testing

2. **Cache proofs when possible:**
```typescript
// Proofs are deterministic for same inputs
const proofCache = new Map();

async function getCachedProof(balance, threshold) {
  const key = `${balance}-${threshold}`;
  if (proofCache.has(key)) {
    return proofCache.get(key);
  }
  const proof = await prism.generateSolvencyProof({ actualBalance: balance, threshold });
  proofCache.set(key, proof);
  return proof;
}
```

---

## Getting Help

If you're still experiencing issues:

1. **Check the logs:** The SDK logs helpful information to the console
2. **Review examples:** See [EXAMPLES.md](./EXAMPLES.md) for working code
3. **Check API docs:** See [API.md](./API.md) for method details
4. **Open an issue:** Include:
   - Error message
   - Code snippet
   - Environment (browser/Node.js, network)
   - SDK version

---

**See also:**
- [README.md](./README.md) - Getting started
- [EXAMPLES.md](./EXAMPLES.md) - Use case examples
- [API.md](./API.md) - Complete API reference
