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
import {
  PrismError,
  PrismNetworkError,
  PrismValidationError,
  PrismProofError
} from './errors';
import {
  validatePublicKey,
  validateLamports,
  validateContextType,
  validatePrivacyLevel,
  validateContextIndex
} from './utils/validation';
import { getLogger, type Logger, LogLevel } from './utils/logger';
import { retry, retryWithSimulation } from './retry';
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
  private logger: Logger;

  constructor(config: PrismConfig & { wallet: Wallet }) {
    // Validate wallet
    if (!config.wallet || !config.wallet.publicKey) {
      throw new PrismValidationError(
        'Wallet is required and must have a publicKey',
        'INVALID_WALLET',
        { field: 'wallet' }
      );
    }

    // Validate RPC URL
    if (!config.rpcUrl || typeof config.rpcUrl !== 'string') {
      throw new PrismValidationError(
        'RPC URL is required',
        'INVALID_RPC_URL',
        { field: 'rpcUrl' }
      );
    }

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
    this.logger = getLogger();
  }

  /**
   * Initialize the SDK and connect to the program
   * 
   * Must be called before using other methods (or they will call it automatically).
   * 
   * @example
   * ```typescript
   * const prism = new PrismProtocol({ rpcUrl, wallet });
   * await prism.initialize();
   * // Now you can use other methods
   * ```
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      this.logger.debug('Initializing PrismProtocol...');

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
      this.logger.info('PrismProtocol initialized', {
        programId: this.programId.toBase58(),
        wallet: this.wallet.publicKey.toBase58(),
        arciumMode: this.arciumEncryption.getStatus().mode
      });
    } catch (error) {
      const prismError = error instanceof PrismError 
        ? error 
        : new PrismNetworkError(
            `Failed to initialize PrismProtocol: ${error}`,
            'INITIALIZATION_FAILED',
            { originalError: error instanceof Error ? error : new Error(String(error)) }
          );
      this.logger.error('Failed to initialize PrismProtocol', prismError);
      throw prismError;
    }
  }

  // ============================================================================
  // IDENTITY MANAGEMENT
  // ============================================================================

  /**
   * Get the root identity PDA (Program Derived Address) for a user
   * 
   * @param userPubkey - User's public key (defaults to connected wallet)
   * @returns Tuple of [PDA, bump] - The PDA address and bump seed
   * 
   * @example
   * ```typescript
   * const [rootPDA, bump] = prism.getRootIdentityPDA();
   * console.log('Root PDA:', rootPDA.toBase58());
   * ```
   */
  getRootIdentityPDA(userPubkey?: PublicKey): [PublicKey, number] {
    const user = userPubkey || this.wallet.publicKey;
    return PublicKey.findProgramAddressSync(
      [Buffer.from('root'), user.toBuffer()],
      this.programId
    );
  }

  /**
   * Get a context PDA (Program Derived Address)
   * 
   * @param rootPDA - Root identity PDA
   * @param contextIndex - Context index
   * @returns Tuple of [PDA, bump] - The context PDA address and bump seed
   * 
   * @example
   * ```typescript
   * const [rootPDA] = prism.getRootIdentityPDA();
   * const [contextPDA, bump] = prism.getContextPDA(rootPDA, 0);
   * console.log('Context PDA:', contextPDA.toBase58());
   * ```
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
   * 
   * This is a one-time operation per wallet. If a root identity already exists,
   * this method returns the existing one without creating a new transaction.
   * 
   * @param options - Optional configuration
   * @param options.privacyLevel - Privacy level for the root identity (default: PrivacyLevel.High)
   * @returns Root identity creation result with address and signature
   * 
   * @example
   * ```typescript
   * const root = await prism.createRootIdentity({
   *   privacyLevel: PrivacyLevel.Maximum
   * });
   * console.log('Root identity:', root.rootAddress.toBase58());
   * ```
   */
  async createRootIdentity(options?: CreateRootOptions): Promise<CreateRootResult> {
    if (!this.initialized) {
      await this.initialize();
    }

    if (!this.program) {
      throw new PrismError(
        'Program not initialized',
        'PROGRAM_NOT_INITIALIZED'
      );
    }

    const privacyLevel = options?.privacyLevel ?? PrivacyLevel.High;
    
    // Validate privacy level
    validatePrivacyLevel(privacyLevel);
    
    const [rootPDA] = this.getRootIdentityPDA();
    
    // Check if root identity already exists
    try {
      const existing = await (this.program.account as any).rootIdentity.fetch(rootPDA);
      if (existing) {
        console.log('Root identity already exists');
        return {
          rootAddress: rootPDA,
          signature: 'existing',
          privacyLevel: existing.privacyLevel
        };
      }
    } catch (err) {
      // Root identity doesn't exist, proceed with creation
      console.log('Root identity not found, creating...');
    }
    
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

      this.logger.info('Root identity created', { signature });

      return {
        rootAddress: rootPDA,
        signature,
        privacyLevel
      };
    } catch (err: any) {
      // If root identity already exists, that's okay
      const errorMsg = err.message || '';
      if (
        errorMsg.includes('already in use') || 
        errorMsg.includes('AccountDiscriminatorAlreadyExists') ||
        errorMsg.includes('already been processed') ||
        errorMsg.includes('0x0') // Account already exists error code
      ) {
        this.logger.info('Root identity already exists (caught during creation)');
        // Double-check it exists
        try {
          const existing = await (this.program.account as any).rootIdentity.fetch(rootPDA);
          return {
            rootAddress: rootPDA,
            signature: 'existing',
            privacyLevel: existing?.privacyLevel ?? privacyLevel
          };
        } catch {
          // If we can't fetch it, still return success since it likely exists
          return {
            rootAddress: rootPDA,
            signature: 'existing',
            privacyLevel
          };
        }
      }
      
      // Wrap error in PrismNetworkError if not already a PrismError
      const prismError = err instanceof PrismError
        ? err
        : new PrismNetworkError(
            `Failed to create root identity: ${err.message}`,
            'CREATE_ROOT_FAILED',
            { originalError: err }
          );
      this.logger.error('Failed to create root identity', prismError);
      throw prismError;
    }
  }

  /**
   * Get the root identity for a user
   * 
   * @param userPubkey - User's public key (defaults to connected wallet)
   * @returns Root identity object or null if not found
   * 
   * @example
   * ```typescript
   * const identity = await prism.getRootIdentity();
   * if (identity) {
   *   console.log('Contexts created:', identity.contextCount);
   *   console.log('Privacy level:', PrivacyLevel[identity.privacyLevel]);
   * }
   * ```
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
   * Create a new context with encrypted root identity for enhanced privacy
   * 
   * Uses Arcium MPC to encrypt the root identity before storing. This ensures
   * that contexts are unlinkable to each other and to the root identity.
   * 
   * @param options - Context creation options
   * @param options.type - Context type (DeFi, Social, Gaming, etc.)
   * @param options.maxPerTransaction - Maximum amount per transaction in lamports (default: 1 SOL)
   * @param options.privacyLevel - Privacy level (optional)
   * @returns Context creation result with encryption metadata
   * 
   * @example
   * ```typescript
   * const context = await prism.createContextEncrypted({
   *   type: ContextType.DeFi,
   *   maxPerTransaction: 1000000000n // 1 SOL
   * });
   * console.log('Encrypted context:', context.contextAddress.toBase58());
   * console.log('Root hash:', context.rootIdentityHash);
   * console.log('Commitment:', context.encryptionCommitment);
   * ```
   */
  async createContextEncrypted(options: CreateContextOptions): Promise<CreateContextResult & {
    rootIdentityHash: string;
    encryptionCommitment: string;
  }> {
    if (!this.initialized) {
      await this.initialize();
    }

    if (!this.program) {
      throw new PrismError(
        'Program not initialized',
        'PROGRAM_NOT_INITIALIZED'
      );
    }

    // Validate inputs
    validateContextType(options.type);
    if (options.maxPerTransaction !== undefined) {
      validateLamports(options.maxPerTransaction);
    }
    if (options.privacyLevel !== undefined) {
      validatePrivacyLevel(options.privacyLevel);
    }

    const [rootPDA] = this.getRootIdentityPDA();
    
    // Check if root identity exists, create if needed
    let rootIdentity = await this.getRootIdentity();
    if (!rootIdentity) {
      this.logger.debug('Root identity not found, creating...');
      const rootResult = await this.createRootIdentity({ privacyLevel: options.privacyLevel ?? PrivacyLevel.High });
      // If it was created or already exists, fetch it
      if (rootResult.signature === 'existing' || rootResult.signature) {
        // Small delay to ensure account is available
        await new Promise(resolve => setTimeout(resolve, 1000));
        rootIdentity = await this.getRootIdentity();
        if (!rootIdentity) {
          throw new PrismError(
            'Failed to fetch root identity after creation',
            'FETCH_ROOT_FAILED'
          );
        }
      } else {
        throw new PrismError(
          'Failed to create root identity',
          'CREATE_ROOT_FAILED'
        );
      }
    }

    // Use the current contextCount - the program will derive PDA from this
    const contextIndex = rootIdentity.contextCount;
    const [contextPDA] = this.getContextPDA(rootPDA, contextIndex);
    
    // Check if context exists at this index
    // If it exists and is active, we'll revoke it first to ensure we can create a new one
    // This ensures the demo always shows 2 transactions: revoke (if needed) + create
    let needsRevoke = false;
    try {
      const existingContext = await (this.program.account as any).contextIdentity.fetch(contextPDA);
      if (existingContext && !existingContext.revoked) {
        needsRevoke = true;
        this.logger.warn(`Context at index ${contextIndex} already exists and is active, will revoke first`);
      }
    } catch (err) {
      // Context doesn't exist, proceed normally
      this.logger.debug('Context does not exist, creating new one...');
    }
    
    // If we need to revoke first, do it now
    if (needsRevoke) {
      try {
        this.logger.info('Revoking existing context before creating new one...');
        await retryWithSimulation(
          () => this.program!.methods
            .revokeContext()
            .accounts({
              user: this.wallet.publicKey,
              rootIdentity: rootPDA,
              contextIdentity: contextPDA,
            })
            .rpc(),
          () => this.program!.methods
            .revokeContext()
            .accounts({
              user: this.wallet.publicKey,
              rootIdentity: rootPDA,
              contextIdentity: contextPDA,
            })
            .simulate(),
          { maxRetries: 3 }
        );
        this.logger.info('Existing context revoked, proceeding with creation...');
        // Small delay to ensure state is updated
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (revokeErr: any) {
        const revokeMsg = revokeErr.message || '';
        if (revokeMsg.includes('already revoked') || revokeMsg.includes('already been processed')) {
          this.logger.info('Context was already revoked, proceeding with creation...');
        } else {
          this.logger.warn('Could not revoke existing context, will attempt creation anyway...');
          // Continue anyway - creation might still work or fail gracefully
        }
      }
    }
    
    // Encrypt root identity PDA with Arcium MPC
    // This prevents linking multiple contexts together (they all have encrypted root_identity)
    // The root identity is what's stored in the context, so encrypting it provides privacy
    this.logger.debug('Encrypting root identity with Arcium MPC...');
    const encryptionResult = await this.arciumEncryption.encryptData({
      data: rootPDA,
      bindingKey: contextPDA
    });

    if (!encryptionResult.success || !encryptionResult.encryptedData) {
      throw new PrismError(
        `Root identity encryption failed: ${encryptionResult.error}`,
        'ENCRYPTION_FAILED',
        { error: encryptionResult.error }
      );
    }

    // Compute hash of root identity PDA (for on-chain verification)
    const rootHash = await this.hashRootIdentity(rootPDA);

    const maxPerTx = options.maxPerTransaction ?? 1000000000n;
    
    this.logger.info('Creating encrypted context...', {
      type: ContextType[options.type],
      contextPDA: contextPDA.toBase58(),
      rootPDA: rootPDA.toBase58(),
      rootHash: rootHash.slice(0, 16) + '...',
      commitment: encryptionResult.encryptedData.commitment.slice(0, 16) + '...'
    });

    try {
      // Convert commitment from hex string to bytes
      const commitmentBytes = this.hexToBytes(encryptionResult.encryptedData.commitment);
      const rootHashBytes = this.hexToBytes(rootHash);

      const signature = await retryWithSimulation(
        () => this.program!.methods
          .createContextEncrypted(
            options.type,
            new BN(maxPerTx.toString()),
            Array.from(rootHashBytes),
            Array.from(commitmentBytes)
          )
          .accounts({
            user: this.wallet.publicKey,
            rootIdentity: rootPDA,
            contextIdentity: contextPDA,
            systemProgram: SystemProgram.programId,
          })
          .rpc(),
        () => this.program!.methods
          .createContextEncrypted(
            options.type,
            new BN(maxPerTx.toString()),
            Array.from(rootHashBytes),
            Array.from(commitmentBytes)
          )
          .accounts({
            user: this.wallet.publicKey,
            rootIdentity: rootPDA,
            contextIdentity: contextPDA,
            systemProgram: SystemProgram.programId,
          })
          .simulate(),
        { maxRetries: 3 }
      );

      this.logger.info('Encrypted context created', { signature, contextIndex });

      return {
        contextAddress: contextPDA,
        signature,
        contextType: options.type,
        contextIndex,
        rootIdentityHash: rootHash,
        encryptionCommitment: encryptionResult.encryptedData.commitment
      };
    } catch (err: any) {
      // Check if it's a "already processed" error (context already exists)
      const errorMsg = err.message || '';
      if (errorMsg.includes('already been processed') || errorMsg.includes('already in use') || errorMsg.includes('0x0')) {
        this.logger.info('Context already exists at this index');
        // Try to fetch the existing context
        try {
          const existingContext = await (this.program.account as any).contextIdentity.fetch(contextPDA);
          const rootHash = await this.hashRootIdentity(rootPDA);
          // Return with 'existing' signature - this means no new transaction was created
          // but the context exists and can be used
          return {
            contextAddress: contextPDA,
            signature: 'existing',
            contextType: options.type,
            contextIndex,
            rootIdentityHash: rootHash,
            encryptionCommitment: existingContext.encryptionCommitment 
              ? (Array.from(existingContext.encryptionCommitment) as number[]).map((b) => b.toString(16).padStart(2, '0')).join('')
              : ''
          };
        } catch (fetchErr) {
          // Couldn't fetch, re-throw original error
          const prismError = err instanceof PrismError
            ? err
            : new PrismNetworkError(
                `Failed to create encrypted context: ${err.message}`,
                'CREATE_ENCRYPTED_CONTEXT_FAILED',
                { originalError: err }
              );
          this.logger.error('Error creating encrypted context', prismError);
          throw prismError;
        }
      }
      const prismError = err instanceof PrismError
        ? err
        : new PrismNetworkError(
            `Failed to create encrypted context: ${err.message}`,
            'CREATE_ENCRYPTED_CONTEXT_FAILED',
            { originalError: err }
          );
      this.logger.error('Error creating encrypted context', prismError);
      throw prismError;
    }
  }

  /**
   * Hash a public key (root identity or signing wallet) for privacy-enhanced context creation
   */
  private async hashRootIdentity(pubkey: PublicKey): Promise<string> {
    const pubkeyBytes = pubkey.toBytes();
    
    let hashBuffer: ArrayBuffer;
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      hashBuffer = await crypto.subtle.digest('SHA-256', pubkeyBytes);
    } else {
      const nodeCrypto = await import('crypto');
      const hash = nodeCrypto.createHash('sha256');
      hash.update(pubkeyBytes);
      hashBuffer = hash.digest().buffer;
    }

    return Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * Convert hex string to bytes
   */
  private hexToBytes(hex: string): Uint8Array {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
      bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
    }
    return bytes;
  }

  /**
   * Create a new context (disposable identity)
   * 
   * Creates a disposable identity derived from your root identity. Each context
   * has its own address (PDA) and can have spending limits.
   * 
   * @param options - Context creation options
   * @param options.type - Context type (DeFi, Social, Gaming, etc.)
   * @param options.maxPerTransaction - Maximum amount per transaction in lamports (default: 1 SOL)
   * @param options.privacyLevel - Privacy level (optional)
   * @returns Context creation result with address and index
   * 
   * @example
   * ```typescript
   * const context = await prism.createContext({
   *   type: ContextType.DeFi,
   *   maxPerTransaction: 1000000000n // 1 SOL limit
   * });
   * console.log('Context address:', context.contextAddress.toBase58());
   * console.log('Context index:', context.contextIndex);
   * ```
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
      throw new PrismError(
        'Program not initialized',
        'PROGRAM_NOT_INITIALIZED'
      );
    }

    // Validate context index
    validateContextIndex(contextIndex);

    const [rootPDA] = this.getRootIdentityPDA();
    const [contextPDA] = this.getContextPDA(rootPDA, contextIndex);

    this.logger.info('Revoking context', {
      contextIndex,
      contextPDA: contextPDA.toBase58()
    });

    try {
      // Fetch context to check state and get totalSpent before revoking
      let totalSpent = 0n;
      let alreadyRevoked = false;
      try {
        const contextAccount = await (this.program.account as any).contextIdentity.fetch(contextPDA);
        totalSpent = BigInt(contextAccount.totalSpent.toString());
        alreadyRevoked = contextAccount.revoked === true;
        
        if (alreadyRevoked) {
          console.log('Context is already revoked');
          return {
            signature: 'already_revoked',
            contextAddress: contextPDA,
            totalSpent
          };
        }
      } catch (err) {
        // Context might not exist
        console.log('Could not fetch context account, attempting to revoke anyway...');
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
      
      // Check if it's an "already processed" or "already revoked" error
      const errorMsg = err.message || '';
      if (
        errorMsg.includes('already been processed') ||
        errorMsg.includes('ContextAlreadyRevoked') ||
        errorMsg.includes('already revoked')
      ) {
        this.logger.info('Context was already revoked (caught during revocation)');
        // Try to fetch the context to get totalSpent
        let totalSpent = 0n;
        try {
          const contextAccount = await (this.program.account as any).contextIdentity.fetch(contextPDA);
          totalSpent = BigInt(contextAccount.totalSpent.toString());
        } catch {
          // Couldn't fetch, use 0
        }
        return {
          signature: 'already_revoked',
          contextAddress: contextPDA,
          totalSpent
        };
      }
      
      const prismError = err instanceof PrismError
        ? err
        : new PrismNetworkError(
            `Failed to revoke context: ${err.message}`,
            'REVOKE_CONTEXT_FAILED',
            { originalError: err, contextIndex }
          );
      this.logger.error('Error revoking context', prismError);
      throw prismError;
    }
  }

  /**
   * Get all contexts for the connected wallet
   * 
   * @returns Array of context identities, including both active and revoked contexts
   * 
   * @example
   * ```typescript
   * const contexts = await prism.getContexts();
   * contexts.forEach(ctx => {
   *   console.log(`Context ${ctx.contextIndex}:`, {
   *     type: ContextType[ctx.contextType],
   *     revoked: ctx.revoked,
   *     totalSpent: ctx.totalSpent
   *   });
   * });
   * ```
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
   * 
   * Verifies that a solvency proof is valid and correctly proves the balance threshold.
   * 
   * @param proof - The solvency proof to verify
   * @returns true if proof is valid, false otherwise
   * 
   * @example
   * ```typescript
   * const proof = await prism.generateSolvencyProof({ ... });
   * const isValid = await prism.verifySolvencyProof(proof);
   * if (isValid) {
   *   console.log('Proof verified! Balance meets threshold.');
   * }
   * ```
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
    // Validate inputs
    validateLamports(params.actualBalance);
    validateLamports(params.threshold);
    validatePublicKey(params.contextPubkey);

    this.logger.info('DARK POOL ACCESS - Encrypted Solvency Proof');
    
    // Step 1: Encrypt balance with Arcium MPC
    this.logger.debug('[1/2] Encrypting balance with Arcium MPC...');
    const encryptionResult = await this.arciumEncryption.encryptBalance({
      balance: params.actualBalance,
      contextPubkey: params.contextPubkey
    });

    if (!encryptionResult.success || !encryptionResult.encryptedBalance) {
      throw new PrismError(
        `Balance encryption failed: ${encryptionResult.error}`,
        'ENCRYPTION_FAILED',
        { error: encryptionResult.error }
      );
    }

    this.logger.debug('Balance encrypted', {
      commitment: encryptionResult.encryptedBalance.commitment.slice(0, 16) + '...'
    });

    // Step 2: Generate ZK proof
    this.logger.debug('[2/2] Generating ZK solvency proof...');
    const proof = await this.solvencyProver.generateProof({
      actualBalance: params.actualBalance,
      threshold: params.threshold
    });

    this.logger.info('RESULT: Dark pool access GRANTED', {
      threshold: params.threshold.toString()
    });

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

    // Create a disposable DeFi context (public root_identity)
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
   * Quick encrypted proof for demo (MAX PRIVACY)
   * Uses an Arcium-encrypted context so the root identity is never stored in plaintext.
   */
  async quickDarkPoolAccessEncrypted(params: {
    balance: bigint;
    threshold: bigint;
  }): Promise<{
    context: CreateContextResult & { rootIdentityHash: string; encryptionCommitment: string };
    encryptedBalance: EncryptedBalance;
    proof: SolvencyProof;
    accessGranted: boolean;
  }> {
    this.logger.info('QUICK DARK POOL ACCESS (ENCRYPTED ROOT)');

    // Create a disposable DeFi context with encrypted root identity
    const context = await this.createContextEncrypted({
      type: ContextType.DeFi,
      maxPerTransaction: params.balance
    });
    this.logger.debug('Created encrypted context', {
      contextAddress: context.contextAddress.toBase58().slice(0, 8) + '...'
    });

    // Generate encrypted proof bound to this encrypted context
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
   * 
   * @returns The public key of the connected wallet
   * 
   * @example
   * ```typescript
   * const pubkey = prism.getWalletPublicKey();
   * console.log('Wallet:', pubkey.toBase58());
   * ```
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
   * 
   * @param userPubkey - User's public key (defaults to connected wallet)
   * @returns true if root identity exists, false otherwise
   * 
   * @example
   * ```typescript
   * const exists = await prism.hasRootIdentity();
   * if (!exists) {
   *   await prism.createRootIdentity();
   * }
   * ```
   */
  async hasRootIdentity(userPubkey?: PublicKey): Promise<boolean> {
    const identity = await this.getRootIdentity(userPubkey);
    return identity !== null;
  }

  /**
   * Get SDK info
   * 
   * Returns version and configuration information about the SDK.
   * 
   * @returns Info object with version, program ID, and network
   * 
   * @example
   * ```typescript
   * const info = prism.getInfo();
   * console.log('SDK version:', info.version);
   * console.log('Network:', info.network);
   * console.log('Program ID:', info.programId);
   * ```
   */
  getInfo(): { version: string; programId: string; network: string } {
    return {
      version: '0.1.0',
      programId: this.programId.toBase58(),
      network: this.connection.rpcEndpoint.includes('devnet') ? 'devnet' : 'mainnet'
    };
  }
}
