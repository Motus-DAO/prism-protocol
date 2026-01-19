# Hackathon Roadmap
## 7-Day Build Plan for Prism Protocol MVP

**Goal**: Ship working privacy infrastructure with 3 demos by Day 7  
**Strategy**: Build in layers, test continuously, polish on Day 7  

---

## Pre-Hackathon Setup (Day 0)

### Environment Setup
- [ ] Install Rust + Solana CLI
- [ ] Install Anchor CLI (v0.30+)
- [ ] Install Node.js 18+
- [ ] Install Circom compiler
- [ ] Set up Solana devnet wallet with SOL
- [ ] Get RPC endpoints (Triton, Helius)

### Project Initialization
```bash
# Create Anchor project
anchor init prism-protocol
cd prism-protocol

# Install dependencies
npm install @solana/web3.js @coral-xyz/anchor
npm install @lightprotocol/sdk @arcium-hq/client

# Create SDK package
mkdir packages/sdk
cd packages/sdk
npm init -y
```

### Repository Structure
```
prism-protocol/
├── programs/
│   ├── prism-identity/          # Root identity program
│   ├── prism-context/           # Context manager
│   └── prism-credential/        # Credential registry
├── packages/
│   └── sdk/                     # TypeScript SDK
├── app/                         # Next.js dashboard
├── demos/                       # Demo applications
├── circuits/                    # ZK circuits
└── tests/                       # Integration tests
```

---

## Day 1: Foundation (8 hours)

### Morning (4 hours): Smart Contract Core

#### 1.1 Root Identity Program (2 hours)
**File**: `programs/prism-identity/src/lib.rs`

```rust
use anchor_lang::prelude::*;

declare_id!("PrismXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX");

#[program]
pub mod prism_identity {
    use super::*;
    
    pub fn create_root_identity(
        ctx: Context<CreateRoot>,
        privacy_level: u8,
    ) -> Result<()> {
        let root = &mut ctx.accounts.root_identity;
        root.owner = ctx.accounts.user.key();
        root.created_at = Clock::get()?.unix_timestamp;
        root.privacy_level = privacy_level;
        root.context_count = 0;
        
        emit!(RootCreated {
            owner: root.owner,
            timestamp: root.created_at,
        });
        
        Ok(())
    }
}

#[account]
pub struct RootIdentity {
    pub owner: Pubkey,              // 32
    pub created_at: i64,            // 8
    pub privacy_level: u8,          // 1
    pub context_count: u16,         // 2
}

#[derive(Accounts)]
pub struct CreateRoot<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    
    #[account(
        init,
        payer = user,
        space = 8 + 32 + 8 + 1 + 2, // discriminator + fields
        seeds = [b"root", user.key().as_ref()],
        bump
    )]
    pub root_identity: Account<'info, RootIdentity>,
    
    pub system_program: Program<'info, System>,
}

#[event]
pub struct RootCreated {
    pub owner: Pubkey,
    pub timestamp: i64,
}
```

**Tasks**:
- [ ] Implement `create_root_identity` instruction
- [ ] Add PDA derivation for root
- [ ] Write unit tests
- [ ] Deploy to devnet

**Test**:
```bash
anchor test
anchor deploy --provider.cluster devnet
```

---

#### 1.2 Context Derivation (2 hours)
**File**: `programs/prism-context/src/lib.rs`

```rust
#[program]
pub mod prism_context {
    use super::*;
    
    pub fn create_context(
        ctx: Context<CreateContext>,
        context_type: u8,
        privacy_level: u8,
        max_per_tx: u64,
    ) -> Result<()> {
        let context = &mut ctx.accounts.context;
        let root = &mut ctx.accounts.root_identity;
        
        context.root_identity = root.key();
        context.context_type = context_type;
        context.privacy_level = privacy_level;
        context.created_at = Clock::get()?.unix_timestamp;
        context.max_per_transaction = max_per_tx;
        context.revoked = false;
        
        root.context_count += 1;
        
        Ok(())
    }
    
    pub fn revoke_context(
        ctx: Context<RevokeContext>
    ) -> Result<()> {
        let context = &mut ctx.accounts.context;
        context.revoked = true;
        Ok(())
    }
}

#[account]
pub struct ContextIdentity {
    pub root_identity: Pubkey,      // 32
    pub context_type: u8,           // 1
    pub privacy_level: u8,          // 1
    pub created_at: i64,            // 8
    pub max_per_transaction: u64,   // 8
    pub revoked: bool,              // 1
}
```

