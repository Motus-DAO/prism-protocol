# Changelog

All notable changes to the Prism Protocol SDK are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-01-29

### Added

- **PrismProtocol** – Main SDK class for identity, contexts, and proofs.
- **Identity management** – `createRootIdentity`, `getRootIdentity`, `hasRootIdentity`.
- **Context management** – `createContext`, `createContextEncrypted`, `getContexts`, `revokeContextByIndex` with `ContextType` (DeFi, Social, Gaming, Professional, Temporary, Public) and spending limits.
- **ZK solvency proofs** – `generateSolvencyProof`, `verifySolvencyProof` (Noir/Barretenberg).
- **Encrypted proofs** – `generateEncryptedSolvencyProof` (Arcium MPC + ZK).
- **Quick helpers** – `quickDarkPoolAccess`, `quickDarkPoolAccessEncrypted`.
- **Arcium integration** – Balance and data encryption with simulation and live MPC modes.
- **Errors** – `PrismError`, `PrismNetworkError`, `PrismValidationError`, `PrismProofError`.
- **Validation** – `validatePublicKey`, `validateLamports`, `validateContextType`, etc.
- **Logger** – Configurable logger and log levels.
- **Retry** – `retry`, `retryWithSimulation` for network/transaction retries.
- **Documentation** – README, API.md, EXAMPLES.md, TROUBLESHOOTING.md, MIGRATION.md.

### Requirements

- Node.js 18+
- Solana wallet (Anchor `Wallet` interface)
- Solana RPC (devnet or mainnet)

[0.1.0]: https://github.com/prism-protocol/prism-protocol/releases/tag/sdk-v0.1.0
