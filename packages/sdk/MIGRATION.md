# Prism Protocol SDK - Migration Guide

This guide helps you migrate between versions of the Prism Protocol SDK.

## Table of Contents

- [Version 0.1.0 → 0.2.0 (Upcoming)](#version-010--020-upcoming)
- [Breaking Changes](#breaking-changes)
- [Deprecations](#deprecations)
- [Migration Checklist](#migration-checklist)

---

## Version 0.1.0 → 0.2.0 (Upcoming)

### Expected Changes

**Note:** Version 0.2.0 is not yet released. This section documents expected changes.

#### 1. Enhanced Error Handling

**Before (0.1.0):**
```typescript
try {
  const proof = await prism.generateSolvencyProof({ ... });
} catch (error) {
  console.error(error.message); // Generic error
}
```

**After (0.2.0):**
```typescript
import { PrismError, PrismProofError } from '@prism-protocol/sdk';

try {
  const proof = await prism.generateSolvencyProof({ ... });
} catch (error) {
  if (error instanceof PrismProofError) {
    console.error('Proof error:', error.code, error.message);
    console.error('Context:', error.context);
  }
}
```

**Migration:**
- Import error classes from the SDK
- Use `instanceof` checks for specific error types
- Access `error.code` and `error.context` for detailed information

---

#### 2. React Hooks (New)

**New in 0.2.0:**
```typescript
import { usePrism, useProof } from '@prism-protocol/sdk/react';

function MyComponent() {
  const { prism, identity, createContext, isLoading, error } = usePrism();
  const { generateProof, proof, isGenerating } = useProof();
  
  // Use hooks instead of direct SDK calls
}
```

**Migration:**
- If using React, migrate to hooks for better integration
- Direct SDK usage still works (no breaking change)

---

#### 3. Configuration Changes

**Before (0.1.0):**
```typescript
const prism = new PrismProtocol({
  rpcUrl: 'https://api.devnet.solana.com',
  wallet: yourWallet
});
```

**After (0.2.0):**
```typescript
const prism = new PrismProtocol({
  rpcUrl: 'https://api.devnet.solana.com',
  wallet: yourWallet,
  // New optional config
  debug: false, // Enable debug logging
  retryConfig: {
    maxRetries: 3,
    retryDelay: 1000
  }
});
```

**Migration:**
- New config options are optional (backward compatible)
- Add `debug: true` for development
- Configure retry behavior if needed

---

#### 4. Method Signature Updates

**Before (0.1.0):**
```typescript
const proof = await prism.generateSolvencyProof({
  actualBalance: 500n,
  threshold: 100n
});
```

**After (0.2.0):**
```typescript
// Same signature, but with validation
const proof = await prism.generateSolvencyProof({
  actualBalance: 500n,
  threshold: 100n
  // New optional: contextAddress for binding
  contextAddress: context.contextAddress // Optional
});
```

**Migration:**
- Existing code continues to work
- Add `contextAddress` for proof binding (optional)

---

## Breaking Changes

### Version 0.1.0

**No breaking changes** - This is the initial release.

---

### Future Versions

When breaking changes are introduced, they will be documented here with:
- **What changed:** Description of the change
- **Why:** Reason for the change
- **Migration path:** Step-by-step guide
- **Timeline:** When the change takes effect

---

## Deprecations

### Currently Deprecated

**None** - No methods are currently deprecated.

---

### Deprecation Policy

1. **Deprecation notice:** Methods will be marked as deprecated in JSDoc comments
2. **Deprecation period:** At least 2 minor versions before removal
3. **Migration guide:** Clear migration path provided
4. **Console warnings:** Deprecated methods log warnings in development

**Example of future deprecation:**
```typescript
/**
 * @deprecated Use createContextEncrypted() instead for better privacy
 * This method will be removed in v0.3.0
 */
async createContext(options: CreateContextOptions): Promise<CreateContextResult> {
  // ...
}
```

---

## Migration Checklist

When upgrading to a new version:

### Before Upgrading

- [ ] Read the changelog for the new version
- [ ] Review breaking changes (if any)
- [ ] Check deprecation warnings
- [ ] Backup your code
- [ ] Test in a development environment first

### During Migration

- [ ] Update package version:
  ```bash
  npm install @prism-protocol/sdk@latest
  ```

- [ ] Review your code for:
  - [ ] Deprecated method calls
  - [ ] Breaking API changes
  - [ ] New required parameters
  - [ ] Changed return types

- [ ] Update error handling:
  - [ ] Use new error classes if available
  - [ ] Update error message checks

- [ ] Test thoroughly:
  - [ ] Identity creation
  - [ ] Context management
  - [ ] Proof generation
  - [ ] Error scenarios

### After Migration

- [ ] Update documentation references
- [ ] Update tests
- [ ] Deploy to staging first
- [ ] Monitor for issues
- [ ] Update team documentation

---

## Version History

### 0.1.0 (Current)

**Initial Release**
- Core identity management
- Context creation and revocation
- ZK solvency proofs
- Arcium MPC encryption integration
- Basic error handling

**No breaking changes** - This is the first release.

---

## Getting Help

If you encounter issues during migration:

1. **Check the changelog:** See what changed in the new version
2. **Review examples:** See [EXAMPLES.md](./EXAMPLES.md) for updated code
3. **Check API docs:** See [API.md](./API.md) for current method signatures
4. **Open an issue:** Include:
   - Your current SDK version
   - Target version
   - Migration issue description
   - Code snippet

---

## Semantic Versioning

The Prism Protocol SDK follows [Semantic Versioning](https://semver.org/):

- **MAJOR** (1.0.0): Breaking changes
- **MINOR** (0.1.0): New features, backward compatible
- **PATCH** (0.0.1): Bug fixes, backward compatible

**Example:**
- `0.1.0 → 0.1.1`: Patch update (bug fixes only)
- `0.1.0 → 0.2.0`: Minor update (new features, no breaking changes)
- `0.1.0 → 1.0.0`: Major update (breaking changes)

---

## Compatibility Matrix

| SDK Version | Solana Web3.js | Anchor | Noir | Arcium |
|-------------|----------------|--------|------|--------|
| 0.1.0       | ^1.98.0        | ^0.31.1| 1.0.0-beta.18 | ^0.6.3 |

---

**See also:**
- [README.md](./README.md) - Getting started
- [CHANGELOG.md](../CHANGELOG.md) - Detailed version history
- [API.md](./API.md) - Current API reference