**Tasks**:
- [ ] Implement context creation
- [ ] Implement context revocation
- [ ] Add spending limit checks
- [ ] Write tests

---

### Afternoon (4 hours): SDK Foundation

#### 1.3 Core SDK Setup (2 hours)
**File**: `packages/sdk/src/index.ts`

```typescript
import { Connection, PublicKey, Keypair } from '@solana/web3.js';
import { Program, AnchorProvider } from '@coral-xyz/anchor';

export class PrismProtocol {
  private connection: Connection;
  private provider: AnchorProvider;
  private identityProgram: Program;
  private contextProgram: Program;
  
  constructor(config: PrismConfig) {
    this.connection = new Connection(config.rpcUrl);
    this.provider = new AnchorProvider(
      this.connection,
      config.wallet,
      { commitment: 'confirmed' }
    );
  }
  
  async createRootIdentity(
    privacyLevel: PrivacyLevel = PrivacyLevel.High
  ): Promise<RootIdentityResult> {
    const user = this.provider.wallet.publicKey;
    
    // Derive root PDA
    const [rootPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('root'), user.toBuffer()],
      this.identityProgram.programId
    );
    
    // Create root identity
    const tx = await this.identityProgram.methods
      .createRootIdentity(privacyLevel)
      .accounts({
        user,
        rootIdentity: rootPda,
        systemProgram: SystemProgram.programId
      })
      .rpc();
    
    return {
      rootAddress: rootPda,
      signature: tx,
      privacyLevel
    };
  }
  
  async createContext(
    options: CreateContextOptions
  ): Promise<ContextResult> {
    const user = this.provider.wallet.publicKey;
    
    // Get root PDA
    const [rootPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('root'), user.toBuffer()],
      this.identityProgram.programId
    );
    
    // Derive context PDA
    const [contextPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from('context'),
        rootPda.toBuffer(),
        Buffer.from([options.type])
      ],
      this.contextProgram.programId
    );
    
    // Create context
    const tx = await this.contextProgram.methods
      .createContext(
        options.type,
        options.privacyLevel,
        options.maxPerTransaction
      )
      .accounts({
        user,
        rootIdentity: rootPda,
        context: contextPda,
        systemProgram: SystemProgram.programId
      })
      .rpc();
    
    return {
      contextAddress: contextPda,
      signature: tx,
      type: options.type
    };
  }
}

export enum PrivacyLevel {
  Maximum = 0,
  High = 1,
  Medium = 2,
  Low = 3,
  Public = 4
}

export enum ContextType {
  DeFi = 0,
  Social = 1,
  Gaming = 2,
  Professional = 3,
  Temporary = 4,
  Public = 5
}
```

**Tasks**:
- [ ] Implement PrismProtocol class
- [ ] Add createRootIdentity method
- [ ] Add createContext method
- [ ] Add TypeScript types
- [ ] Write SDK tests

---

#### 1.4 Basic Tests (2 hours)

**File**: `tests/prism-identity.ts`

```typescript
import * as anchor from '@coral-xyz/anchor';
import { assert } from 'chai';
import { PrismProtocol } from '../packages/sdk';

describe('Prism Identity', () => {
  const provider = anchor.AnchorProvider.env();
  const prism = new PrismProtocol({
    rpcUrl: provider.connection.rpcEndpoint,
    wallet: provider.wallet
  });
  
  it('Creates root identity', async () => {
    const result = await prism.createRootIdentity();
    
    assert.ok(result.rootAddress);
    assert.ok(result.signature);
    
    // Verify on-chain
    const account = await prism.getRootIdentity();
    assert.equal(
      account.owner.toString(),
      provider.wallet.publicKey.toString()
    );
  });
  
  it('Creates DeFi context', async () => {
    const result = await prism.createContext({
      type: ContextType.DeFi,
      privacyLevel: PrivacyLevel.High,
      maxPerTransaction: 1_000_000_000 // 1 SOL
    });
    
    assert.ok(result.contextAddress);
    
    // Verify context
    const context = await prism.getContext(result.contextAddress);
    assert.equal(context.contextType, ContextType.DeFi);
    assert.equal(context.revoked, false);
  });
});
```

**Tasks**:
- [ ] Write root identity tests
- [ ] Write context creation tests
- [ ] Write context revocation tests
- [ ] All tests passing

---

### Day 1 Deliverables
- ✅ Root identity program deployed
- ✅ Context manager program deployed
- ✅ SDK with 2 core functions
- ✅ All tests passing
- ✅ Programs on devnet

