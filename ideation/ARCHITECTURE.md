# Technical Architecture

## Overview

Prism Protocol is a six-layer architecture that provides privacy-preserving identity infrastructure on Solana with cross-chain composability.

```
┌──────────────────────────────────────────────────┐
│  Layer 6: User Interface                         │
│  - User Dashboard (Context Management)           │
│  - Developer Console (Integration Hub)           │
│  - Pre-built Components                          │
└───────────────────┬──────────────────────────────┘
                    │
┌───────────────────┴──────────────────────────────┐
│  Layer 5: Developer SDK                          │
│  - TypeScript SDK                                │
│  - React Hooks                                   │
│  - Privacy Utilities                             │
└───────────────────┬──────────────────────────────┘
                    │
┌───────────────────┴──────────────────────────────┐
│  Layer 4: Network Privacy                        │
│  - Anti-Timing RPC Proxy                         │
│  - Request Batching                              │
│  - Onion Routing                                 │
└───────────────────┬──────────────────────────────┘
                    │
┌───────────────────┴──────────────────────────────┐
│  Layer 3: Cross-Chain Bridge                     │
│  - Wormhole Messaging                            │
│  - Encrypted State Channels                      │
│  - Verifier Contracts (EVM)                      │
└───────────────────┬──────────────────────────────┘
                    │
┌───────────────────┴──────────────────────────────┐
│  Layer 2: ZK Proof System                        │
│  - Light Protocol                                │
│  - Circom Circuits                               │
│  - Adaptive Proof Generation                     │
└───────────────────┬──────────────────────────────┘
                    │
┌───────────────────┴──────────────────────────────┐
│  Layer 1: Solana On-Chain                        │
│  - Anchor Programs (Rust)                        │
│  - Root Identity + Contexts                      │
│  - Arcium MPC Encryption                         │
└──────────────────────────────────────────────────┘
```

---

## Layer 1: Solana On-Chain

### Core Smart Contracts (Anchor/Rust)

#### 1. Root Identity Program

```rust
// Root soulbound identity (one per user)
#[account]
pub struct RootIdentity {
    pub owner: Pubkey,                    // User's wallet
    pub created_at: i64,                  // Unix timestamp
    pub authority: Pubkey,                // Control authority
    pub is_soulbound: bool,               // Always true
    pub privacy_settings: PrivacySettings,
    pub context_count: u16,               // How many contexts created
}

#[account]
pub struct PrivacySettings {
    pub default_level: PrivacyLevel,
    pub auto_burn_threshold: u8,          // Risk score to auto-burn
    pub require_approval: bool,           // Manual approval for proofs
    pub allow_cross_chain: bool,          // Cross-chain attestations
}

pub enum PrivacyLevel {
    Maximum,        // ZK-only, no data shared
    High,           // Minimal selective disclosure
    Medium,         // Balanced privacy/convenience
    Low,            // Most data shareable
    Public,         // Flex mode, show everything
}
```

#### 2. Contextual Identity Program

```rust
// Derived contexts for different use cases
#[account]
pub struct ContextualIdentity {
    pub root_identity: Pubkey,            // Link to root (hidden)
    pub context_id: [u8; 32],             // Unique context identifier
    pub context_type: ContextType,        // DeFi, Social, Gaming, etc.
    pub derived_address: Pubkey,          // The actual wallet for this context
    pub privacy_level: PrivacyLevel,      // Privacy setting for this context
    pub created_at: i64,
    pub last_used: i64,
    pub expires_at: Option<i64>,          // Optional expiration
    pub spending_limits: SpendingLimits,
    pub revoked: bool,
}

pub enum ContextType {
    DeFi,
    Social,
    Gaming,
    Professional,
    Research,
    Governance,
    Temporary,          // Auto-burn after use
    Public,             // Flex mode
}

#[account]
pub struct SpendingLimits {
    pub max_per_transaction: u64,
    pub max_per_day: u64,
    pub max_total: u64,
    pub allowed_programs: Vec<Pubkey>,    // Whitelist
}
```

