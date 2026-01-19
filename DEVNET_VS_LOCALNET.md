# Devnet vs Localnet - Arcium Configuration

## 🎯 You're Using: DEVNET ✅

Your PsyChat is configured for **devnet** and that's perfect for the hackathon!

---

## 📊 Comparison

| Feature | Devnet (Your Setup) | Localnet |
|---------|-------------------|----------|
| **Docker Required** | ❌ NO | ✅ YES |
| **Internet Required** | ✅ YES | ❌ NO |
| **Setup Time** | 0 min | 10 min |
| **MPC Nodes** | Real Arcium nodes | Local Docker containers |
| **Network** | Solana devnet | Local Solana validator |
| **Persistence** | ✅ Always available | ⚠️ Must be running |
| **Best For** | Hackathon, development | Offline testing |

---

## 🌐 Devnet (What You Have)

### Pros
- ✅ **No Docker needed** - runs on real Arcium network
- ✅ **Always available** - no need to start/stop
- ✅ **Production-like** - uses real MPC nodes
- ✅ **Already working** - tested in PsyChat
- ✅ **Hackathon ready** - judges can test anytime

### Configuration
```bash
# .env.local
ARCIUM_NETWORK="devnet"
NEXT_PUBLIC_ARCIUM_NETWORK="devnet"
NEXT_PUBLIC_ARCIUM_RPC_URL="https://api.devnet.solana.com"
NEXT_PUBLIC_ARCIUM_MXE_ADDRESS="EFs8XpQ9QHy6ZiMr91ejUe8up9S9TuMuJsFDgfzhSjan"
NEXT_PUBLIC_ARCIUM_CLUSTER_ID="1078779259"
```

### Usage
```typescript
import { arciumChatService } from './lib/privacy/arcium-chat';

// Just initialize and use - connects to devnet automatically
await arciumChatService.initialize();
const encrypted = await arciumChatService.encryptMessage(data, userId);
```

### When to Use
- ✅ Hackathon development
- ✅ Team collaboration (everyone uses same network)
- ✅ Demo to judges
- ✅ When you want "it just works"

---

## 🐳 Localnet (Optional Alternative)

### Pros
- ✅ **Offline development** - no internet needed
- ✅ **Fast iteration** - local nodes respond instantly
- ✅ **Full control** - your own MPC cluster
- ✅ **Testing** - can restart/reset anytime

### Cons
- ❌ **Docker required** - must install and run
- ❌ **Manual start** - need to run `arcium localnet`
- ❌ **Not persistent** - stops when you close terminal
- ❌ **Extra setup** - configuration overhead

### Configuration
```bash
# .env.local
ARCIUM_NETWORK="localnet"
NEXT_PUBLIC_ARCIUM_NETWORK="localnet"
NEXT_PUBLIC_ARCIUM_RPC_URL="http://localhost:8899"
# MXE deployed locally
```

### Setup Steps
```bash
# 1. Start Docker Desktop
open -a Docker

# 2. Start localnet
cd /Users/main/PsyChat  # or Prism-protocol
arcium localnet --skip-build

# 3. Keep terminal open
# 4. Use in another terminal
```

### When to Use
- Use when internet is unreliable
- Use for rapid testing without network latency
- Use for learning Arcium internals
- **NOT recommended for hackathon** (devnet is better)

---

## 🎯 Recommendation for Prism Protocol

**Stay with DEVNET** (what you already have)

### Why?
1. ✅ **Already working** in PsyChat
2. ✅ **No extra setup** needed
3. ✅ **Hackathon-friendly** - always available
4. ✅ **Demo-ready** - judges can test anytime
5. ✅ **Less complexity** - focus on Prism features

### Migration Path (if you ever want to switch)

**Devnet → Localnet** (for offline dev):
```bash
# 1. Update .env.local
ARCIUM_NETWORK="localnet"

# 2. Start localnet
arcium localnet --skip-build

# 3. Update MXE address to local one
# That's it!
```

**Localnet → Devnet** (back to your setup):
```bash
# 1. Update .env.local
ARCIUM_NETWORK="devnet"
NEXT_PUBLIC_ARCIUM_MXE_ADDRESS="EFs8XpQ9QHy6ZiMr91ejUe8up9S9TuMuJsFDgfzhSjan"

# 2. Stop localnet (if running)
# Ctrl+C or docker stop

# That's it!
```

---

## 🔍 How to Tell Which One You're Using

### Check Environment
```bash
cat .env.local | grep ARCIUM_NETWORK
# If shows "devnet" → you're on devnet ✅
# If shows "localnet" → you're on localnet
```

### Check in Code
```typescript
const status = await arciumChatService.getNetworkStatus();
console.log(status);
// isLocalnet: false → devnet
// isLocalnet: true → localnet
```

### Check Docker
```bash
docker ps | grep arcium
# If shows containers → localnet might be running
# If empty → using devnet (no Docker needed)
```

---

## 📝 Summary

**Your Current Setup (PsyChat)**:
```
✅ Network: DEVNET
✅ MXE: EFs8XpQ9QHy6ZiMr91ejUe8up9S9TuMuJsFDgfzhSjan
✅ RPC: https://api.devnet.solana.com
✅ Docker: NOT NEEDED
✅ Status: WORKING
```

**What You Should Do**:
1. ✅ Keep using devnet (don't change anything)
2. ✅ Copy same config to Prism-protocol
3. ✅ Focus on building Prism features
4. ✅ Ignore Docker/localnet for now

**When You Should Change**:
- ❌ Don't change for hackathon
- ⏸️ Maybe after hackathon if you need offline dev
- 🤔 Only if you have specific reason

---

## 🚀 For Prism Protocol

**Use this in `.env.local`:**
```bash
# Copy from PsyChat (devnet setup)
NEXT_PUBLIC_ARCIUM_MXE_ADDRESS="EFs8XpQ9QHy6ZiMr91ejUe8up9S9TuMuJsFDgfzhSjan"
NEXT_PUBLIC_ARCIUM_CLUSTER_ID="1078779259"
NEXT_PUBLIC_ARCIUM_RPC_URL="https://api.devnet.solana.com"
ARCIUM_NETWORK="devnet"
NEXT_PUBLIC_ARCIUM_NETWORK="devnet"
```

**Then just use it:**
```typescript
import { arciumChatService } from './lib/privacy/arcium-chat';

// It connects to devnet automatically - no Docker needed!
await arciumChatService.initialize();
```

---

**Bottom Line**: 
- 🎯 You're on **devnet** (correct!)
- ✅ **Keep it** (don't change)
- 🚀 **Use same setup** in Prism-protocol
- 🐳 **No Docker needed**

**You were right to question it!** Devnet is the right choice for your hackathon. 🎉
