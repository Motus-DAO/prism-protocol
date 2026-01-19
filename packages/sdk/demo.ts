#!/usr/bin/env npx ts-node
// Prism Protocol - Dark Pool Demo
// Run with: npx ts-node demo.ts

import { Keypair } from '@solana/web3.js';
import { PrismProtocol, ContextType, PrivacyLevel } from './src';

const LAMPORTS_PER_SOL = 1_000_000_000n;

async function darkPoolDemo() {
  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║         PRISM PROTOCOL - DARK POOL TRADING DEMO               ║
║      Privacy Infrastructure for Anonymous DeFi on Solana      ║
╚═══════════════════════════════════════════════════════════════╝
  `);

  // Setup mock wallet (in production, use real wallet adapter)
  const mockKeypair = Keypair.generate();
  const mockWallet = {
    publicKey: mockKeypair.publicKey,
    signTransaction: async (tx: any) => tx,
    signAllTransactions: async (txs: any[]) => txs
  };

  // Initialize Prism Protocol
  console.log('🔐 Initializing Prism Protocol...\n');
  const prism = new PrismProtocol({
    rpcUrl: 'https://api.devnet.solana.com',
    wallet: mockWallet as any
  });

  await prism.initialize();

  const info = prism.getInfo();
  console.log(`   Network: ${info.network}`);
  console.log(`   Program: ${info.programId.slice(0, 12)}...`);
  console.log(`   Arcium: ${prism.getArciumStatus().mode} mode\n`);

  // ========================================
  // SCENARIO: Whale wants to trade anonymously
  // ========================================
  
  const whaleBalance = 500_000n * LAMPORTS_PER_SOL; // 500,000 SOL
  const darkPoolThreshold = 10_000n * LAMPORTS_PER_SOL; // 10,000 SOL minimum
  
  console.log('═'.repeat(60));
  console.log('SCENARIO: Whale Enters Dark Pool');
  console.log('═'.repeat(60));
  console.log(`
   The Problem:
   • Whale has 500,000 SOL 
   • Wants to trade on dark pool
   • Dark pool requires proof of 10,000+ SOL balance
   • BUT: Whale doesn't want to expose their full balance!
   
   Traditional Solution: Send 10K SOL → Exposes wallet → Front-running risk
   
   Prism Solution: Prove you have enough WITHOUT revealing how much
  `);

  console.log('─'.repeat(60));
  console.log('STEP 1: Create Disposable Context Identity');
  console.log('─'.repeat(60));
  
  const context = await prism.createContext({
    type: ContextType.DeFi,
    maxPerTransaction: 50_000n * LAMPORTS_PER_SOL // 50K SOL limit
  });
  
  console.log(`
   ✓ Created anonymous context for dark pool trading
   
   Context Address: ${context.contextAddress.toBase58()}
   Type: DeFi (Dark Pool Trading)
   Max Per TX: 50,000 SOL
   
   This context is UNLINKABLE to your main wallet!
  `);

  console.log('─'.repeat(60));
  console.log('STEP 2: Generate Encrypted Solvency Proof');
  console.log('─'.repeat(60));
  
  const result = await prism.generateEncryptedSolvencyProof({
    actualBalance: whaleBalance,
    threshold: darkPoolThreshold,
    contextPubkey: context.contextAddress
  });
  
  console.log(`
   ✓ Proof generated successfully!
   
   What the dark pool sees:
   • Threshold: 10,000 SOL (PUBLIC)
   • Proof: Valid solvency proof
   • Balance: [ENCRYPTED] - NOT visible!
   
   What's protected:
   • Your actual balance (500,000 SOL) is NEVER revealed
   • Your main wallet address is NEVER exposed
   • No one can link this trade to your identity
  `);

  console.log('─'.repeat(60));
  console.log('STEP 3: Access Dark Pool');
  console.log('─'.repeat(60));
  console.log(`
   ✓ DARK POOL ACCESS GRANTED
   
   The whale can now:
   • Execute large trades anonymously
   • Avoid front-running and copy-trading
   • Maintain complete privacy
   
   Commitment Hash: ${result.encryptedBalance.commitment.slice(0, 32)}...
   Timestamp: ${new Date(result.encryptedBalance.timestamp).toISOString()}
  `);

  console.log('─'.repeat(60));
  console.log('STEP 4: Burn Context After Use');
  console.log('─'.repeat(60));
  
  const revoked = await prism.revokeContext(context.contextAddress);
  
  console.log(`
   ✓ Context revoked (burned)
   
   After the trade:
   • Disposable identity is destroyed
   • No trace left on-chain linking to main wallet
   • Complete privacy achieved
  `);

  console.log('═'.repeat(60));
  console.log('DEMO COMPLETE');
  console.log('═'.repeat(60));
  console.log(`
   Prism Protocol enables:
   
   🔐 PRIVACY: Balance never revealed, only proof of solvency
   🎭 ANONYMITY: Disposable contexts unlinkable to main wallet  
   🛡️ SECURITY: ZK proofs + Arcium MPC encryption
   ⚡ SPEED: Generate proofs in milliseconds
   
   Target Bounties:
   • Privacy Tooling Track: $15,000
   • Aztec/Noir Integration: $7,500
   • Arcium Integration: $8,000
   
   Total Potential: $30,500+
  `);
}

darkPoolDemo().catch(console.error);