#### 3. Credential Registry

```rust
// Verifiable credentials attached to identities
#[account]
pub struct Credential {
    pub holder: Pubkey,                   // Root identity
    pub issuer: Pubkey,                   // Who issued
    pub credential_type: CredentialType,
    pub encrypted_data: [u8; 64],         // Arcium encrypted
    pub zk_proof: [u8; 32],               // Proof of validity
    pub issued_at: i64,
    pub expires_at: Option<i64>,
    pub revoked: bool,
}

pub enum CredentialType {
    Age,
    KYC,
    Reputation,
    Solvency,
    Membership,
    Achievement,
    Custom([u8; 32]),
}
```

#### 4. Prism Name Service (PNS)

```rust
// Universal name registry
#[account]
pub struct PrismName {
    pub name: String,                     // "alice.prism"
    pub root_identity: Pubkey,            // Owner
    pub registered_at: i64,
    pub expires_at: i64,
    pub context_mappings: Vec<ContextMapping>,
    pub linked_names: Vec<LinkedName>,    // gerry.sol, gerry.eth
}

#[account]
pub struct ContextMapping {
    pub context_type: ContextType,
    pub chain: Chain,
    pub address: Pubkey,                  // Resolved address
    pub visibility: Visibility,
}

pub enum Visibility {
    Public,             // Anyone can resolve
    Gated,              // Only with proof
    Private,            // Only owner
}

pub enum Chain {
    Solana,
    Ethereum,
    Polygon,
    Base,
    Arbitrum,
}
```

### Key Instructions

```rust
// Core identity operations
pub fn create_root_identity(ctx: Context<CreateRoot>) -> Result<()>
pub fn create_context(ctx: Context<CreateContext>, context_type: ContextType) -> Result<()>
pub fn revoke_context(ctx: Context<RevokeContext>) -> Result<()>
pub fn update_privacy_settings(ctx: Context<UpdatePrivacy>, settings: PrivacySettings) -> Result<()>

// Credential operations
pub fn issue_credential(ctx: Context<IssueCredential>, data: CredentialData) -> Result<()>
pub fn verify_credential(ctx: Context<VerifyCredential>, proof: [u8; 32]) -> Result<bool>
pub fn revoke_credential(ctx: Context<RevokeCredential>) -> Result<()>

// Name service operations
pub fn register_name(ctx: Context<RegisterName>, name: String) -> Result<()>
pub fn update_name_mapping(ctx: Context<UpdateMapping>, mapping: ContextMapping) -> Result<()>
pub fn link_external_name(ctx: Context<LinkName>, external: LinkedName) -> Result<()>

// Security operations
pub fn emergency_burn(ctx: Context<EmergencyBurn>, context_id: [u8; 32]) -> Result<()>
pub fn set_spending_limits(ctx: Context<SetLimits>, limits: SpendingLimits) -> Result<()>
```

### PDA Derivation

```rust
// Root identity PDA
let (root_pda, root_bump) = Pubkey::find_program_address(
    &[b"root", user_wallet.key().as_ref()],
    program_id
);

// Context PDA (derived from root + context_type)
let (context_pda, context_bump) = Pubkey::find_program_address(
    &[b"context", root_pda.as_ref(), context_type.as_bytes()],
    program_id
);

// Credential PDA
let (credential_pda, cred_bump) = Pubkey::find_program_address(
    &[b"credential", holder.as_ref(), credential_type.as_bytes()],
    program_id
);

// Name PDA
let (name_pda, name_bump) = Pubkey::find_program_address(
    &[b"name", name.as_bytes()],
    program_id
);
```

---

## Layer 2: ZK Proof System

### Light Protocol Integration

Using Light Protocol for ZK compression and efficient proofs on Solana.

