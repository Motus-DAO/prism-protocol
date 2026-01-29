/**
 * Unit tests for SolvencyProver
 *
 * In Node the prover runs in simulation mode (no WASM). We test:
 * - getCircuitInfo, initialization
 * - generateProof with valid inputs returns proof shape
 * - generateProof with balance < threshold throws
 * - verifyProof returns true for valid proof
 */

import { SolvencyProver } from '../src';

describe('SolvencyProver', () => {
  let prover: SolvencyProver;

  beforeEach(() => {
    prover = new SolvencyProver();
  });

  describe('getCircuitInfo', () => {
    it('returns circuit name and inputs', () => {
      const info = prover.getCircuitInfo();
      expect(info).toHaveProperty('name', 'solvency_proof');
      expect(info).toHaveProperty('inputs');
      expect(Array.isArray(info.inputs)).toBe(true);
      expect(info.inputs.length).toBeGreaterThan(0);
      expect(info).toHaveProperty('outputs');
    });
  });

  describe('initialize', () => {
    it('initializes without error', async () => {
      await expect(prover.initialize()).resolves.not.toThrow();
    });

    it('is initialized after initialize()', async () => {
      await prover.initialize();
      expect(prover.isInitialized()).toBe(true);
    });

    it('runs in simulation mode in Node', async () => {
      await prover.initialize();
      expect(prover.isMockMode()).toBe(true);
    });
  });

  describe('generateProof', () => {
    beforeEach(async () => {
      await prover.initialize();
    });

    it('returns proof with publicInputs when balance >= threshold', async () => {
      const proof = await prover.generateProof({
        actualBalance: 500n,
        threshold: 100n,
      });
      expect(proof).toHaveProperty('proof');
      expect(proof).toHaveProperty('publicInputs');
      expect(proof.publicInputs).toHaveProperty('threshold', 100n);
      expect(proof.publicInputs).toHaveProperty('isSolvent', true);
      expect(proof).toHaveProperty('timestamp');
      expect(proof.proof).toBeInstanceOf(Uint8Array);
      expect(proof.proof.length).toBeGreaterThan(0);
    });

    it('throws when balance < threshold', async () => {
      await expect(
        prover.generateProof({
          actualBalance: 50n,
          threshold: 100n,
        })
      ).rejects.toThrow(/threshold|balance/);
    });

    it('throws when balance is negative', async () => {
      await expect(
        prover.generateProof({
          actualBalance: -1n,
          threshold: 100n,
        })
      ).rejects.toThrow();
    });

    it('throws when threshold is negative', async () => {
      await expect(
        prover.generateProof({
          actualBalance: 100n,
          threshold: -1n,
        })
      ).rejects.toThrow();
    });
  });

  describe('verifyProof', () => {
    beforeEach(async () => {
      await prover.initialize();
    });

    it('returns true for valid proof', async () => {
      const proof = await prover.generateProof({
        actualBalance: 500n,
        threshold: 100n,
      });
      const isValid = await prover.verifyProof(proof);
      expect(isValid).toBe(true);
    });

    it('returns false for proof with isSolvent false', async () => {
      const proof = await prover.generateProof({
        actualBalance: 500n,
        threshold: 100n,
      });
      proof.publicInputs.isSolvent = false;
      const isValid = await prover.verifyProof(proof);
      expect(isValid).toBe(false);
    });
  });
});