**Git Commit**: `feat: day 1 - foundation complete`

---

## Day 2: Context System (8 hours)

### Morning (4 hours): Spending Limits & Security

#### 2.1 Spending Limits Enforcement (2 hours)

```rust
// Add to prism-context program
pub fn enforce_spending_limit(
    ctx: Context<EnforceLimit>,
    amount: u64,
) -> Result<()> {
    let context = &ctx.accounts.context;
    
    require!(
        !context.revoked,
        ErrorCode::ContextRevoked
    );
    
    require!(
        amount <= context.max_per_transaction,
        ErrorCode::ExceedsLimit
    );
    
    Ok(())
}

#[error_code]
pub enum ErrorCode {
    #[msg("Context has been revoked")]
    ContextRevoked,
    #[msg("Amount exceeds spending limit")]
    ExceedsLimit,
}
```

**Tasks**:
- [ ] Add limit enforcement instruction
- [ ] Add CPI hooks for other programs
- [ ] Test limit blocking works
- [ ] Test revoked contexts blocked

---

#### 2.2 Privacy Level Logic (2 hours)

```typescript
// Add to SDK
export class PrivacyManager {
  calculatePrivacyScore(
    contexts: ContextIdentity[]
  ): PrivacyScore {
    let score = 100;
    
    // Deduct for low privacy contexts
    for (const ctx of contexts) {
      if (ctx.privacyLevel === PrivacyLevel.Public) {
        score -= 20;
      } else if (ctx.privacyLevel === PrivacyLevel.Low) {
        score -= 10;
      }
    }
    
    // Deduct for too many contexts (linking risk)
    if (contexts.length > 5) {
      score -= (contexts.length - 5) * 2;
    }
    
    return {
      score: Math.max(0, score),
      level: this.getPrivacyLevel(score),
      recommendations: this.getRecommendations(contexts)
    };
  }
  
  private getPrivacyLevel(score: number): string {
    if (score >= 90) return 'Excellent';
    if (score >= 70) return 'Good';
    if (score >= 50) return 'Fair';
    return 'Poor';
  }
}
```

**Tasks**:
- [ ] Implement privacy scoring
- [ ] Add recommendations engine
- [ ] Test scoring algorithm
- [ ] Add to SDK

---

### Afternoon (4 hours): Dashboard UI

#### 2.3 Next.js Setup (1 hour)

```bash
npx create-next-app@latest app --typescript --tailwind
cd app
npm install @solana/web3.js @solana/wallet-adapter-react
npm install @prism-protocol/sdk
```

**File**: `app/pages/index.tsx`

```typescript
import { usePrism } from '@prism-protocol/react';
import { ContextCard } from '../components/ContextCard';

export default function Dashboard() {
  const {
    identity,
    contexts,
    privacyScore,
    createContext,
    revokeContext
  } = usePrism();
  
  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold">
        Prism Identity Manager
      </h1>
      
      <div className="mt-8 p-6 bg-white rounded-lg shadow">
        <h2 className="text-xl font-semibold">
          Privacy Score: {privacyScore.score}/100
        </h2>
        <div className="mt-2">
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div
              className="bg-green-500 h-4 rounded-full"
              style={{ width: `${privacyScore.score}%` }}
            />
          </div>
        </div>
      </div>
      
      <div className="mt-8 grid gap-4">
        {contexts.map(ctx => (
          <ContextCard
            key={ctx.address}
            context={ctx}
            onRevoke={() => revokeContext(ctx.address)}
          />
        ))}
      </div>
      
      <button
        onClick={() => createContext({ type: 'defi' })}
        className="mt-8 px-6 py-3 bg-blue-500 text-white rounded-lg"
      >
        + Create New Context
      </button>
    </div>
  );
}
```

**Tasks**:
- [ ] Set up Next.js project
- [ ] Create dashboard layout
- [ ] Add wallet connection
- [ ] Show privacy score

---

#### 2.4 Context Management UI (3 hours)

**File**: `app/components/ContextCard.tsx`

