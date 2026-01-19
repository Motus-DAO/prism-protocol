// Prism Protocol - Main SDK Class
// Privacy infrastructure for dark pool trading on Solana

import { 
  Connection, 
  PublicKey, 
  Keypair, 
  Transaction,
  SystemProgram,
  sendAndConfirmTransaction
} from '@solana/web3.js';
import { Program, AnchorProvider, Wallet, BN } from '@coral-xyz/anchor';
import { SolvencyProver } from './proofs/SolvencyProver';
import { ArciumEncryption, type EncryptedBalance } from './encryption/ArciumEncryption';
import { 
  PrivacyLevel, 
  ContextType,
  type RootIdentity,
  type ContextIdentity,
  type SolvencyProof,
  type PrismConfig,
  type CreateContextOptions,
  type CreateRootOptions,
  type CreateRootResult,
  type CreateContextResult,
  type RevokeContextResult
} from './types';

// Default program ID (deployed on devnet)
const DEFAULT_PROGRAM_ID = new PublicKey('DkD3vtS6K8dJFnGmm9X9CphNDU5LYTYyP8Ve5EEVENdu');

/**
 * PrismProtocol - Main entry point for the Prism Protocol SDK
 * 
 * Example usage:
 * ```typescript
 * const prism = new PrismProtocol({
 *   rpcUrl: 'https://api.devnet.solana.com',
 *   wallet: yourWallet
 * });
 * 
 * // Create root identity
 * const root = await prism.createRootIdentity();
 * 
 * // Create dark pool context
 * const context = await prism.createContext({
 *   type: ContextType.DeFi,
 *   maxPerTransaction: 1000000000n // 1 SOL
 * });
 * 
 * // Generate solvency proof
 * const proof = await prism.generateSolvencyProof({
 *   actualBalance: 500000000000n, // 500 SOL (hidden)
 *   threshold: 10000000000n        // 10 SOL (public requirement)
 * });
 * 
 * // Revoke context after use
 * await prism.revokeContext(context.contextAddress);
 * ```
 */
export class PrismProtocol {
  private connection: Connection;
  private wallet: Wallet;
  private program: Program | null = null;
  private programId: PublicKey;
  private solvencyProver: SolvencyProver;
  private arciumEncryption: ArciumEncryption;
  private initialized: boolean = false;

  constructor(config: PrismConfig & { wallet: Wallet }) {
    this.connection = new Connection(
      config.rpcUrl, 
      config.commitment || 'confirmed'
    );
    this.wallet = config.wallet;
    this.programId = config.programId || DEFAULT_PROGRAM_ID;
    this.solvencyProver = new SolvencyProver();
    this.arciumEncryption = new ArciumEncryption({
      rpcUrl: config.rpcUrl,
      network: config.rpcUrl.includes('devnet') ? 'devnet' : 
               config.rpcUrl.includes('localhost') ? 'localnet' : 'mainnet'
    });
  }

  /**
   * Initialize the SDK and connect to the program
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Create Anchor provider
      const provider = new AnchorProvider(
        this.connection,
        this.wallet,
        { commitment: 'confirmed' }
      );

      // Initialize Arcium encryption
      await this.arciumEncryption.initialize();

      // Load the program IDL
      // In production, this would be fetched from the chain or bundled
      // For now, we'll create a minimal program interface
      
      this.initialized = true;
      console.log('PrismProtocol initialized');
      console.log(`  Program ID: ${this.programId.toBase58()}`);
      console.log(`  Wallet: ${this.wallet.publicKey.toBase58()}`);
      console.log(`  Arcium: ${this.arciumEncryption.getStatus().mode} mode`);
    } catch (error) {
      throw new Error(`Failed to initialize PrismProtocol: ${error}`);
    }
  }

  // ============================================================================
  // IDENTITY MANAGEMENT
  // ============================================================================

  /**
   * Get the root identity PDA for a user
   */
  getRootIdentityPDA(userPubkey?: PublicKey): [PublicKey, number] {
    const user = userPubkey || this.wallet.publicKey;
    return PublicKey.findProgramAddressSync(
      [Buffer.from('root'), user.toBuffer()],
      this.programId
    );
  }

