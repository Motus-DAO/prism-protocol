#!/bin/bash
# Copy Arcium configuration from PsyChat to Prism-protocol
# Run this from Prism-protocol directory

set -e

echo "🔐 Copying Arcium configuration from PsyChat to Prism-protocol..."
echo ""

# Define paths
PSYCHAT_DIR="/Users/main/PsyChat"
PRISM_DIR="/Users/main/Prism-protocol"

# Check if PsyChat directory exists
if [ ! -d "$PSYCHAT_DIR" ]; then
    echo "❌ Error: PsyChat directory not found at $PSYCHAT_DIR"
    exit 1
fi

# Create directories
echo "📁 Creating directories..."
mkdir -p "$PRISM_DIR/lib/privacy"
mkdir -p "$PRISM_DIR/lib/types"

# Copy Arcium libraries
echo "📝 Copying Arcium libraries..."
if [ -f "$PSYCHAT_DIR/lib/arcium-chat.ts" ]; then
    cp "$PSYCHAT_DIR/lib/arcium-chat.ts" "$PRISM_DIR/lib/privacy/"
    echo "  ✅ Copied arcium-chat.ts"
else
    echo "  ⚠️  arcium-chat.ts not found"
fi

if [ -f "$PSYCHAT_DIR/lib/arcium-conversation-encryption.ts" ]; then
    cp "$PSYCHAT_DIR/lib/arcium-conversation-encryption.ts" "$PRISM_DIR/lib/privacy/"
    echo "  ✅ Copied arcium-conversation-encryption.ts"
else
    echo "  ⚠️  arcium-conversation-encryption.ts not found"
fi

# Copy types
echo "📝 Copying type definitions..."
if [ -f "$PSYCHAT_DIR/lib/types/arcium.ts" ]; then
    cp "$PSYCHAT_DIR/lib/types/arcium.ts" "$PRISM_DIR/lib/types/"
    echo "  ✅ Copied arcium types"
else
    echo "  ⚠️  arcium.ts types not found"
fi

# Copy Arcium.toml (optional)
echo "📝 Copying Arcium.toml configuration..."
if [ -f "$PSYCHAT_DIR/Arcium.toml" ]; then
    cp "$PSYCHAT_DIR/Arcium.toml" "$PRISM_DIR/"
    echo "  ✅ Copied Arcium.toml"
else
    echo "  ⚠️  Arcium.toml not found"
fi

# Get MXE address from PsyChat .env.local if it exists
echo ""
echo "🔑 Checking for Arcium environment variables in PsyChat..."
if [ -f "$PSYCHAT_DIR/.env.local" ]; then
    MXE_ADDRESS=$(grep "NEXT_PUBLIC_ARCIUM_MXE_ADDRESS" "$PSYCHAT_DIR/.env.local" 2>/dev/null | cut -d '=' -f2 | tr -d '"' | tr -d "'" || echo "")
    CLUSTER_ID=$(grep "NEXT_PUBLIC_ARCIUM_CLUSTER_ID" "$PSYCHAT_DIR/.env.local" 2>/dev/null | cut -d '=' -f2 | tr -d '"' | tr -d "'" || echo "")
    
    if [ -n "$MXE_ADDRESS" ] || [ -n "$CLUSTER_ID" ]; then
        echo ""
        echo "📋 Found Arcium configuration in PsyChat:"
        [ -n "$MXE_ADDRESS" ] && echo "  MXE Address: $MXE_ADDRESS"
        [ -n "$CLUSTER_ID" ] && echo "  Cluster ID: $CLUSTER_ID"
        
        # Create .env.local if it doesn't exist
        if [ ! -f "$PRISM_DIR/.env.local" ]; then
            echo ""
            echo "📝 Creating .env.local in Prism-protocol..."
            cat > "$PRISM_DIR/.env.local" << EOF
# Arcium MPC Integration (shared from PsyChat)
NEXT_PUBLIC_ARCIUM_MXE_ADDRESS="$MXE_ADDRESS"
NEXT_PUBLIC_ARCIUM_CLUSTER_ID="$CLUSTER_ID"
NEXT_PUBLIC_ARCIUM_RPC_URL="https://api.devnet.solana.com"
ARCIUM_NETWORK="localnet"
ARCIUM_USE_REAL_MPC="true"
ARCIUM_MOCK_MODE="false"
EOF
            echo "  ✅ Created .env.local with Arcium configuration"
        else
            echo ""
            echo "⚠️  .env.local already exists in Prism-protocol"
            echo "   Add these lines manually:"
            echo ""
            [ -n "$MXE_ADDRESS" ] && echo "   NEXT_PUBLIC_ARCIUM_MXE_ADDRESS=\"$MXE_ADDRESS\""
            [ -n "$CLUSTER_ID" ] && echo "   NEXT_PUBLIC_ARCIUM_CLUSTER_ID=\"$CLUSTER_ID\""
            echo "   NEXT_PUBLIC_ARCIUM_RPC_URL=\"https://api.devnet.solana.com\""
        fi
    else
        echo "  ℹ️  No Arcium environment variables found in PsyChat .env.local"
    fi
else
    echo "  ℹ️  PsyChat .env.local not found (this is okay for MVP)"
fi

# Check Docker status
echo ""
echo "🐳 Checking Docker status..."
if docker ps &> /dev/null; then
    ARCIUM_RUNNING=$(docker ps | grep -c "arcium" || echo "0")
    if [ "$ARCIUM_RUNNING" -gt "0" ]; then
        echo "  ✅ Arcium Docker containers are running ($ARCIUM_RUNNING container(s))"
    else
        echo "  ⚠️  Arcium Docker containers not currently running"
        echo "     Start with: cd $PSYCHAT_DIR && arcium localnet --skip-build"
    fi
else
    echo "  ⚠️  Docker is not running"
    echo "     Start Docker Desktop first"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Arcium configuration copy complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 Files copied to Prism-protocol:"
echo "   lib/privacy/arcium-chat.ts"
echo "   lib/privacy/arcium-conversation-encryption.ts"
echo "   lib/types/arcium.ts"
echo "   Arcium.toml"
echo "   .env.local (if created)"
echo ""
echo "🚀 Next steps:"
echo "   1. Ensure Docker Desktop is running"
echo "   2. Start Arcium localnet:"
echo "      cd $PSYCHAT_DIR && arcium localnet --skip-build"
echo "   3. Verify in Prism-protocol:"
echo "      npm install @arcium-hq/client @arcium-hq/reader"
echo "   4. Continue with Day 1 of HACKATHON_ROADMAP.md"
echo ""
echo "📖 See ARCIUM_SETUP.md for detailed integration guide"
echo ""