```typescript
export function ContextCard({ context, onRevoke }) {
  const privacyPercentage = 
    ((5 - context.privacyLevel) / 5) * 100;
  
  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-semibold">
            {getContextIcon(context.type)} {context.type} Context
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            {truncate(context.address)}
          </p>
        </div>
        
        <button
          onClick={onRevoke}
          className="text-red-500 hover:text-red-700"
        >
          Revoke
        </button>
      </div>
      
      <div className="mt-4">
        <div className="flex justify-between text-sm">
          <span>Privacy:</span>
          <span>{privacyPercentage}%</span>
        </div>
        <div className="mt-1 w-full bg-gray-200 rounded h-2">
          <div
            className="bg-blue-500 h-2 rounded"
            style={{ width: `${privacyPercentage}%` }}
          />
        </div>
      </div>
      
      <div className="mt-4 text-sm text-gray-600">
        <p>Spending Limit: {context.maxPerTransaction / 1e9} SOL/tx</p>
        <p className="mt-1">
          Created: {new Date(context.createdAt * 1000).toLocaleDateString()}
        </p>
      </div>
    </div>
  );
}
```

**Tasks**:
- [ ] Create ContextCard component
- [ ] Add privacy visualization
- [ ] Add revoke button
- [ ] Test UI interactions

---

### Day 2 Deliverables
- ✅ Spending limits enforced
- ✅ Privacy scoring working
- ✅ Dashboard UI functional
- ✅ Context management working

**Git Commit**: `feat: day 2 - context system complete`

---

## Day 3: ZK Proofs (8 hours)

### Morning (4 hours): Circuit Development

#### 3.1 Age Threshold Circuit (2 hours)

**File**: `circuits/ageThreshold.circom`

```circom
pragma circom 2.0.0;

include "circomlib/comparators.circom";

template AgeThreshold() {
    // Private inputs
    signal input birthYear;
    signal input birthMonth;
    signal input birthDay;
    
    // Public inputs
    signal input currentYear;
    signal input currentMonth;
    signal input currentDay;
    signal input thresholdAge;
    
    // Output
    signal output isOverThreshold;
    
    // Calculate age in years
    component yearDiff = LessThan(32);
    yearDiff.in[0] <== birthYear;
    yearDiff.in[1] <== currentYear;
    
    signal years <== currentYear - birthYear;
    
    // Check if birthday has passed this year
    component monthCheck = LessThan(32);
    monthCheck.in[0] <== birthMonth;
    monthCheck.in[1] <== currentMonth;
    
    component dayCheck = LessThan(32);
    dayCheck.in[0] <== birthDay;
    dayCheck.in[1] <== currentDay;
    
    signal birthdayPassed <== monthCheck.out * dayCheck.out;
    signal actualAge <== years - (1 - birthdayPassed);
    
    // Compare with threshold
    component ageCheck = GreaterEqThan(32);
    ageCheck.in[0] <== actualAge;
    ageCheck.in[1] <== thresholdAge;
    
    isOverThreshold <== ageCheck.out;
}

component main = AgeThreshold();
```

**Compile**:
```bash
circom ageThreshold.circom --r1cs --wasm --sym
snarkjs groth16 setup ageThreshold.r1cs pot12_final.ptau circuit_0000.zkey
snarkjs zkey contribute circuit_0000.zkey circuit_final.zkey
snarkjs zkey export verificationkey circuit_final.zkey verification_key.json
```

**Tasks**:
- [ ] Write age threshold circuit
- [ ] Compile circuit
- [ ] Generate proving key
- [ ] Generate verification key
- [ ] Test with sample inputs

---

#### 3.2 Balance Solvency Circuit (2 hours)

**File**: `circuits/balanceSolvency.circom`

```circom
pragma circom 2.0.0;

include "circomlib/comparators.circom";

template BalanceSolvency() {
    // Private input
    signal input balance;
    
    // Public input
    signal input threshold;
    
    // Output
    signal output isSolvent;
    
    // Check balance >= threshold
    component check = GreaterEqThan(64);
    check.in[0] <== balance;
    check.in[1] <== threshold;
    
    isSolvent <== check.out;
}

component main = BalanceSolvency();
```

**Tasks**:
- [ ] Write balance circuit
- [ ] Compile circuit
- [ ] Generate keys
- [ ] Test with sample balances

---

### Afternoon (4 hours): SDK Integration

#### 3.3 Proof Generation SDK (2 hours)

**File**: `packages/sdk/src/proofs.ts`

