# Arcium Setup for Prism Protocol
## Reusing Configuration from PsyChat

**Status**: Arcium already configured in PsyChat project  
**Docker**: Running in PsyChat  
**Goal**: Reuse configuration for Prism-protocol  

---

## 📋 What You Already Have (from PsyChat)

### Arcium Configuration
- ✅ Arcium CLI installed (`arcium-cli 0.3.0`)
- ✅ Docker Desktop running
- ✅ Arcium Docker images pulled
- ✅ `Arcium.toml` configuration file
- ✅ MXE program structure in `arcium-chat-mxe/`
- ✅ TypeScript integration libraries

### Files Available in PsyChat
```
/Users/main/PsyChat/
├── Arcium.toml                              # Localnet config
├── arcium-chat-mxe/                         # MXE program
│   ├── Arcium.toml                          # MXE-specific config
│   ├── Cargo.toml
│   ├── src/lib.rs                           # MPC program
│   └── encrypted-ixs/                       # Encrypted instructions
├── lib/
│   ├── arcium-chat.ts                       # Service integration
│   └── arcium-conversation-encryption.ts    # Encryption utilities
└── target/deploy/
    └── arcium-chat-mxe-keypair.json         # Deployed program keypair
```

---

## 🚀 Option 1: Share Arcium Configuration (Recommended for MVP)

### Why This Works
- Both projects can use the same Arcium localnet
- Saves time (no need to redeploy)
- Same Docker containers serve both projects
- Just reference PsyChat's Arcium config

### Steps

#### 1. Create Symbolic Link to Arcium Config
```bash
cd /Users/main/Prism-protocol

# Link to PsyChat's Arcium configuration
ln -s /Users/main/PsyChat/Arcium.toml ./Arcium.toml

# Or copy if you prefer
# cp /Users/main/PsyChat/Arcium.toml ./Arcium.toml
```

#### 2. Copy Arcium Libraries
```bash
# Copy Arcium integration libraries
mkdir -p lib
cp /Users/main/PsyChat/lib/arcium-chat.ts lib/
cp /Users/main/PsyChat/lib/arcium-conversation-encryption.ts lib/
cp -r /Users/main/PsyChat/lib/types lib/
```

#### 3. Update Environment Variables
Create `.env.local` in Prism-protocol:
```bash
# Arcium MPC Integration (shared with PsyChat)
NEXT_PUBLIC_ARCIUM_MXE_ADDRESS="<get from PsyChat>"
NEXT_PUBLIC_ARCIUM_CLUSTER_ID="<get from PsyChat>"
NEXT_PUBLIC_ARCIUM_RPC_URL="https://api.devnet.solana.com"
ARCIUM_NETWORK="localnet"
ARCIUM_USE_REAL_MPC="true"
```

#### 4. Start Arcium Localnet (if not running)
```bash
# In PsyChat directory
cd /Users/main/PsyChat
arcium localnet --skip-build

# Keep this terminal open - localnet runs here
```

#### 5. Use from Prism-protocol
```typescript
// In Prism-protocol SDK
import { arciumChatService } from '../lib/arcium-chat';

// Initialize and use
await arciumChatService.initialize();
const encrypted = await arciumChatService.encryptMessage(
  "sensitive data",
  userWallet
);
```

---

## 🔧 Option 2: Create Separate Arcium MXE (Production Approach)

### Why Separate
- Different privacy requirements
- Independent deployment
- Production isolation

### Steps

#### 1. Copy MXE Structure
```bash
cd /Users/main/Prism-protocol
mkdir -p prism-mxe

# Copy base structure
cp -r /Users/main/PsyChat/arcium-chat-mxe/* prism-mxe/

# Rename program
cd prism-mxe
# Edit Cargo.toml, change name to "prism-mxe"
# Edit Arcium.toml, update program name
```

#### 2. Create Prism-Specific Encrypted Instructions
```rust
// prism-mxe/encrypted-ixs/identity_encryption.rs
use arcium_mxe::prelude::*;

#[encrypted_instruction]
pub fn encrypt_identity_data(
    root_identity: &Pubkey,
    context_data: &[u8],
) -> Result<[u8; 64]> {
    // Arcium MPC encryption for identity contexts
    let encrypted = mpc_encrypt(context_data)?;
    Ok(encrypted)
}

#[encrypted_instruction]
pub fn generate_zk_proof(
    credential_type: u8,
    private_data: &[u8],
    public_threshold: u64,
) -> Result<[u8; 32]> {
    // Generate ZK proof within MPC
    let proof = mpc_prove(credential_type, private_data, public_threshold)?;
    Ok(proof)
}
```

#### 3. Build and Deploy
```bash
cd prism-mxe
arcium build
arcium deploy --network devnet
```

---

## 📝 Recommended Approach for Hackathon

### For MVP (Days 1-3): Use Option 1
**Why**: 
- Faster (reuse existing setup)
- Focus on core features
- Arcium already working

**What to do**:
```bash
# 1. Copy libraries
cp /Users/main/PsyChat/lib/arcium-*.ts /Users/main/Prism-protocol/lib/

# 2. Share Arcium localnet
# Just ensure PsyChat's localnet is running

# 3. Update imports in Prism code
import { arciumChatService } from '../lib/arcium-chat';
```

### For Production (Post-Hackathon): Use Option 2
**Why**:
- Proper isolation
- Custom encryption logic
- Independent deployment

---

## 🔑 Getting MXE Address from PsyChat

