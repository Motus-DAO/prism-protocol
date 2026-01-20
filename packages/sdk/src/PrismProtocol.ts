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
import { Program, AnchorProvider, Wallet, BN, Idl } from '@coral-xyz/anchor';
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
import IDL from './idl.json';

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
 * await prism.revokeContextByIndex(context.contextIndex);
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
        { commitment: 'confirmed', preflightCommitment: 'confirmed' }
      );

      // Initialize Arcium encryption
      await this.arciumEncryption.initialize();

      // Load the program IDL
      const idlWithAddress = {
        ...IDL,
        address: this.programId.toBase58()
      } as Idl;

      // Initialize the Anchor program
      this.program = new Program(idlWithAddress, provider);
      
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
    if (!this.initialized) {
      await this.initialize();
    }

    if (!this.program) {
      throw new Error('Program not initialized');
    }

    const privacyLevel = options?.privacyLevel ?? PrivacyLevel.High;
    const [rootPDA] = this.getRootIdentityPDA();
    
    console.log('Creating root identity...');
    console.log(`  Root PDA: ${rootPDA.toBase58()}`);
    console.log(`  Privacy Level: ${PrivacyLevel[privacyLevel]}`);

    try {
      const signature = await this.program.methods
        .createRootIdentity(privacyLevel)
        .accounts({
          user: this.wallet.publicKey,
          rootIdentity: rootPDA,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      console.log('Root identity created:', signature);

      return {
        rootAddress: rootPDA,
        signature,
        privacyLevel
      };
    } catch (err: any) {
      // If root identity already exists, that's okay
      if (err.message?.includes('already in use') || err.message?.includes('AccountDiscriminatorAlreadyExists')) {
        console.log('Root identity already exists');
        return {
          rootAddress: rootPDA,
          signature: 'existing',
          privacyLevel
        };
      }
      throw err;
    }
  }

  /**
   * Get the root identity for a user
   */
  async getRootIdentity(userPubkey?: PublicKey): Promise<RootIdentity | null> {
    if (!this.initialized) {
      await this.initialize();
    }

    if (!this.program) {
      return null;
    }

    const [rootPDA] = this.getRootIdentityPDA(userPubkey);
    
    try {
      const account = await (this.program.account as any).rootIdentity.fetch(rootPDA);
      
      return {
        owner: account.owner as PublicKey,
        createdAt: account.createdAt.toNumber(),
        privacyLevel: account.privacyLevel as PrivacyLevel,
        contextCount: account.contextCount,
        bump: account.bump
      };
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
    if (!this.initialized) {
      await this.initialize();
    }

    if (!this.program) {
      throw new Error('Program not initialized');
    }

    const [rootPDA] = this.getRootIdentityPDA();
    
    // Check if root identity exists, create if needed
    let rootIdentity = await this.getRootIdentity();
    if (!rootIdentity) {
      console.log('Root identity not found, creating...');
      await this.createRootIdentity({ privacyLevel: options.privacyLevel ?? PrivacyLevel.High });
      // Wait a bit for confirmation
      await new Promise(resolve => setTimeout(resolve, 2000));
      rootIdentity = await this.getRootIdentity();
      if (!rootIdentity) {
        throw new Error('Failed to create root identity');
      }
    }

    const contextIndex = rootIdentity.contextCount;
    const [contextPDA] = this.getContextPDA(rootPDA, contextIndex);
    
    const maxPerTx = options.maxPerTransaction ?? 1000000000n; // Default 1 SOL
    
    console.log('Creating context...');
    console.log(`  Type: ${ContextType[options.type]}`);
    console.log(`  Context PDA: ${contextPDA.toBase58()}`);
    console.log(`  Max per Tx: ${maxPerTx} lamports`);

    try {
      const signature = await this.program.methods
        .createContext(options.type, new BN(maxPerTx.toString()))
        .accounts({
          user: this.wallet.publicKey,
          rootIdentity: rootPDA,
          contextIdentity: contextPDA,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      console.log('Context created:', signature);

      return {
        contextAddress: contextPDA,
        signature,
        contextType: options.type,
        contextIndex
      };
    } catch (err: any) {
      console.error('Error creating context:', err);
      throw err;
    }
  }

  /**
   * Revoke a context (burn after use)
   * Note: This requires the contextIndex. For convenience, you can also use revokeContextByIndex.
   */
  async revokeContext(contextAddress: PublicKey): Promise<RevokeContextResult> {
    if (!this.initialized) {
      await this.initialize();
    }

    if (!this.program) {
      throw new Error('Program not initialized');
    }

    // We need to find the context index by fetching the context account
    // For now, we'll require the index to be passed via a helper method
    throw new Error('Use revokeContextByIndex(contextIndex) instead. Context address lookup not yet implemented.');
  }

  /**
   * Revoke a context by its index (burn after use)
   */
  async revokeContextByIndex(contextIndex: number): Promise<RevokeContextResult> {
    if (!this.initialized) {
      await this.initialize();
    }

    if (!this.program) {
      throw new Error('Program not initialized');
    }

    const [rootPDA] = this.getRootIdentityPDA();
    const [contextPDA] = this.getContextPDA(rootPDA, contextIndex);

    console.log(`Revoking context: ${contextPDA.toBase58()}`);

    try {
      // Fetch context to get totalSpent before revoking
      let totalSpent = 0n;
      try {
        const contextAccount = await (this.program.account as any).contextIdentity.fetch(contextPDA);
        totalSpent = BigInt(contextAccount.totalSpent.toString());
      } catch {
        // Context might not exist or already revoked
      }

      const signature = await this.program.methods
        .revokeContext()
        .accounts({
          user: this.wallet.publicKey,
          rootIdentity: rootPDA,
          contextIdentity: contextPDA,
        })
        .rpc();

      console.log('Context revoked:', signature);

      return {
        signature,
        contextAddress: contextPDA,
        totalSpent
      };
    } catch (err: any) {
      console.error('Error revoking context:', err);
      throw err;
    }
  }

  /**
   * Get all contexts for the connected wallet
   */
  async getContexts(): Promise<ContextIdentity[]> {
    if (!this.initialized) {
      await this.initialize();
    }

    if (!this.program) {
      return [];
    }

    const rootIdentity = await this.getRootIdentity();
    if (!rootIdentity) {
      return [];
    }

    const [rootPDA] = this.getRootIdentityPDA();
    const contexts: ContextIdentity[] = [];

    // Fetch all contexts by index
    for (let i = 0; i < rootIdentity.contextCount; i++) {
      try {
        const [contextPDA] = this.getContextPDA(rootPDA, i);
        const account = await (this.program.account as any).contextIdentity.fetch(contextPDA);
        
        contexts.push({
          rootIdentity: account.rootIdentity as PublicKey,
          contextType: account.contextType as ContextType,
          createdAt: account.createdAt.toNumber(),
          maxPerTransaction: BigInt(account.maxPerTransaction.toString()),
          totalSpent: BigInt(account.totalSpent.toString()),
          revoked: account.revoked,
          contextIndex: account.contextIndex,
          bump: account.bump
        });
      } catch {
        // Context might not exist or be revoked, skip it
        continue;
      }
    }

    return contexts;
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