```typescript
import { groth16 } from 'snarkjs';

export class ProofGenerator {
  private circuits: Map<ProofType, CircuitData>;
  
  async generateProof(
    type: ProofType,
    privateInputs: any,
    publicInputs: any
  ): Promise<ZKProof> {
    const circuit = this.circuits.get(type);
    
    // Prepare inputs
    const inputs = {
      ...privateInputs,
      ...publicInputs
    };
    
    // Generate witness
    const { proof, publicSignals } = await groth16.fullProve(
      inputs,
      circuit.wasmFile,
      circuit.zkeyFile
    );
    
    // Serialize for on-chain
    const proofBytes = this.serializeProof(proof);
    
    return {
      proof: proofBytes,
      publicSignals,
      type,
      timestamp: Date.now()
    };
  }
  
  async verifyProof(zkProof: ZKProof): Promise<boolean> {
    const circuit = this.circuits.get(zkProof.type);
    
    const proof = this.deserializeProof(zkProof.proof);
    
    return await groth16.verify(
      circuit.verificationKey,
      zkProof.publicSignals,
      proof
    );
  }
  
  private serializeProof(proof: any): Buffer {
    // Convert proof to bytes for on-chain storage
    const a = [proof.pi_a[0], proof.pi_a[1]];
    const b = [
      [proof.pi_b[0][0], proof.pi_b[0][1]],
      [proof.pi_b[1][0], proof.pi_b[1][1]]
    ];
    const c = [proof.pi_c[0], proof.pi_c[1]];
    
    // Pack into 128 bytes
    return Buffer.concat([
      this.bigIntToBuffer(a[0]),
      this.bigIntToBuffer(a[1]),
      // ... rest of proof
    ]);
  }
}
```

**Tasks**:
- [ ] Implement proof generation
- [ ] Add proof serialization
- [ ] Add proof verification
- [ ] Load circuit files
- [ ] Test end-to-end

---

#### 3.4 On-Chain Verification (2 hours)

**File**: `programs/prism-verifier/src/lib.rs`

```rust
#[program]
pub mod prism_verifier {
    use super::*;
    
    pub fn verify_proof(
        ctx: Context<VerifyProof>,
        proof: [u8; 128],
        public_signals: Vec<u64>,
        proof_type: u8,
    ) -> Result<bool> {
        // Load verification key for proof type
        let vk = load_verification_key(proof_type)?;
        
        // Deserialize proof
        let (a, b, c) = deserialize_proof(&proof)?;
        
        // Verify using Groth16
        let valid = groth16_verify(&vk, &a, &b, &c, &public_signals)?;
        
        require!(valid, ErrorCode::InvalidProof);
        
        Ok(true)
    }
}

fn groth16_verify(
    vk: &VerificationKey,
    a: &G1Point,
    b: &G2Point,
    c: &G1Point,
    public_signals: &[u64],
) -> Result<bool> {
    // Groth16 verification equation:
    // e(a, b) = e(alpha, beta) * e(public_inputs, gamma) * e(c, delta)
    
    // This would use Solana's upcoming ZK syscalls
    // For MVP, we can use Light Protocol's verifier
    
    Ok(true) // Simplified for MVP
}
```

**Tasks**:
- [ ] Add verifier program
- [ ] Implement Groth16 verification
- [ ] Test with real proofs
- [ ] Deploy to devnet

---

### Day 3 Deliverables
- ✅ 2 ZK circuits compiled
- ✅ Proof generation working (<2s)
- ✅ Proof verification working
- ✅ On-chain verifier deployed

**Git Commit**: `feat: day 3 - zk proofs complete`

---

## Day 4: Anti-Timing RPC (6 hours)

### Morning (3 hours): RPC Proxy

#### 4.1 Proxy Implementation (3 hours)

**File**: `packages/sdk/src/network/PrismRPC.ts`

```typescript
export class PrismRPC {
  private endpoints: RPCEndpoint[];
  private decoyGenerator: DecoyGenerator;
  
  async request(
    method: string,
    params: any[],
    options: PrivacyOptions = {}
  ): Promise<any> {
    // Add random jitter
    const jitter = Math.random() * (options.maxJitter || 500);
    await this.sleep(jitter);
    
    // Generate decoys
    const decoys = this.decoyGenerator.generate(
      options.decoyCount || 3
    );
    
    // Batch real + decoy requests
    const requests = [
      { method, params, isReal: true },
      ...decoys.map(d => ({ ...d, isReal: false }))
    ];
    
    // Shuffle requests
    this.shuffle(requests);
    
    // Send across multiple RPCs
    const responses = await Promise.all(
      requests.map((req, i) =>
        this.sendToRPC(
          this.endpoints[i % this.endpoints.length],
          req
        )
      )
    );
    
    // Extract real response
    const realResponse = responses.find((r, i) =>
      requests[i].isReal
    );
    
    return realResponse;
  }
  
  private async sendToRPC(
    endpoint: RPCEndpoint,
    request: any
  ): Promise<any> {
    return await fetch(endpoint.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: Math.random(),
        method: request.method,
        params: request.params
      })
    }).then(r => r.json());
  }
  
  private shuffle(array: any[]) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }
}

class DecoyGenerator {
  generate(count: number): DecoyRequest[] {
    const methods = [
      'getBalance',
      'getAccountInfo',
      'getTransaction',
      'getRecentBlockhash',
      'getBlockHeight'
    ];
    
    return Array(count).fill(null).map(() => ({
      method: methods[Math.floor(Math.random() * methods.length)],
      params: this.randomParams()
    }));
  }
  
  private randomParams(): any[] {
    // Generate realistic-looking random parameters
    return [new Keypair().publicKey.toBase58()];
  }
}
```