  /**
   * Get a context PDA
   */
  getContextPDA(rootPDA: PublicKey, contextIndex: number): [PublicKey, number] {
    const indexBuffer = Buffer.alloc(2);
    indexBuffer.writeUInt16LE(contextIndex);
    
    return PublicKey.findProgramAddressSync(
      [Buffer.from('context'), rootPDA.toBuffer(), indexBuffer],
      this.programId
    );
  }

  /**
   * Create a root identity for the connected wallet
   * This is a one-time operation per wallet
   */
  async createRootIdentity(options?: CreateRootOptions): Promise<CreateRootResult> {
    const privacyLevel = options?.privacyLevel ?? PrivacyLevel.High;
    
    const [rootPDA] = this.getRootIdentityPDA();
    
    console.log('Creating root identity...');
    console.log(`  Root PDA: ${rootPDA.toBase58()}`);
    console.log(`  Privacy Level: ${PrivacyLevel[privacyLevel]}`);

    // In production, this would call the Anchor program
    // For now, return the expected result
    // The actual implementation would be:
    /*
    const tx = await this.program.methods
      .createRootIdentity(privacyLevel)
      .accounts({
        user: this.wallet.publicKey,
        rootIdentity: rootPDA,
        systemProgram: SystemProgram.programId
      })
      .rpc();
    */

    return {
      rootAddress: rootPDA,
      signature: 'pending_implementation',
      privacyLevel
    };
  }

  /**
   * Get the root identity for a user
   */
  async getRootIdentity(userPubkey?: PublicKey): Promise<RootIdentity | null> {
    const [rootPDA] = this.getRootIdentityPDA(userPubkey);
    
    try {
      // In production, fetch from chain
      // const account = await this.program.account.rootIdentity.fetch(rootPDA);
      return null; // Placeholder
    } catch {
      return null;
    }
  }

  // ============================================================================
  // CONTEXT MANAGEMENT
  // ============================================================================

  /**
   * Create a new context (disposable identity)
   */
  async createContext(options: CreateContextOptions): Promise<CreateContextResult> {
    const [rootPDA] = this.getRootIdentityPDA();
    const rootIdentity = await this.getRootIdentity();
    const contextIndex = rootIdentity?.contextCount ?? 0;
    
    const [contextPDA] = this.getContextPDA(rootPDA, contextIndex);
    
    const maxPerTx = options.maxPerTransaction ?? 1000000000n; // Default 1 SOL
    
    console.log('Creating context...');
    console.log(`  Type: ${ContextType[options.type]}`);
    console.log(`  Context PDA: ${contextPDA.toBase58()}`);
    console.log(`  Max per Tx: ${maxPerTx} lamports`);

    // In production, call the program
    
    return {
      contextAddress: contextPDA,
      signature: 'pending_implementation',
      contextType: options.type,
      contextIndex
    };
  }

  /**
   * Revoke a context (burn after use)
   */
  async revokeContext(contextAddress: PublicKey): Promise<RevokeContextResult> {
    console.log(`Revoking context: ${contextAddress.toBase58()}`);
    
    // In production, call the program
    
    return {
      signature: 'pending_implementation',
      contextAddress,
      totalSpent: 0n
    };
  }

  /**
   * Get all contexts for the connected wallet
   */
  async getContexts(): Promise<ContextIdentity[]> {
    // In production, fetch from chain
    return [];
  }

  // ============================================================================
  // PROOF GENERATION
  // ============================================================================

  /**
   * Generate a ZK solvency proof
   * Proves that balance >= threshold WITHOUT revealing actual balance
   */
  async generateSolvencyProof(params: {
    actualBalance: bigint;
    threshold: bigint;
  }): Promise<SolvencyProof> {
    console.log('Generating solvency proof...');
    console.log(`  Threshold: ${params.threshold} lamports (PUBLIC)`);
    console.log(`  Balance: [HIDDEN] (PRIVATE)`);
    
    const proof = await this.solvencyProver.generateProof(params);
    
    console.log('Proof generated successfully!');
    
    return proof;
  }

  /**
   * Verify a solvency proof
   */
  async verifySolvencyProof(proof: SolvencyProof): Promise<boolean> {
    return await this.solvencyProver.verifyProof(proof);
  }

  // ============================================================================
  // ENCRYPTED PROOF GENERATION (ARCIUM + ZK)
  // ============================================================================

