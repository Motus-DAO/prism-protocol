import { useCallback, useMemo, useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { 
  PublicKey, 
  SystemProgram, 
  LAMPORTS_PER_SOL
} from '@solana/web3.js';
import { Program, AnchorProvider, BN } from '@coral-xyz/anchor';
import IDL from './prism.json';

// Program ID - must match deployed program on devnet
const PROGRAM_ID = new PublicKey('DkD3vtS6K8dJFnGmm9X9CphNDU5LYTYyP8Ve5EEVENdu');

// Account types
export interface RootIdentity {
  owner: PublicKey;
  createdAt: BN;
  privacyLevel: number;
  contextCount: number;
  bump: number;
}

export interface ContextIdentity {
  rootIdentity: PublicKey;
  contextType: number;
  createdAt: BN;
  maxPerTransaction: BN;
  totalSpent: BN;
  revoked: boolean;
  contextIndex: number;
  bump: number;
}

export function usePrismProgram() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create Anchor provider and program
  const { provider, program } = useMemo(() => {
    if (!wallet.publicKey || !wallet.signTransaction) {
      return { provider: null, program: null };
    }
    
    const anchorProvider = new AnchorProvider(
      connection,
      wallet as any,
      { commitment: 'confirmed', preflightCommitment: 'confirmed' }
    );
    
    // Ensure IDL has correct address
    const idlWithAddress = {
      ...IDL,
      address: PROGRAM_ID.toBase58()
    };
    
    try {
      const anchorProgram = new Program(idlWithAddress as any, anchorProvider);
      console.log('Program initialized:', anchorProgram.programId.toBase58());
      return { provider: anchorProvider, program: anchorProgram };
    } catch (err) {
      console.error('Failed to initialize program:', err);
      return { provider: anchorProvider, program: null };
    }
  }, [connection, wallet]);

  // Derive Root Identity PDA
  const getRootPDA = useCallback((userPubkey?: PublicKey) => {
    const user = userPubkey || wallet.publicKey;
    if (!user) return null;
    
    const [pda, bump] = PublicKey.findProgramAddressSync(
      [Buffer.from('root'), user.toBuffer()],
      PROGRAM_ID
    );
    return { pda, bump };
  }, [wallet.publicKey]);

  // Derive Context PDA
  const getContextPDA = useCallback((rootPDA: PublicKey, contextIndex: number) => {
    const indexBuffer = Buffer.alloc(2);
    indexBuffer.writeUInt16LE(contextIndex);
    
    const [pda, bump] = PublicKey.findProgramAddressSync(
      [Buffer.from('context'), rootPDA.toBuffer(), indexBuffer],
      PROGRAM_ID
    );
    return { pda, bump };
  }, []);

  // Fetch Root Identity account
  const fetchRootIdentity = useCallback(async (userPubkey?: PublicKey): Promise<RootIdentity | null> => {
    if (!program) return null;
    
    const result = getRootPDA(userPubkey);
    if (!result) return null;
    
    try {
      const account = await program.account.rootIdentity.fetch(result.pda);
      return account as unknown as RootIdentity;
    } catch (err) {
      // Account doesn't exist yet
      return null;
    }
  }, [program, getRootPDA]);

  // Fetch Context Identity account
  const fetchContextIdentity = useCallback(async (contextPDA: PublicKey): Promise<ContextIdentity | null> => {
    if (!program) return null;
    
    try {
      const account = await program.account.contextIdentity.fetch(contextPDA);
      return account as unknown as ContextIdentity;
    } catch {
      return null;
    }
  }, [program]);

  // Create Root Identity
  const createRootIdentity = useCallback(async (privacyLevel: number = 1): Promise<{ signature: string; pda: PublicKey } | null> => {
    if (!program || !wallet.publicKey) {
      setError('Wallet not connected');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = getRootPDA();
      if (!result) throw new Error('Could not derive PDA');

      console.log('Creating root identity...');
      console.log('  User:', wallet.publicKey.toBase58());
      console.log('  Root PDA:', result.pda.toBase58());
      console.log('  Privacy Level:', privacyLevel);

      const signature = await program.methods
        .createRootIdentity(privacyLevel)
        .accounts({
          user: wallet.publicKey,
          rootIdentity: result.pda,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      console.log('Root identity created:', signature);
      return { signature, pda: result.pda };
    } catch (err: any) {
      console.error('Error creating root identity:', err);
      
      // Parse common errors
      let errorMessage = err.message || 'Failed to create root identity';
      if (err.message?.includes('already in use')) {
        errorMessage = 'Root identity already exists';
      } else if (err.message?.includes('insufficient')) {
        errorMessage = 'Insufficient SOL for transaction';
      }
      
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [program, wallet.publicKey, getRootPDA]);

  // Create Context (will also create root identity if needed)
  const createContext = useCallback(async (
    contextType: number = 0, // 0 = DeFi
    maxPerTransaction: number = 50 * LAMPORTS_PER_SOL // 50 SOL default
  ): Promise<{ signature: string; contextPda: PublicKey; rootPda: PublicKey; contextIndex: number } | null> => {
    if (!program || !wallet.publicKey) {
      setError('Wallet not connected');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const rootResult = getRootPDA();
      if (!rootResult) throw new Error('Could not derive root PDA');

      // Check if root identity exists
      let rootIdentity = await fetchRootIdentity();
      
      if (!rootIdentity) {
        console.log('Root identity not found, creating...');
        
        const createResult = await createRootIdentity(1);
        if (!createResult) {
          throw new Error('Failed to create root identity');
        }
        
        // Wait for confirmation
        console.log('Waiting for confirmation...');
        await new Promise(r => setTimeout(r, 2000));
        
        // Fetch the newly created root identity
        rootIdentity = await fetchRootIdentity();
        if (!rootIdentity) {
          throw new Error('Root identity not found after creation');
        }
      }

      const contextIndex = rootIdentity.contextCount;
      const contextResult = getContextPDA(rootResult.pda, contextIndex);

      console.log('Creating context...');
      console.log('  Root PDA:', rootResult.pda.toBase58());
      console.log('  Context Index:', contextIndex);
      console.log('  Context PDA:', contextResult.pda.toBase58());
      console.log('  Context Type:', contextType);
      console.log('  Max Per TX:', maxPerTransaction / LAMPORTS_PER_SOL, 'SOL');

      const signature = await program.methods
        .createContext(contextType, new BN(maxPerTransaction))
        .accounts({
          user: wallet.publicKey,
          rootIdentity: rootResult.pda,
          contextIdentity: contextResult.pda,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      console.log('Context created:', signature);
      return { 
        signature, 
        contextPda: contextResult.pda, 
        rootPda: rootResult.pda,
        contextIndex 
      };
    } catch (err: any) {
      console.error('Error creating context:', err);
      
      let errorMessage = err.message || 'Failed to create context';
      if (err.message?.includes('insufficient')) {
        errorMessage = 'Insufficient SOL for transaction. Get devnet SOL from faucet.solana.com';
      } else if (err.logs) {
        // Try to extract more info from logs
        const errorLog = err.logs.find((log: string) => log.includes('Error'));
        if (errorLog) {
          errorMessage = errorLog;
        }
      }
      
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [program, wallet.publicKey, getRootPDA, getContextPDA, fetchRootIdentity, createRootIdentity]);

  // Revoke Context
  const revokeContext = useCallback(async (
    contextIndex: number
  ): Promise<{ signature: string } | null> => {
    if (!program || !wallet.publicKey) {
      setError('Wallet not connected');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const rootResult = getRootPDA();
      if (!rootResult) throw new Error('Could not derive root PDA');

      const contextResult = getContextPDA(rootResult.pda, contextIndex);

      console.log('Revoking context...');
      console.log('  Context Index:', contextIndex);
      console.log('  Context PDA:', contextResult.pda.toBase58());

      const signature = await program.methods
        .revokeContext()
        .accounts({
          user: wallet.publicKey,
          rootIdentity: rootResult.pda,
          contextIdentity: contextResult.pda,
        })
        .rpc();

      console.log('Context revoked:', signature);
      return { signature };
    } catch (err: any) {
      console.error('Error revoking context:', err);
      
      let errorMessage = err.message || 'Failed to revoke context';
      if (err.message?.includes('already revoked')) {
        errorMessage = 'Context already revoked';
      }
      
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [program, wallet.publicKey, getRootPDA, getContextPDA]);

  return {
    program,
    programId: PROGRAM_ID,
    isLoading,
    error,
    
    // PDA helpers
    getRootPDA,
    getContextPDA,
    
    // Fetch methods
    fetchRootIdentity,
    fetchContextIdentity,
    
    // Transaction methods
    createRootIdentity,
    createContext,
    revokeContext,
  };
}