**Tasks**:
- [ ] Implement PrismRPC class
- [ ] Add timing jitter
- [ ] Add decoy generation
- [ ] Add multi-RPC routing
- [ ] Test anti-timing effectiveness

---

### Afternoon (3 hours): Integration & Testing

#### 4.2 SDK Integration (2 hours)

```typescript
// Update PrismProtocol to use PrismRPC
export class PrismProtocol {
  private rpc: PrismRPC;
  
  constructor(config: PrismConfig) {
    this.rpc = new PrismRPC({
      endpoints: config.rpcEndpoints,
      privacy: config.privacy
    });
    
    this.connection = new Connection({
      // Custom fetcher using PrismRPC
      fetch: this.rpc.request.bind(this.rpc)
    });
  }
}
```

**Tasks**:
- [ ] Integrate PrismRPC into SDK
- [ ] Update all RPC calls
- [ ] Test with real requests
- [ ] Measure timing variance

---

#### 4.3 Anti-Timing Tests (1 hour)

```typescript
describe('Anti-Timing Protection', () => {
  it('Adds timing jitter', async () => {
    const start = Date.now();
    const requests = await Promise.all([
      prismRPC.getBalance(wallet1),
      prismRPC.getBalance(wallet2),
      prismRPC.getBalance(wallet3)
    ]);
    const duration = Date.now() - start;
    
    // Should have added jitter
    assert(duration > 100, 'Too fast, no jitter');
  });
  
  it('Generates decoy requests', async () => {
    const spy = sinon.spy(fetch);
    
    await prismRPC.getBalance(wallet, {
      decoyCount: 3
    });
    
    // Should have made 4 requests (1 real + 3 decoys)
    assert.equal(spy.callCount, 4);
  });
});
```

**Tasks**:
- [ ] Write anti-timing tests
- [ ] Verify jitter working
- [ ] Verify decoys generated
- [ ] All tests passing

---

### Day 4 Deliverables
- ✅ Anti-timing RPC proxy working
- ✅ Timing jitter implemented
- ✅ Decoy generation working
- ✅ Multi-RPC routing working
- ✅ SDK updated to use PrismRPC

**Git Commit**: `feat: day 4 - anti-timing rpc complete`

---

## Day 5: SDK Polish & Docs (6 hours)

### Morning (3 hours): SDK Completion

#### 5.1 React Hooks (2 hours)

**File**: `packages/sdk/src/react/hooks.ts`

```typescript
export function usePrism() {
  const { wallet } = useWallet();
  const [identity, setIdentity] = useState<RootIdentity | null>(null);
  const [contexts, setContexts] = useState<ContextIdentity[]>([]);
  const [privacyScore, setPrivacyScore] = useState<PrivacyScore>({ score: 0 });
  
  const prism = useMemo(() => {
    if (!wallet) return null;
    return new PrismProtocol({ wallet });
  }, [wallet]);
  
  useEffect(() => {
    if (!prism) return;
    
    // Load identity
    prism.getRootIdentity().then(setIdentity);
    prism.getContexts().then(setContexts);
  }, [prism]);
  
  useEffect(() => {
    if (contexts.length === 0) return;
    
    // Calculate privacy score
    const score = prism.calculatePrivacyScore(contexts);
    setPrivacyScore(score);
  }, [contexts]);
  
  const createContext = useCallback(async (options: CreateContextOptions) => {
    const result = await prism.createContext(options);
    setContexts(prev => [...prev, result.context]);
    return result;
  }, [prism]);
  
  const revokeContext = useCallback(async (address: PublicKey) => {
    await prism.revokeContext(address);
    setContexts(prev => prev.filter(c => !c.address.equals(address)));
  }, [prism]);
  
  return {
    prism,
    identity,
    contexts,
    privacyScore,
    createContext,
    revokeContext
  };
}
```

