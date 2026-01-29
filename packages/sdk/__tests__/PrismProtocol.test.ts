/**
 * Unit tests for PrismProtocol
 *
 * Covers: constructor validation, PDA helpers, getters, solvency proof,
 * and validation errors. Identity/context creation that hit the network
 * are covered in integration.test.ts.
 */

import { PublicKey } from '@solana/web3.js';
import {
  PrismProtocol,
  ContextType,
  PrivacyLevel,
  PrismValidationError,
} from '../src';
import { createTestPrism, createMockWallet } from './helpers';

describe('PrismProtocol', () => {
  describe('constructor', () => {
    it('throws PrismValidationError when wallet is missing', () => {
      expect(
        () =>
          new PrismProtocol({
            rpcUrl: 'https://api.devnet.solana.com',
            wallet: undefined as any,
          })
      ).toThrow(PrismValidationError);
      expect(
        () =>
          new PrismProtocol({
            rpcUrl: 'https://api.devnet.solana.com',
            wallet: undefined as any,
          })
      ).toThrow(/Wallet is required/);
    });

    it('throws PrismValidationError when wallet has no publicKey', () => {
      expect(
        () =>
          new PrismProtocol({
            rpcUrl: 'https://api.devnet.solana.com',
            wallet: { publicKey: undefined } as any,
          })
      ).toThrow(PrismValidationError);
    });

    it('throws PrismValidationError when rpcUrl is missing', () => {
      const wallet = createMockWallet();
      expect(
        () =>
          new PrismProtocol({
            rpcUrl: undefined as any,
            wallet,
          })
      ).toThrow(PrismValidationError);
      expect(
        () =>
          new PrismProtocol({
            rpcUrl: undefined as any,
            wallet,
          })
      ).toThrow(/RPC URL/);
    });

    it('creates instance with valid config', () => {
      const prism = createTestPrism();
      expect(prism).toBeDefined();
      expect(prism.getWalletPublicKey()).toBeInstanceOf(PublicKey);
      expect(prism.getProgramId()).toBeInstanceOf(PublicKey);
    });
  });

  describe('getRootIdentityPDA', () => {
    it('returns [PublicKey, number] for connected wallet', () => {
      const prism = createTestPrism();
      const [pda, bump] = prism.getRootIdentityPDA();
      expect(pda).toBeInstanceOf(PublicKey);
      expect(typeof bump).toBe('number');
      expect(bump).toBeGreaterThanOrEqual(0);
      expect(bump).toBeLessThanOrEqual(255);
    });

    it('returns same PDA for same wallet', () => {
      const wallet = createMockWallet();
      const prism1 = createTestPrism({ wallet });
      const prism2 = createTestPrism({ wallet });
      const [pda1] = prism1.getRootIdentityPDA();
      const [pda2] = prism2.getRootIdentityPDA();
      expect(pda1.toBase58()).toBe(pda2.toBase58());
    });
  });

  describe('getContextPDA', () => {
    it('returns [PublicKey, number] for root PDA and index', () => {
      const prism = createTestPrism();
      const [rootPDA] = prism.getRootIdentityPDA();
      const [contextPDA, bump] = prism.getContextPDA(rootPDA, 0);
      expect(contextPDA).toBeInstanceOf(PublicKey);
      expect(typeof bump).toBe('number');
      expect(contextPDA.toBase58()).not.toBe(rootPDA.toBase58());
    });

    it('returns different PDAs for different indices', () => {
      const prism = createTestPrism();
      const [rootPDA] = prism.getRootIdentityPDA();
      const [pda0] = prism.getContextPDA(rootPDA, 0);
      const [pda1] = prism.getContextPDA(rootPDA, 1);
      expect(pda0.toBase58()).not.toBe(pda1.toBase58());
    });
  });

  describe('getInfo / getWalletPublicKey / getProgramId', () => {
    it('getInfo returns version, programId, network', () => {
      const prism = createTestPrism();
      const info = prism.getInfo();
      expect(info).toHaveProperty('version');
      expect(info).toHaveProperty('programId');
      expect(info).toHaveProperty('network');
      expect(typeof info.version).toBe('string');
      expect(typeof info.programId).toBe('string');
      expect(info.network).toMatch(/devnet|mainnet/);
    });

    it('getWalletPublicKey returns wallet public key', () => {
      const wallet = createMockWallet();
      const prism = createTestPrism({ wallet });
      expect(prism.getWalletPublicKey().toBase58()).toBe(
        wallet.publicKey.toBase58()
      );
    });

    it('getProgramId returns program public key', () => {
      const prism = createTestPrism();
      const programId = prism.getProgramId();
      expect(programId).toBeInstanceOf(PublicKey);
      expect(programId.toBase58().length).toBeGreaterThan(30);
    });
  });

  describe('generateSolvencyProof', () => {
    it('returns proof when balance >= threshold', async () => {
      const prism = createTestPrism();
      const proof = await prism.generateSolvencyProof({
        actualBalance: 1000n,
        threshold: 100n,
      });
      expect(proof).toHaveProperty('proof');
      expect(proof).toHaveProperty('publicInputs');
      expect(proof.publicInputs).toHaveProperty('threshold', 100n);
      expect(proof.publicInputs).toHaveProperty('isSolvent', true);
      expect(proof.proof).toBeInstanceOf(Uint8Array);
      expect(proof.proof.length).toBeGreaterThan(0);
    });

    it('throws when balance < threshold', async () => {
      const prism = createTestPrism();
      await expect(
        prism.generateSolvencyProof({
          actualBalance: 50n,
          threshold: 100n,
        })
      ).rejects.toThrow(/threshold|balance/);
    });
  });

  describe('verifySolvencyProof', () => {
    it('returns true for valid proof', async () => {
      const prism = createTestPrism();
      const proof = await prism.generateSolvencyProof({
        actualBalance: 1000n,
        threshold: 100n,
      });
      const isValid = await prism.verifySolvencyProof(proof);
      expect(isValid).toBe(true);
    });
  });

  describe('createContextEncrypted validation', () => {
    it('throws PrismValidationError for invalid context type', async () => {
      const prism = createTestPrism();
      await prism.initialize();
      // createContextEncrypted validates type before any network call
      await expect(
        prism.createContextEncrypted({
          type: 999 as ContextType,
          maxPerTransaction: 1000n,
        })
      ).rejects.toThrow(PrismValidationError);
      await expect(
        prism.createContextEncrypted({
          type: 999 as ContextType,
          maxPerTransaction: 1000n,
        })
      ).rejects.toThrow(/context type|Invalid/);
    });
  });
});
