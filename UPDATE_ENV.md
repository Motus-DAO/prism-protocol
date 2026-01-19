# 🔑 Update Your .env.local File

Your `.env.local` needs to be updated with the correct Arcium devnet configuration from PsyChat.

## Quick Update

Run this command to update your `.env.local`:

```bash
cd /Users/main/Prism-protocol

# Add Arcium devnet config to .env.local
cat >> .env.local << 'ENVEOF'

# Arcium MPC Integration (from PsyChat - DEVNET)
NEXT_PUBLIC_ARCIUM_MXE_ADDRESS="EFs8XpQ9QHy6ZiMr91ejUe8up9S9TuMuJsFDgfzhSjan"
NEXT_PUBLIC_ARCIUM_CLUSTER_ID="1078779259"
NEXT_PUBLIC_ARCIUM_RPC_URL="https://api.devnet.solana.com"
ARCIUM_NETWORK="devnet"
NEXT_PUBLIC_ARCIUM_NETWORK="devnet"
ARCIUM_USE_REAL_MPC="true"
ARCIUM_MOCK_MODE="false"
ENVEOF
```

## Or Manually Add

Open `.env.local` and add these lines:

```bash
# Arcium MPC Integration (from PsyChat - DEVNET)
NEXT_PUBLIC_ARCIUM_MXE_ADDRESS="EFs8XpQ9QHy6ZiMr91ejUe8up9S9TuMuJsFDgfzhSjan"
NEXT_PUBLIC_ARCIUM_CLUSTER_ID="1078779259"
NEXT_PUBLIC_ARCIUM_RPC_URL="https://api.devnet.solana.com"
ARCIUM_NETWORK="devnet"
NEXT_PUBLIC_ARCIUM_NETWORK="devnet"
ARCIUM_USE_REAL_MPC="true"
ARCIUM_MOCK_MODE="false"
```

## Verify

Check that it's correct:

```bash
cat .env.local | grep ARCIUM
```

Should show:
```
NEXT_PUBLIC_ARCIUM_MXE_ADDRESS="EFs8XpQ9QHy6ZiMr91ejUe8up9S9TuMuJsFDgfzhSjan"
NEXT_PUBLIC_ARCIUM_CLUSTER_ID="1078779259"
NEXT_PUBLIC_ARCIUM_RPC_URL="https://api.devnet.solana.com"
ARCIUM_NETWORK="devnet"
NEXT_PUBLIC_ARCIUM_NETWORK="devnet"
```

✅ **Important**: It should say `devnet`, NOT `localnet`!

## Done!

Your Arcium configuration now matches PsyChat's devnet setup.

No Docker needed! 🎉