```bash
# In PsyChat directory
cd /Users/main/PsyChat

# Check deployed MXE address
arcium mxe-info --rpc-url devnet

# Or check environment
cat .env.local | grep ARCIUM
```

**Copy these values to Prism-protocol's `.env.local`**

---

## 🛠️ Quick Integration for Prism

### Step 1: Copy Files (5 minutes)
```bash
cd /Users/main/Prism-protocol

# Copy Arcium libraries
mkdir -p lib/privacy
cp /Users/main/PsyChat/lib/arcium-chat.ts lib/privacy/
cp /Users/main/PsyChat/lib/arcium-conversation-encryption.ts lib/privacy/

# Copy types
mkdir -p lib/types
cp /Users/main/PsyChat/lib/types/arcium.ts lib/types/
```

### Step 2: Adapt for Prism (10 minutes)

**Create `lib/privacy/prism-arcium.ts`:**
```typescript
import { arciumChatService } from './arcium-chat';

export class PrismArcium {
  private arcium = arciumChatService;
  
  async initialize() {
    await this.arcium.initialize();
  }
  
  // Encrypt context data
  async encryptContext(
    contextData: any,
    contextId: string
  ) {
    return await this.arcium.encryptMessage(
      JSON.stringify(contextData),
      contextId
    );
  }
  
  // Encrypt credential
  async encryptCredential(
    credentialData: any,
    userId: string
  ) {
    return await this.arcium.encryptMessage(
      JSON.stringify(credentialData),
      userId
    );
  }
  
  // Get network status
  async getStatus() {
    return await this.arcium.getNetworkStatus();
  }
}

export const prismArcium = new PrismArcium();
```

### Step 3: Use in SDK (5 minutes)
```typescript
// packages/sdk/src/core/Identity.ts
import { prismArcium } from '../privacy/prism-arcium';

export class PrismProtocol {
  async createRootIdentity(options) {
    // Initialize Arcium
    await prismArcium.initialize();
    
    // Encrypt identity data
    const encrypted = await prismArcium.encryptContext(
      { privacyLevel: options.privacyLevel },
      userWallet
    );
    
    // Create on-chain identity with encrypted data
    const tx = await this.program.methods
      .createRootIdentity(encrypted.encryptedData)
      .rpc();
    
    return tx;
  }
}
```

---

## 🐳 Docker Management

### Check if Arcium Docker is Running
```bash
docker ps | grep arcium
```

### Start Arcium Localnet (in PsyChat)
```bash
cd /Users/main/PsyChat
arcium localnet --skip-build

# Output should show:
# ✓ Localnet started with 2 nodes
# ✓ MXE deployed to: <address>
```

### Stop Arcium Localnet
```bash
# Ctrl+C in terminal running localnet
# Or:
docker stop $(docker ps -q --filter ancestor=arcium/arx-node)
```

---

## 📊 Verification Checklist

After copying configuration:

- [ ] Arcium libraries copied to Prism-protocol
- [ ] `.env.local` created with MXE address
- [ ] Arcium localnet running (check `docker ps`)
- [ ] Can initialize `prismArcium` service
- [ ] Can encrypt test data
- [ ] Network status returns connected

---

## 🎯 Integration Points for Prism Features

### For Root Identity Encryption
```typescript
// Encrypt root identity settings
const encrypted = await prismArcium.encryptContext({
  privacyLevel: PrivacyLevel.High,
  autoBurnThreshold: 80
}, rootPda.toString());
```

### For ZK Proof Generation
```typescript
// Generate ZK proof with Arcium MPC
const proof = await prismArcium.generateProof({
  type: ProofType.AGE_THRESHOLD,
  privateData: encryptedBirthdate,
  publicThreshold: 21
});
```

### For Context Isolation
```typescript
// Each context gets separate encryption
const defiEncrypted = await prismArcium.encryptContext(
  defiContextData,
  'defi-' + userWallet
);

const socialEncrypted = await prismArcium.encryptContext(
  socialContextData,
  'social-' + userWallet
);
```

---

## 🚨 Important Notes

### For Hackathon MVP
1. **Reuse PsyChat's Arcium setup** (faster)
2. **Share localnet** (both projects use same Docker)
3. **Copy libraries** (don't reinvent)
4. **Focus on Prism features** (not Arcium setup)

### For Production
1. **Deploy separate MXE** (isolation)
2. **Custom encryption logic** (Prism-specific)
3. **Independent localnet** (if needed)
4. **Security audit** (before mainnet)

---

## 📞 Quick Commands Reference

```bash
# Copy Arcium files from PsyChat
cp /Users/main/PsyChat/lib/arcium-*.ts /Users/main/Prism-protocol/lib/

# Check Arcium status (in PsyChat)
cd /Users/main/PsyChat && arcium mxe-info --rpc-url devnet

# Start Arcium localnet (in PsyChat)
cd /Users/main/PsyChat && arcium localnet --skip-build

# Check Docker
docker ps | grep arcium

# Get MXE address
cat /Users/main/PsyChat/.env.local | grep ARCIUM_MXE_ADDRESS
```

---

## ✅ Next Steps

1. **Copy Arcium libraries** (5 min)
2. **Get MXE address from PsyChat** (2 min)
3. **Create `.env.local` in Prism** (3 min)
4. **Test integration** (10 min)
5. **Continue with Day 1 roadmap**

**Total Time**: ~20 minutes to set up Arcium in Prism using PsyChat config

---

**You're ready to use Arcium in Prism Protocol!** 🚀

The beauty of this approach: You don't need to reinstall or reconfigure Arcium. Just reuse what's already working in PsyChat!