#### Proof Circuits

**1. Age Threshold Circuit**
```circom
template AgeThreshold() {
    signal input birthdate;      // Private input
    signal input currentDate;    // Public input
    signal input threshold;      // Public (e.g., 21 years)
    
    signal output isOver;        // Public output (1 or 0)
    
    component age = CalculateAge();
    age.birthdate <== birthdate;
    age.currentDate <== currentDate;
    
    component compare = GreaterThan(8);
    compare.in[0] <== age.years;
    compare.in[1] <== threshold;
    
    isOver <== compare.out;
}
```

**2. Balance Solvency Circuit**
```circom
template BalanceSolvency() {
    signal input balance;        // Private input
    signal input threshold;      // Public input
    
    signal output isSolvent;     // Public output
    
    component compare = GreaterEqualThan(64);
    compare.in[0] <== balance;
    compare.in[1] <== threshold;
    
    isSolvent <== compare.out;
}
```

**3. Reputation Threshold Circuit**
```circom
template ReputationProof() {
    signal input score;          // Private reputation score
    signal input threshold;      // Public minimum
    signal input merkleProof[8]; // Proof of score validity
    signal input merkleRoot;     // Public root
    
    signal output meetsThreshold;
    
    // Verify merkle proof
    component merkleVerifier = MerkleTreeVerifier(8);
    merkleVerifier.leaf <== score;
    for (var i = 0; i < 8; i++) {
        merkleVerifier.proof[i] <== merkleProof[i];
    }
    merkleVerifier.root <== merkleRoot;
    
    // Check threshold
    component compare = GreaterEqualThan(32);
    compare.in[0] <== score;
    compare.in[1] <== threshold;
    
    meetsThreshold <== compare.out * merkleVerifier.isValid;
}
```

**4. Context Ownership Circuit (Recursive SNARK)**
```circom
template ContextOwnership() {
    signal input rootIdentity;       // Private root
    signal input contextAddress;     // Public context
    signal input derivationPath;     // Private path
    signal input previousProof;      // Recursive proof
    
    signal output isOwned;
    
    // Verify derivation
    component derive = DeriveContext();
    derive.root <== rootIdentity;
    derive.path <== derivationPath;
    
    component equals = IsEqual();
    equals.in[0] <== derive.derived;
    equals.in[1] <== contextAddress;
    
    // Verify previous proof (recursive)
    component verifier = Groth16Verifier();
    verifier.proof <== previousProof;
    
    isOwned <== equals.out * verifier.isValid;
}
```

### Adaptive Proof Generation

```typescript
// SDK function for adaptive proofs
async function generateAdaptiveProof(
  requirement: ProofRequirement,
  trustLevel: TrustLevel
): Promise<ZKProof> {
  
  const circuit = selectCircuit(requirement.type);
  
  // Adjust disclosure based on trust level
  const disclosure = {
    HIGH_TRUST: 'exact',      // Share exact value
    MEDIUM_TRUST: 'range',    // Share range (25-35)
    LOW_TRUST: 'threshold',   // Just prove >= threshold
    ZERO_TRUST: 'boolean'     // Only yes/no
  }[trustLevel];
  
  return await circuit.prove({
    privateInputs: getPrivateData(requirement),
    publicInputs: getPublicParams(requirement, disclosure),
    provingKey: await loadProvingKey(circuit)
  });
}
```

---

## Layer 3: Cross-Chain Bridge

### Wormhole Integration

#### Attestation Message Format

```typescript
interface PrismAttestation {
  version: number;
  rootIdentity: Pubkey;         // Solana root (hashed)
  contextType: ContextType;
  chain: Chain;
  zkProof: Buffer;              // ZK proof of credential
  timestamp: number;
  nonce: number;
  signature: Buffer;            // Wormhole guardian signatures
}
```

#### Cross-Chain Flow

