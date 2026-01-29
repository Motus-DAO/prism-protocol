/**
 * Test helpers for the Prism Protocol SDK
 *
 * These utilities let tests use the SDK without a real wallet or app.
 * They create "mock" or test-only instances that match the interfaces
 * the SDK expects (Anchor Wallet, Solana Connection, etc.).
 */

import { Keypair, Connection, PublicKey, Transaction } from '@solana/web3.js';
import type { Wallet } from '@coral-xyz/anchor';
import { PrismProtocol } from '../src';

// ---------------------------------------------------------------------------
// Why we need a mock wallet
// ---------------------------------------------------------------------------
// PrismProtocol requires a Wallet (from Anchor). In production that comes from
// Phantom, Solflare, etc. In tests we don't want to connect a real wallet, so
// we build an object that has the same shape: publicKey, signTransaction,
// signAllTransactions. We use a Keypair so we could sign for real in tests
// if needed (e.g. integration tests that send transactions).

/**
 * Creates a mock Wallet for use in tests.
 *
 * Returns an object that satisfies the Anchor Wallet interface:
 * - publicKey: from a generated Keypair (or the one you pass in)
 * - signTransaction: returns the same transaction (optionally signed by the keypair)
 * - signAllTransactions: same for an array of transactions
 *
 * Using a Keypair lets integration tests that hit devnet actually sign
 * transactions; for unit tests we often don't sign and just return the tx.
 *
 * @param keypair - Optional. If provided, this keypair's publicKey is used and
 *                  transactions can be signed. If omitted, a new Keypair is generated.
 * @returns A Wallet-compatible object for PrismProtocol and other SDK calls.
 */
export function createMockWallet(keypair?: Keypair): Wallet {
  const kp = keypair ?? Keypair.generate();

  return {
    publicKey: kp.publicKey,
    payer: kp,
    signTransaction: async (tx) => {
      if (tx instanceof Transaction) {
        tx.sign(kp);
      }
      return tx;
    },
    signAllTransactions: async (txs) => {
      txs.forEach((tx) => {
        if (tx instanceof Transaction) {
          tx.sign(kp);
        }
      });
      return txs;
    },
  };
}

// ---------------------------------------------------------------------------
// Why we need a mock connection
// ---------------------------------------------------------------------------
// PrismProtocol builds its own Connection from config.rpcUrl, so tests usually
// don't pass a Connection into the SDK. But tests sometimes need a Connection
// themselves—e.g. to fetch balance (connection.getBalance), or to pass to
// utilities that expect a Connection. This helper gives a single place to
// get a Connection for tests (e.g. devnet) so we don't hardcode RPC URLs
// in every test file.

/** Default RPC URL used by test helpers when none is provided (devnet). */
export const TEST_RPC_URL = 'https://api.devnet.solana.com';

/**
 * Creates a Solana Connection for use in tests.
 *
 * Use this when a test needs a Connection directly (e.g. getBalance, getAccountInfo),
 * rather than going through PrismProtocol. PrismProtocol creates its own
 * Connection from the rpcUrl you pass in the config.
 *
 * @param rpcUrl - Optional. RPC endpoint. Defaults to TEST_RPC_URL (devnet).
 * @returns A Connection instance pointing at the given RPC.
 */
export function createMockConnection(rpcUrl: string = TEST_RPC_URL): Connection {
  return new Connection(rpcUrl, 'confirmed');
}

// ---------------------------------------------------------------------------
// Why we need createTestPrism
// ---------------------------------------------------------------------------
// Many tests need a PrismProtocol instance. Instead of repeating "create
// wallet, create config, new PrismProtocol(...)" in every test, we centralize
// it here. Tests can call createTestPrism() for a default instance, or pass
// overrides (e.g. custom wallet, custom rpcUrl) for that specific test. We do
// not call initialize() by default so tests can choose when to initialize
// (e.g. after mocks are set up) or test uninitialized behavior.

/**
 * Creates a PrismProtocol instance configured for tests.
 *
 * Uses createMockWallet() and TEST_RPC_URL by default so tests don't need
 * a real wallet or environment. The instance is not initialized—call
 * prism.initialize() in your test when you need the program to be loaded
 * (e.g. before createRootIdentity, createContext).
 *
 * @param overrides - Optional. Override default config:
 *   - wallet: use a specific Wallet (e.g. from createMockWallet(keypair))
 *   - rpcUrl: use a different RPC (e.g. local validator)
 *   - programId: use a different program (e.g. deployed test program)
 * @returns A PrismProtocol instance ready for use in tests.
 */
export function createTestPrism(overrides?: {
  wallet?: Wallet;
  rpcUrl?: string;
  programId?: PublicKey;
}): PrismProtocol {
  const wallet = overrides?.wallet ?? createMockWallet();
  const rpcUrl = overrides?.rpcUrl ?? TEST_RPC_URL;

  return new PrismProtocol({
    rpcUrl,
    wallet,
    ...(overrides?.programId && { programId: overrides.programId }),
  });
}
