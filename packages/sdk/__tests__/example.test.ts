import { PublicKey } from '@solana/web3.js';
import { ContextType, PrivacyLevel } from '../src';
import {
  createMockWallet,
  createMockConnection,
  createTestPrism,
  TEST_RPC_URL,
} from './helpers';

describe('SDK exports', () => {
  it('exports ContextType enum', () => {
    expect(ContextType.DeFi).toBe(0);
    expect(ContextType.Social).toBe(1);
  });

  it('exports PrivacyLevel enum', () => {
    expect(PrivacyLevel.High).toBe(1);
    expect(PrivacyLevel.Maximum).toBe(0);
  });
});

describe('Test helpers', () => {
  it('createMockWallet returns a Wallet with publicKey and sign methods', () => {
    const wallet = createMockWallet();
    expect(wallet.publicKey).toBeInstanceOf(PublicKey);
    expect(wallet.signTransaction).toBeDefined();
    expect(wallet.signAllTransactions).toBeDefined();
    expect(typeof wallet.signTransaction).toBe('function');
    expect(typeof wallet.signAllTransactions).toBe('function');
  });

  it('createMockConnection returns a Connection', () => {
    const connection = createMockConnection();
    expect(connection).toBeDefined();
    expect(connection.rpcEndpoint).toBe(TEST_RPC_URL);
  });

  it('createTestPrism returns a PrismProtocol instance', () => {
    const prism = createTestPrism();
    expect(prism).toBeDefined();
    expect(prism.getWalletPublicKey()).toBeDefined();
    expect(prism.getProgramId()).toBeDefined();
    expect(prism.getInfo().network).toBeDefined();
  });
});
