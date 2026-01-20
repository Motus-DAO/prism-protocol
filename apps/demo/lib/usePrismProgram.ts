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

    // Get PDA outside try block for error handling
    const result = getRootPDA();
    if (!result) {
      setError('Could not derive PDA');
      setIsLoading(false);
      return null;
    }

    // Pre-check: Verify if root identity already exists
    try {
      const existing = await fetchRootIdentity();
      if (existing) {
        console.log('Root identity already exists - skipping creation');
        setIsLoading(false);
        return { signature: 'existing', pda: result.pda };
      }
    } catch (checkErr) {
      // Root identity doesn't exist, continue with creation
      console.log('Root identity not found, will create new one');
    }

    try {
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
      let errorMessage = err.message || 'Failed to create root identity';
      let isActualError = true;
      
      // Handle "already processed" - transaction might have succeeded
      if (err.message?.includes('already been processed') || 
          err.message?.includes('already processed') ||
          err.transactionMessage?.includes('already been processed') ||
          err.transactionMessage?.includes('simulation failed')) {
        console.log('Transaction simulation failed - checking if root identity was created...');
        
        // Check if root identity was actually created
        try {
          const rootIdentity = await fetchRootIdentity();
          if (rootIdentity) {
            console.log('✓ Root identity was created successfully (duplicate transaction)');
            setIsLoading(false);
            return { signature: 'duplicate', pda: result.pda };
          }
        } catch (checkErr) {
          console.error('Error checking root identity state:', checkErr);
        }
      } else if (err.message?.includes('already in use') || 
                 err.message?.includes('AccountDiscriminatorAlreadyExists')) {
        console.log('✓ Root identity already exists (program error) - operation successful');
        setIsLoading(false);
        return { signature: 'existing', pda: result.pda };
      } else if (err.message?.includes('insufficient')) {
        errorMessage = 'Insufficient SOL for transaction';
        isActualError = true;
      }
      
      // Only log as error and set error state if it's an actual error
      if (isActualError) {
        console.error('Error creating root identity:', err);
        setError(errorMessage);
        return null;
      }
      
      // If we get here, it was handled as success above
      setIsLoading(false);
      return { signature: 'existing', pda: result.pda };
    } finally {
      setIsLoading(false);
    }
  }, [program, wallet.publicKey, getRootPDA, fetchRootIdentity]);

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

    // Get root PDA outside try block for error handling
    const rootResult = getRootPDA();
    if (!rootResult) {
      setError('Could not derive root PDA');
      setIsLoading(false);
      return null;
    }

    try {
      // Check if root identity exists
      let rootIdentity = await fetchRootIdentity();
      
      if (!rootIdentity) {
        console.log('Root identity not found, creating...');
        
        const createResult = await createRootIdentity(1);
        if (!createResult) {
          throw new Error('Failed to create root identity');
        }
        
        // If root identity was created (or already existed), wait a bit and fetch it
        if (createResult.signature === 'existing' || 
            createResult.signature === 'duplicate' || 
            createResult.signature) {
          console.log('Waiting for confirmation...');
          // Wait longer for first-time creation to ensure it's confirmed
          await new Promise(r => setTimeout(r, 3000));
          
          // Fetch the root identity - retry a few times if needed
          let retries = 3;
          while (retries > 0 && !rootIdentity) {
            rootIdentity = await fetchRootIdentity();
            if (!rootIdentity) {
              console.log(`Root identity not found yet, retrying... (${retries} attempts left)`);
              await new Promise(r => setTimeout(r, 1000));
              retries--;
            }
          }
          
          if (!rootIdentity) {
            throw new Error('Root identity not found after creation. Please try again.');
          }
        } else {
          throw new Error('Root identity creation failed');
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
      let errorMessage = err.message || 'Failed to create context';
      let isActualError = true;
      
      // Handle "already processed" - transaction might have succeeded
      if (err.message?.includes('already been processed') || 
          err.message?.includes('already processed') ||
          err.transactionMessage?.includes('already been processed') ||
          err.transactionMessage?.includes('simulation failed')) {
        console.log('Transaction simulation failed - checking if context was created...');
        
        // Check if context was actually created
        try {
          const rootIdentity = await fetchRootIdentity();
          if (rootIdentity) {
            const contextIndex = rootIdentity.contextCount - 1; // Last created context
            const contextResult = getContextPDA(rootResult.pda, contextIndex);
            const contextAccount = await fetchContextIdentity(contextResult.pda);
            
            if (contextAccount && !contextAccount.revoked) {
              console.log('✓ Context was created successfully (duplicate transaction)');
              return {
                signature: 'duplicate',
                contextPda: contextResult.pda,
                rootPda: rootResult.pda,
                contextIndex
              };
            }
          }
        } catch (checkErr) {
          console.error('Error checking context state:', checkErr);
        }
        
        errorMessage = 'Transaction already processed. Please refresh and try again.';
      } else if (err.message?.includes('insufficient')) {
        errorMessage = 'Insufficient SOL for transaction. Get devnet SOL from faucet.solana.com';
        isActualError = true;
      } else if (err.logs) {
        // Try to extract more info from logs
        const errorLog = err.logs.find((log: string) => log.includes('Error'));
        if (errorLog) {
          errorMessage = errorLog;
        }
        isActualError = true;
      }
      
      // Only log as error and set error state if it's an actual error
      if (isActualError) {
        console.error('Error creating context:', err);
        setError(errorMessage);
        return null;
      }
      
      // If we get here, it was handled as success above
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

    // Get PDAs outside try block for error handling
    const rootResult = getRootPDA();
    if (!rootResult) {
      setError('Could not derive root PDA');
      setIsLoading(false);
      return null;
    }

    const contextResult = getContextPDA(rootResult.pda, contextIndex);

    try {
      console.log('Revoking context...');
      console.log('  Context Index:', contextIndex);
      console.log('  Context PDA:', contextResult.pda.toBase58());

      // Pre-check: Verify context exists and is not already revoked
      try {
        const contextAccount = await fetchContextIdentity(contextResult.pda);
        if (!contextAccount) {
          setError('Context not found');
          setIsLoading(false);
          return null;
        }
        if (contextAccount.revoked) {
          console.log('Context already revoked - skipping transaction');
          return { signature: 'already_revoked' };
        }
        console.log('  Context state: Active (not revoked)');
      } catch (checkErr: any) {
        // Context might not exist - that's okay, we'll let the transaction fail naturally
        if (checkErr.message?.includes('Account does not exist')) {
          setError('Context account does not exist');
          setIsLoading(false);
          return null;
        }
        console.warn('Could not pre-check context state:', checkErr);
        // Continue anyway - transaction will fail if there's a real issue
      }

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
      let errorMessage = err.message || 'Failed to revoke context';
      let isActualError = true;
      
      // Handle "already processed" - transaction might have succeeded
      if (err.message?.includes('already been processed') || 
          err.message?.includes('already processed') ||
          err.transactionMessage?.includes('already been processed') ||
          err.transactionMessage?.includes('simulation failed')) {
        console.log('Transaction simulation failed - checking if context was already revoked...');
        
        // Check if context was actually revoked (might have been revoked in previous attempt)
        try {
          const contextAccount = await fetchContextIdentity(contextResult.pda);
          if (contextAccount) {
            if (contextAccount.revoked) {
              console.log('✓ Context was already revoked - operation successful');
              return { signature: 'already_revoked' };
            } else {
              console.log('⚠ Context still active - transaction may have failed');
              errorMessage = 'Transaction failed. Context may have been revoked in a previous transaction.';
            }
          } else {
            // Context doesn't exist - might have been revoked or never created
            console.log('⚠ Context account not found - may have been revoked');
            errorMessage = 'Context account not found. It may have been revoked or never created.';
          }
        } catch (checkErr) {
          console.error('Error checking context state:', checkErr);
          errorMessage = 'Transaction failed. Unable to verify context state.';
        }
      } else if (err.message?.includes('already revoked') || 
                 err.message?.includes('ContextAlreadyRevoked') ||
                 err.code === 6002) {
        console.log('✓ Context already revoked (program error) - operation successful');
        return { signature: 'already_revoked' };
      } else {
        // This is a real error - log it
        console.error('Error revoking context:', err);
        isActualError = true;
      }
      
      // Only set error and return null if it's an actual error
      if (isActualError) {
        setError(errorMessage);
        return null;
      }
      
      // If we get here, it was handled as success above
      return { signature: 'already_revoked' };
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
