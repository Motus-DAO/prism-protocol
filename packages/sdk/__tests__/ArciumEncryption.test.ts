/**
 * Unit tests for ArciumEncryption
 *
 * Without ARCIUM_MXE_ADDRESS / ARCIUM_CLUSTER_ID the class runs in
 * simulation mode. We test: constructor, getStatus, encryptBalance,
 * encryptData, and that results have the expected shape.
 */

import { PublicKey } from '@solana/web3.js';
import { ArciumEncryption } from '../src';

describe('ArciumEncryption', () => {
  const config = {
    rpcUrl: 'https://api.devnet.solana.com',
    network: 'devnet' as const,
  };

  let arcium: ArciumEncryption;

  beforeEach(() => {
    arcium = new ArciumEncryption(config);
  });

  describe('constructor', () => {
    it('creates instance with config', () => {
      expect(arcium).toBeDefined();
    });
  });

  describe('getStatus', () => {
    it('returns mode, network before initialize', () => {
      const status = arcium.getStatus();
      expect(status).toHaveProperty('mode');
      expect(status).toHaveProperty('network', 'devnet');
      expect(status.mode).toMatch(/simulation|live/);
    });

    it('returns initialized true after initialize', async () => {
      await arcium.initialize();
      const status = arcium.getStatus();
      expect(status.initialized).toBe(true);
    });
  });

  describe('encryptBalance', () => {
    beforeEach(async () => {
      await arcium.initialize();
    });

    it('returns success and encryptedBalance with expected shape', async () => {
      const contextPubkey = new PublicKey(
        '11111111111111111111111111111111'
      );
      const result = await arcium.encryptBalance({
        balance: 1000000000n,
        contextPubkey,
      });
      expect(result.success).toBe(true);
      expect(result.encryptedBalance).toBeDefined();
      expect(result.encryptedBalance).toHaveProperty('encryptedValue');
      expect(result.encryptedBalance).toHaveProperty('commitment');
      expect(result.encryptedBalance).toHaveProperty('contextPubkey');
      expect(result.encryptedBalance).toHaveProperty('timestamp');
      expect(result.encryptedBalance!.encryptedValue).toBeInstanceOf(
        Uint8Array
      );
      expect(typeof result.encryptedBalance!.commitment).toBe('string');
      expect(result.encryptedBalance!.commitment.length).toBeGreaterThan(0);
    });

    it('accepts contextPubkey as string', async () => {
      const result = await arcium.encryptBalance({
        balance: 1n,
        contextPubkey: '11111111111111111111111111111111',
      });
      expect(result.success).toBe(true);
      expect(result.encryptedBalance!.contextPubkey).toBe(
        '11111111111111111111111111111111'
      );
    });
  });

  describe('encryptData', () => {
    beforeEach(async () => {
      await arcium.initialize();
    });

    it('returns success and encryptedData with expected shape', async () => {
      const bindingKey = '22222222222222222222222222222222';
      const data = new Uint8Array([1, 2, 3]);
      const result = await arcium.encryptData({
        data,
        bindingKey,
      });
      expect(result.success).toBe(true);
      expect(result.encryptedData).toBeDefined();
      expect(result.encryptedData).toHaveProperty('encryptedValue');
      expect(result.encryptedData).toHaveProperty('commitment');
      expect(result.encryptedData).toHaveProperty('bindingKey', bindingKey);
      expect(result.encryptedData).toHaveProperty('timestamp');
      expect(result.encryptedData!.encryptedValue).toBeInstanceOf(Uint8Array);
    });

    it('accepts PublicKey as data', async () => {
      const pubkey = new PublicKey('11111111111111111111111111111111');
      const result = await arcium.encryptData({
        data: pubkey,
        bindingKey: '22222222222222222222222222222222',
      });
      expect(result.success).toBe(true);
      expect(result.encryptedData).toBeDefined();
    });
  });

  describe('isLiveMode', () => {
    it('returns false in simulation mode (no env vars)', () => {
      expect(arcium.isLiveMode()).toBe(false);
    });
  });
});