**Tasks**:
- [ ] Create usePrism hook
- [ ] Add useProof hook
- [ ] Add usePrivacyScore hook
- [ ] Test hooks

---

#### 5.2 Pre-built Components (1 hour)

```typescript
export function PrismConnect({
  contextType,
  onConnect
}: PrismConnectProps) {
  const { prism } = usePrism();
  const [loading, setLoading] = useState(false);
  
  const handleConnect = async () => {
    setLoading(true);
    try {
      const context = await prism.createContext({
        type: contextType,
        privacyLevel: PrivacyLevel.High
      });
      onConnect(context);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <button
      onClick={handleConnect}
      disabled={loading}
      className="px-6 py-3 bg-blue-500 text-white rounded-lg"
    >
      {loading ? 'Connecting...' : 'Connect with Prism'}
    </button>
  );
}
```

**Tasks**:
- [ ] Create PrismConnect component
- [ ] Create ProofRequest component
- [ ] Create ContextSelector component
- [ ] Test components

---

### Afternoon (3 hours): Documentation

#### 5.3 SDK Documentation (3 hours)

**File**: `packages/sdk/README.md`

```markdown
# Prism Protocol SDK

Privacy infrastructure for Solana applications.

## Installation

\`\`\`bash
npm install @prism-protocol/sdk
\`\`\`

## Quick Start

\`\`\`typescript
import { PrismProtocol } from '@prism-protocol/sdk';

const prism = new PrismProtocol({
  rpcUrl: 'https://api.devnet.solana.com',
  wallet: yourWallet
});

// Create root identity
await prism.createRootIdentity();

// Create context
const defiContext = await prism.createContext({
  type: ContextType.DeFi,
  privacyLevel: PrivacyLevel.High
});

// Generate ZK proof
const proof = await prism.generateProof({
  type: ProofType.AGE_THRESHOLD,
  privateInputs: { birthdate: '1990-01-01' },
  publicInputs: { threshold: 21 }
});
\`\`\`

## API Reference

[Full API docs...]
```

**Tasks**:
- [ ] Write SDK README
- [ ] Add code examples
- [ ] Document all functions
- [ ] Add TypeScript types docs

---

### Day 5 Deliverables
- ✅ React hooks complete
- ✅ Pre-built components
- ✅ Full SDK documentation
- ✅ Code examples
- ✅ NPM package ready

**Git Commit**: `feat: day 5 - sdk complete`

---

## Day 6: Dashboard Polish (6 hours)

### Full Day: UI/UX Polish

#### 6.1 Dashboard Features (3 hours)

```typescript
// Add features to dashboard:
// - Context creation modal
// - Context details view
// - Privacy settings panel
// - Activity log
// - Warnings for risky behavior
```

**Tasks**:
- [ ] Add context creation modal
- [ ] Add context details view
- [ ] Add privacy settings
- [ ] Add activity log
- [ ] Mobile responsive
- [ ] Dark mode support

---

#### 6.2 Visual Polish (3 hours)

**Tasks**:
- [ ] Improve typography
- [ ] Add animations
- [ ] Add loading states
- [ ] Add error states
- [ ] Add success toasts
- [ ] Add privacy score chart
- [ ] Add recommendations UI

---

### Day 6 Deliverables
- ✅ Dashboard fully functional
- ✅ Mobile responsive
- ✅ Beautiful UI
- ✅ Loading/error states
- ✅ Activity tracking

**Git Commit**: `feat: day 6 - dashboard polished`

---

## Day 7: Demos & Submission (8 hours)

### Morning (4 hours): Demo Applications

#### 7.1 Demo 1: Anonymous DAO Voting (1.5 hours)

```typescript
// Simple voting app
function VotingDemo() {
  const { prism } = usePrism();
  
  const handleVote = async (option: string) => {
    // Request proof of token holding
    const proof = await prism.generateProof({
      type: ProofType.BALANCE_SOLVENCY,
      privateInputs: { balance: await getBalance() },
      publicInputs: { threshold: 1000 }
    });
    
    // Submit vote
    await submitVote(option, proof);
  };
  
  return (
    <div>
      <h1>Vote on Proposal #42</h1>
      <ProofRequest
        requirement={{ type: 'token_holding', threshold: 1000 }}
        onProofGenerated={handleVote}
      >
        <button>Vote Anonymously</button>
      </ProofRequest>
    </div>
  );
}
```

---

#### 7.2 Demo 2: Anti-Drain Protection (1.5 hours)

