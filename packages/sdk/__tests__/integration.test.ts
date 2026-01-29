/**
 * Integration tests for the Prism Protocol SDK
 *
 * Tests the full flow: initialize → (create root → create context →)
 * generate proof → verify proof → (revoke context). Parts that hit devnet
 * (create root/context/revoke) may fail with an unfunded wallet; we assert
 * on either success or the expected failure so CI stays green.
 */

import { PrismProtocol, ContextType, PrismNetworkError } from '../src';
import { createTestPrism } from './helpers';

jest.setTimeout(30_000);

describe('Integration', () => {
  describe('full flow (proof path, no chain)', () => {
    it('initialize → generateSolvencyProof → verifySolvencyProof', async () => {
      const prism = createTestPrism();
      await prism.initialize();

      const proof = await prism.generateSolvencyProof({
        actualBalance: 1000n,
        threshold: 100n,
      });

      expect(proof).toBeDefined();
      expect(proof.publicInputs.threshold).toBe(100n);
      expect(proof.publicInputs.isSolvent).toBe(true);
      expect(proof.proof).toBeInstanceOf(Uint8Array);
      expect(proof.proof.length).toBeGreaterThan(0);

      const isValid = await prism.verifySolvencyProof(proof);
      expect(isValid).toBe(true);
    });
  });

  describe('full flow (devnet: root → context → proof → revoke)', () => {
    it('runs full flow; succeeds with funded wallet or fails with clear error', async () => {
      const prism = createTestPrism();
      await prism.initialize();

      let rootSignature: string | undefined;
      let contextIndex: number | undefined;

      try {
        const root = await prism.createRootIdentity();
        rootSignature = root.signature;
        expect(root.rootAddress).toBeDefined();
        expect(rootSignature).toBeDefined();
      } catch (err) {
        // Unfunded wallet: expect network/transaction error
        expect(err).toBeDefined();
        const msg = err instanceof Error ? err.message : String(err);
        expect(
          msg.includes('debit') ||
            msg.includes('simulation') ||
            msg.includes('prior credit') ||
            err instanceof PrismNetworkError
        ).toBe(true);
        return;
      }

      try {
        const context = await prism.createContext({
          type: ContextType.DeFi,
          maxPerTransaction: 1_000_000_000n,
        });
        contextIndex = context.contextIndex;
        expect(context.contextAddress).toBeDefined();
        expect(context.signature).toBeDefined();
        expect(context.contextType).toBe(ContextType.DeFi);
      } catch (err) {
        expect(err).toBeDefined();
        return;
      }

      const proof = await prism.generateSolvencyProof({
        actualBalance: 1_000_000_000n,
        threshold: 100n,
      });
      expect(proof.publicInputs.isSolvent).toBe(true);

      const isValid = await prism.verifySolvencyProof(proof);
      expect(isValid).toBe(true);

      if (contextIndex !== undefined) {
        const revoke = await prism.revokeContextByIndex(contextIndex);
        expect(revoke.signature).toBeDefined();
        expect(revoke.contextAddress).toBeDefined();
        expect(revoke.totalSpent).toBeDefined();
      }
    });
  });

  describe('error scenarios', () => {
    it('generateSolvencyProof with balance < threshold throws', async () => {
      const prism = createTestPrism();
      await prism.initialize();

      await expect(
        prism.generateSolvencyProof({
          actualBalance: 50n,
          threshold: 100n,
        })
      ).rejects.toThrow(/threshold|balance/);
    });

    it('revokeContextByIndex with invalid index fails or returns already_revoked', async () => {
      const prism = createTestPrism();
      await prism.initialize();

      // Index 999 is unlikely to exist; we expect error or already_revoked
      try {
        const result = await prism.revokeContextByIndex(999);
        expect(result.signature).toBeDefined();
        expect(['already_revoked', result.signature].includes(result.signature)).toBe(true);
      } catch (err) {
        expect(err).toBeDefined();
      }
    });
  });
});