```
┌────────────────────────────────────────┐
│ Solana (Source of Truth)               │
│ 1. User generates ZK proof             │
│ 2. Proof + metadata packaged           │
│ 3. Sent to Wormhole contract           │
└──────────────┬─────────────────────────┘
               │
         ┌─────▼──────┐
         │  Wormhole  │
         │  Guardians │
         │  Sign VAA  │
         └─────┬──────┘
               │
    ┌──────────┴──────────┐
    │                     │
    ▼                     ▼
┌─────────────┐    ┌─────────────┐
│  Ethereum   │    │   Polygon   │
│  Verifier   │    │   Verifier  │
│  Contract   │    │   Contract  │
└─────────────┘    └─────────────┘
```

#### EVM Verifier Contract

```solidity
// Ethereum/EVM verifier contract
contract PrismVerifier {
    // Wormhole core contract
    IWormhole public wormhole;
    
    // Cache of verified attestations
    mapping(bytes32 => Attestation) public attestations;
    
    struct Attestation {
        bytes32 solanaIdentity;      // Hashed Solana root
        CredentialType credType;
        uint256 timestamp;
        bool revoked;
    }
    
    // Verify Wormhole VAA and cache attestation
    function verifyAttestation(
        bytes memory encodedVAA
    ) external {
        // Parse and verify Wormhole VAA
        (IWormhole.VM memory vm, bool valid, string memory reason) = 
            wormhole.parseAndVerifyVM(encodedVAA);
        
        require(valid, reason);
        
        // Decode Prism attestation
        PrismAttestation memory attest = abi.decode(
            vm.payload,
            (PrismAttestation)
        );
        
        // Verify ZK proof
        require(
            verifyZKProof(attest.zkProof, attest.credentialType),
            "Invalid ZK proof"
        );
        
        // Cache attestation
        bytes32 attestId = keccak256(abi.encodePacked(
            attest.rootIdentity,
            attest.contextType
        ));
        
        attestations[attestId] = Attestation({
            solanaIdentity: attest.rootIdentity,
            credType: attest.credentialType,
            timestamp: attest.timestamp,
            revoked: false
        });
    }
    
    // Check if credential is valid
    function checkCredential(
        bytes32 solanaIdentity,
        CredentialType credType
    ) external view returns (bool) {
        bytes32 attestId = keccak256(abi.encodePacked(
            solanaIdentity,
            credType
        ));
        
        Attestation memory attest = attestations[attestId];
        
        return !attest.revoked && 
               attest.timestamp > 0 &&
               attest.timestamp + 30 days > block.timestamp;
    }
}
```

---

## Layer 4: Network Privacy (Anti-Timing RPC)

### RPC Timing Attack Mitigation

Current attack: Observers correlate RPC request timestamps with on-chain transaction times to deanonymize wallets (95% success rate).

#### Prism RPC Proxy Architecture

```
User Request
    ↓
┌─────────────────────────────────────┐
│ Prism RPC Proxy                     │
│ 1. Add random jitter (50-500ms)     │
│ 2. Batch with decoy requests        │
│ 3. Split across multiple RPC nodes  │
│ 4. Onion routing for IP privacy     │
└────────┬────────────────────────────┘
         │
    ┌────┴────┬────────┬────────┐
    ▼         ▼        ▼        ▼
  Triton   Helius  QuickNode  Public
```

#### Implementation