```typescript
// Demonstrate wallet protection
function AntiDrainDemo() {
  const [protected, setProtected] = useState(false);
  
  const connectToMaliciousSite = async () => {
    // Prism auto-creates disposable context
    const context = await prism.createContext({
      type: ContextType.Temporary,
      limits: { maxPerTransaction: lamports(0.1) }
    });
    
    setProtected(true);
    
    // Simulate malicious transaction
    try {
      await sendTransaction(lamports(10)); // Tries to drain
    } catch (e) {
      alert('Transaction blocked! Main wallet safe.');
    }
  };
  
  return (
    <div>
      <h1>Wallet Drain Protection Demo</h1>
      <button onClick={connectToMaliciousSite}>
        Connect to Suspicious Site
      </button>
      {protected && <p>✅ Main wallet protected!</p>}
    </div>
  );
}
```

---

#### 7.3 Demo 3: Cross-Chain Attestation (1 hour)

```typescript
// Cross-chain identity demo
function CrossChainDemo() {
  const handleCrossChain = async () => {
    // Generate attestation on Solana
    const attestation = await prism.createCrossChainAttestation({
      targetChain: Chain.Ethereum,
      credential: CredentialType.Age,
      context: await prism.getContext(ContextType.DeFi)
    });
    
    // Show Wormhole VAA
    console.log('Wormhole VAA:', attestation.vaa);
    
    // Verify on Ethereum (testnet)
    const verified = await verifyOnEthereum(attestation);
    alert(verified ? 'Verified on Ethereum!' : 'Failed');
  };
  
  return (
    <div>
      <h1>Cross-Chain Identity Demo</h1>
      <button onClick={handleCrossChain}>
        Prove Solana Identity on Ethereum
      </button>
    </div>
  );
}
```

---

### Afternoon (4 hours): Final Polish & Submission

#### 7.4 Documentation Finalization (1 hour)

**Tasks**:
- [ ] Update README with final info
- [ ] Add demo links
- [ ] Add video embed
- [ ] Add screenshots
- [ ] Spell check everything

---

#### 7.5 Demo Video Recording (2 hours)

**Script** (3 minutes):

**0:00-0:30 - Hook**
"Solana's identity solutions leak privacy. Wallet linking deanonymizes users. RPC timing attacks work 95% of the time. $1B lost to wallet draining in 2025. We built Prism Protocol to fix this."

**0:30-2:00 - Demo**
1. Show dashboard - create contexts
2. Demo 1: Anonymous voting (prove eligibility without amount)
3. Demo 2: Wallet drain protection (simulate attack, show blocked)
4. Demo 3: Cross-chain (Solana → Ethereum verification)

**2:00-3:00 - Impact**
"Prism gives users privacy, developers easy integration, and the ecosystem true security. This is privacy infrastructure Solana has been missing."

**Tasks**:
- [ ] Record screen capture
- [ ] Record voiceover
- [ ] Edit video
- [ ] Upload to YouTube
- [ ] Add captions

---

#### 7.6 Submission (1 hour)

**Checklist**:
- [ ] GitHub repo public
- [ ] README complete
- [ ] All code committed
- [ ] Demo deployed
- [ ] Video uploaded
- [ ] Submission form filled
- [ ] Tweet announcement

**Git Commit**: `feat: day 7 - hackathon submission ready`

---

## Emergency Backup Plan

If running behind schedule:

### Must Have (Core MVP)
- Root identity + contexts (Day 1-2)
- 1 ZK proof (age only) (Day 3)
- Basic SDK (Day 5)
- Simple dashboard (Day 6)
- 1 demo (voting) (Day 7)

### Nice to Have (Can Skip)
- Anti-timing RPC (defer to post-hackathon)
- Cross-chain (defer to post-hackathon)
- Advanced dashboard features
- 2nd and 3rd demos

---

## Success Metrics

### Day 7 End State
- [ ] All P0 features working
- [ ] 3 demos functional
- [ ] Documentation complete
- [ ] Video recorded
- [ ] Submission complete
- [ ] No critical bugs

---

## Post-Hackathon Next Steps

### Week 1 After
- Security audit
- Bug fixes
- Community feedback

### Week 2-4
- Mainnet deployment
- First integrations
- Marketing launch

---

**Total Build Time**: 7 days × 8 hours = 56 hours  
**Target**: Fully functional MVP + 3 demos + documentation  
**Backup**: Core MVP + 1 demo if behind schedule  

Let's ship this! 🚀