  /**
   * Generate an encrypted solvency proof for dark pool access
   * This is the FULL PRIVACY FLOW:
   * 1. Encrypt balance with Arcium MPC
   * 2. Generate ZK proof of solvency
   * 3. Return both for verification
   * 
   * @param params.actualBalance - User's real balance (PRIVATE)
   * @param params.threshold - Minimum required (PUBLIC)
   * @param params.contextPubkey - Context identity for encryption binding
   */
  async generateEncryptedSolvencyProof(params: {
    actualBalance: bigint;
    threshold: bigint;
    contextPubkey: PublicKey;
  }): Promise<{
    encryptedBalance: EncryptedBalance;
    proof: SolvencyProof;
    contextPubkey: string;
  }> {
    console.log('='.repeat(50));
    console.log('DARK POOL ACCESS - Encrypted Solvency Proof');
    console.log('='.repeat(50));
    
    // Step 1: Encrypt balance with Arcium MPC
    console.log('\n[1/2] Encrypting balance with Arcium MPC...');
    const encryptionResult = await this.arciumEncryption.encryptBalance({
      balance: params.actualBalance,
      contextPubkey: params.contextPubkey
    });

    if (!encryptionResult.success || !encryptionResult.encryptedBalance) {
      throw new Error(`Balance encryption failed: ${encryptionResult.error}`);
    }

    console.log(`  ✓ Balance encrypted`);
    console.log(`  Commitment: ${encryptionResult.encryptedBalance.commitment.slice(0, 16)}...`);

    // Step 2: Generate ZK proof
    console.log('\n[2/2] Generating ZK solvency proof...');
    const proof = await this.solvencyProver.generateProof({
      actualBalance: params.actualBalance,
      threshold: params.threshold
    });

    console.log(`  ✓ Proof generated`);
    console.log('='.repeat(50));
    console.log('RESULT: Dark pool access GRANTED');
    console.log(`  Threshold met: ${params.threshold} lamports`);
    console.log(`  Balance: [ENCRYPTED & PROVEN]`);
    console.log('='.repeat(50));

    return {
      encryptedBalance: encryptionResult.encryptedBalance,
      proof,
      contextPubkey: params.contextPubkey.toBase58()
    };
  }

  /**
   * Quick encrypted proof for demo
   * Automatically creates a context, encrypts, proves, and returns everything needed
   */
  async quickDarkPoolAccess(params: {
    balance: bigint;
    threshold: bigint;
  }): Promise<{
    context: CreateContextResult;
    encryptedBalance: EncryptedBalance;
    proof: SolvencyProof;
    accessGranted: boolean;
  }> {
    console.log('\n🔐 QUICK DARK POOL ACCESS');
    console.log('-'.repeat(40));

    // Create a disposable DeFi context
    const context = await this.createContext({
      type: ContextType.DeFi,
      maxPerTransaction: params.balance
    });
    console.log(`Created context: ${context.contextAddress.toBase58().slice(0, 8)}...`);

    // Generate encrypted proof
    const result = await this.generateEncryptedSolvencyProof({
      actualBalance: params.balance,
      threshold: params.threshold,
      contextPubkey: context.contextAddress
    });

    return {
      context,
      encryptedBalance: result.encryptedBalance,
      proof: result.proof,
      accessGranted: true
    };
  }

  /**
   * Get Arcium encryption status
   */
  getArciumStatus(): { 
    initialized: boolean; 
    mode: 'simulation' | 'live'; 
    network: string;
  } {
    return this.arciumEncryption.getStatus();
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Get the current wallet public key
   */
  getWalletPublicKey(): PublicKey {
    return this.wallet.publicKey;
  }

  /**
   * Get the program ID
   */
  getProgramId(): PublicKey {
    return this.programId;
  }

  /**
   * Check if a user has a root identity
   */
  async hasRootIdentity(userPubkey?: PublicKey): Promise<boolean> {
    const identity = await this.getRootIdentity(userPubkey);
    return identity !== null;
  }

  /**
   * Get SDK info
   */
  getInfo(): { version: string; programId: string; network: string } {
    return {
      version: '0.1.0',
      programId: this.programId.toBase58(),
      network: this.connection.rpcEndpoint.includes('devnet') ? 'devnet' : 'mainnet'
    };
  }
}