```typescript
class PrismRPC {
  private endpoints: string[];
  private decoyGenerator: DecoyGenerator;
  
  async getBalance(
    address: PublicKey,
    options?: PrivacyOptions
  ): Promise<number> {
    
    // Add timing jitter
    const jitter = Math.random() * (options?.maxJitter || 500);
    await sleep(jitter);
    
    // Generate decoy requests
    const decoys = this.decoyGenerator.generateDecoys(3);
    
    // Batch real + decoy requests
    const requests = [
      { method: 'getBalance', params: [address] },
      ...decoys
    ];
    
    // Split across multiple RPCs
    const responses = await Promise.all(
      requests.map((req, i) => 
        this.sendToRPC(this.endpoints[i % this.endpoints.length], req)
      )
    );
    
    // Extract real response
    return responses[0].value;
  }
  
  private async sendToRPC(endpoint: string, request: any) {
    // Onion routing for IP privacy (optional)
    if (this.options.useOnionRouting) {
      return await this.sendViaOnion(endpoint, request);
    }
    
    return await fetch(endpoint, {
      method: 'POST',
      body: JSON.stringify(request)
    });
  }
}

class DecoyGenerator {
  generateDecoys(count: number): Request[] {
    // Generate realistic-looking decoy requests
    return Array(count).fill(null).map(() => ({
      method: this.randomMethod(),
      params: this.randomParams()
    }));
  }
  
  private randomMethod(): string {
    const methods = [
      'getBalance',
      'getAccountInfo',
      'getTransaction',
      'getRecentBlockhash'
    ];
    return methods[Math.floor(Math.random() * methods.length)];
  }
}
```

---

## Layer 5: Developer SDK

### TypeScript SDK Structure

```
@prism-protocol/sdk/
├── core/
│   ├── Identity.ts           # Root identity management
│   ├── Context.ts            # Context creation/management
│   ├── Credential.ts         # Credential operations
│   └── PrismName.ts          # Name service
├── privacy/
│   ├── ZKProofs.ts           # Proof generation
│   ├── Encryption.ts         # Arcium integration
│   └── PrivacyScore.ts       # Privacy calculation
├── crosschain/
│   ├── Wormhole.ts           # Cross-chain attestations
│   └── Resolver.ts           # Multi-chain resolution
├── security/
│   ├── AntiDrain.ts          # Wallet protection
│   ├── TransactionSim.ts    # Transaction simulation
│   └── SpendingLimits.ts    # Limit enforcement
├── network/
│   ├── PrismRPC.ts           # Anti-timing RPC
│   └── OnionRouter.ts        # IP privacy
└── react/
    ├── hooks.ts              # React hooks
    └── components/           # Pre-built components
        ├── PrismConnect.tsx
        ├── ContextSelector.tsx
        └── ProofRequest.tsx
```

### Core SDK API

```typescript
// Initialize Prism
import { PrismProtocol } from '@prism-protocol/sdk';

const prism = new PrismProtocol({
  connection: solanaConnection,
  wallet: userWallet,
  network: 'mainnet',
  privacy: {
    useAntiTimingRPC: true,
    defaultPrivacyLevel: PrivacyLevel.High
  }
});

// Create root identity
await prism.createRootIdentity();

// Create context
const defiContext = await prism.createContext({
  type: ContextType.DeFi,
  privacyLevel: PrivacyLevel.High,
  limits: {
    maxPerTransaction: lamports(1),
    maxPerDay: lamports(10)
  }
});

// Generate ZK proof
const proof = await prism.generateProof({
  type: ProofType.AGE_THRESHOLD,
  privateInputs: { birthdate: '1990-01-01' },
  publicInputs: { threshold: 21 }
});

// Verify proof
const isValid = await prism.verifyProof(proof);

// Register name
await prism.registerName('alice.prism', {
  defaultContext: defiContext,
  crossChain: {
    ethereum: '0x...',
    polygon: '0x...'
  }
});

// Cross-chain attestation
await prism.createCrossChainAttestation({
  targetChain: Chain.Ethereum,
  credential: CredentialType.Age,
  context: defiContext
});
```

### React Hooks

```typescript
// useprism hook
import { usePrism } from '@prism-protocol/react';

function MyApp() {
  const {
    identity,
    contexts,
    createContext,
    generateProof,
    privacyScore
  } = usePrism();
  
  return (
    <div>
      <h1>Privacy Score: {privacyScore}/100</h1>
      <button onClick={() => createContext(ContextType.DeFi)}>
        Create DeFi Context
      </button>
    </div>
  );
}

// Pre-built components
import { PrismConnect, ProofRequest } from '@prism-protocol/react';

<PrismConnect
  contextType="defi"
  onConnect={handleConnect}
/>

<ProofRequest
  requirement={{ type: 'age_verification', minAge: 21 }}
  onProofGenerated={handleProof}
>
  <button>Verify Age</button>
</ProofRequest>
```

---

## Layer 6: User Interface

### User Dashboard

```
┌──────────────────────────────────────────────┐
│ Prism Identity Manager                       │
├──────────────────────────────────────────────┤
│ Root Identity: alice.prism                   │
│ Privacy Score: 87/100 ✅                     │
│                                              │
│ Contexts:                                    │
│ ┌─────────────────────────────────────────┐ │
│ │ 💰 DeFi Context                          │ │
│ │    Privacy: ████████░░ 80%               │ │
│ │    Connected: 3 apps                     │ │
│ │    [Manage] [Revoke All]                 │ │
│ └─────────────────────────────────────────┘ │
│                                              │
│ [+ Create Context] [Privacy Settings]       │
└──────────────────────────────────────────────┘
```

### Developer Console

```
┌──────────────────────────────────────────────┐
│ Prism Developer Console                      │
├──────────────────────────────────────────────┤
│ Project: My dApp                             │
│                                              │
│ Integration Stats:                           │
│ - 1,247 users connected                      │
│ - 8,934 proofs generated                     │
│ - 99.7% success rate                         │
│                                              │
│ [View Docs] [Test Playground] [Analytics]   │
└──────────────────────────────────────────────┘
```

---

## Security Considerations

### Threat Model

1. **RPC Timing Attacks** → Mitigated by anti-timing RPC proxy
2. **Wallet Draining** → Mitigated by disposable contexts + limits
3. **Cross-Chain Metadata Leaks** → Mitigated by ZK attestations
4. **Context Linking** → Mitigated by separate keys + ZK proofs
5. **ZK Proof Forgery** → Mitigated by Groth16 verification on-chain

### Audit Requirements

- [ ] Smart contract audit (Anchor programs)
- [ ] ZK circuit audit (Circom circuits)
- [ ] Cryptographic review (Arcium integration)
- [ ] Cross-chain security audit (Wormhole integration)
- [ ] SDK security review

---

## Performance Metrics

### Target Performance
- Root identity creation: <3s
- Context derivation: <1s
- ZK proof generation: <2s
- ZK proof verification: <100ms on-chain
- Cross-chain attestation: <30s (Wormhole finality)
- Privacy score calculation: <500ms
- Name resolution: <100ms

### Scalability
- Contexts per user: Unlimited (PDA derivation)
- Credentials per identity: 100+
- Names per user: 1 primary, unlimited aliases
- Cross-chain support: All EVM chains + Solana

---

## Future Enhancements

### Phase 2 (Post-Hackathon)
- [ ] Mobile SDK (React Native)
- [ ] Hardware wallet integration
- [ ] Biometric authentication
- [ ] Social recovery mechanisms
- [ ] Advanced ZK circuits (zk-rollups)

### Phase 3 (Production)
- [ ] Decentralized RPC network
- [ ] Reputation marketplace
- [ ] Identity insurance
- [ ] Compliance toolkit
- [ ] Developer grants program

---

## Technology Dependencies

### Required
- Solana (mainnet/devnet)
- Anchor Framework v0.30+
- Light Protocol SDK
- Arcium MPC Network
- Wormhole Bridge
- Circom v2.1+

### Optional
- Metaplex (for NFT credentials)
- Dialect (for notifications)
- Civic Pass (for KYC integration)
- zkMe (for additional KYC)

---

This architecture provides the foundation for privacy-preserving identity on Solana while remaining composable with the broader Web3 ecosystem.
