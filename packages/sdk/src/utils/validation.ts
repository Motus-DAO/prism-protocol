// Prism Protocol - Input Validation Utilities

import { PublicKey } from '@solana/web3.js';
import { PrismValidationError } from '../errors/PrismValidationError';
import { ContextType, PrivacyLevel } from '../types';

/**
 * Validate a Solana public key string or PublicKey object
 * 
 * @param pubkey - Public key to validate (string or PublicKey)
 * @returns true if valid, throws PrismValidationError if invalid
 * 
 * @example
 * ```typescript
 * validatePublicKey('9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM'); // true
 * validatePublicKey('invalid'); // throws PrismValidationError
 * ```
 */
export function validatePublicKey(pubkey: string | PublicKey): boolean {
  try {
    if (pubkey instanceof PublicKey) {
      return true;
    }

    if (typeof pubkey !== 'string') {
      throw new PrismValidationError(
        'Public key must be a string or PublicKey object',
        'INVALID_PUBKEY_TYPE',
        { field: 'pubkey', value: typeof pubkey }
      );
    }

    // Try to create PublicKey to validate format
    new PublicKey(pubkey);
    return true;
  } catch (error) {
    if (error instanceof PrismValidationError) {
      throw error;
    }
    throw new PrismValidationError(
      `Invalid public key format: ${pubkey}`,
      'INVALID_PUBKEY_FORMAT',
      { field: 'pubkey', value: pubkey }
    );
  }
}

/**
 * Validate a lamports amount (must be non-negative)
 * 
 * @param amount - Amount in lamports to validate
 * @returns true if valid, throws PrismValidationError if invalid
 * 
 * @example
 * ```typescript
 * validateLamports(1000000000n); // true (1 SOL)
 * validateLamports(-100n); // throws PrismValidationError
 * ```
 */
export function validateLamports(amount: bigint): boolean {
  if (typeof amount !== 'bigint') {
    throw new PrismValidationError(
      'Amount must be a bigint',
      'INVALID_AMOUNT_TYPE',
      { field: 'amount', value: typeof amount }
    );
  }

  if (amount < 0n) {
    throw new PrismValidationError(
      'Amount cannot be negative',
      'NEGATIVE_AMOUNT',
      { field: 'amount', value: amount.toString() }
    );
  }

  // Check for reasonable maximum (2^64 - 1, which is max u64)
  const MAX_LAMPORTS = BigInt('18446744073709551615');
  if (amount > MAX_LAMPORTS) {
    throw new PrismValidationError(
      'Amount exceeds maximum value',
      'AMOUNT_TOO_LARGE',
      { field: 'amount', value: amount.toString() }
    );
  }

  return true;
}

/**
 * Validate a context type enum value
 * 
 * @param type - Context type to validate
 * @returns true if valid, throws PrismValidationError if invalid
 * 
 * @example
 * ```typescript
 * validateContextType(ContextType.DeFi); // true
 * validateContextType(999); // throws PrismValidationError
 * ```
 */
export function validateContextType(type: number): boolean {
  if (typeof type !== 'number') {
    throw new PrismValidationError(
      'Context type must be a number',
      'INVALID_CONTEXT_TYPE_TYPE',
      { field: 'type', value: typeof type }
    );
  }

  if (!Number.isInteger(type)) {
    throw new PrismValidationError(
      'Context type must be an integer',
      'INVALID_CONTEXT_TYPE_INTEGER',
      { field: 'type', value: type }
    );
  }

  const validTypes = Object.values(ContextType).filter(v => typeof v === 'number') as number[];
  if (!validTypes.includes(type)) {
    throw new PrismValidationError(
      `Invalid context type: ${type}. Valid types: ${validTypes.join(', ')}`,
      'INVALID_CONTEXT_TYPE',
      { field: 'type', value: type, validTypes }
    );
  }

  return true;
}

/**
 * Validate a privacy level enum value
 * 
 * @param level - Privacy level to validate
 * @returns true if valid, throws PrismValidationError if invalid
 * 
 * @example
 * ```typescript
 * validatePrivacyLevel(PrivacyLevel.High); // true
 * validatePrivacyLevel(999); // throws PrismValidationError
 * ```
 */
export function validatePrivacyLevel(level: number): boolean {
  if (typeof level !== 'number') {
    throw new PrismValidationError(
      'Privacy level must be a number',
      'INVALID_PRIVACY_LEVEL_TYPE',
      { field: 'level', value: typeof level }
    );
  }

  if (!Number.isInteger(level)) {
    throw new PrismValidationError(
      'Privacy level must be an integer',
      'INVALID_PRIVACY_LEVEL_INTEGER',
      { field: 'level', value: level }
    );
  }

  const validLevels = Object.values(PrivacyLevel).filter(v => typeof v === 'number') as number[];
  if (!validLevels.includes(level)) {
    throw new PrismValidationError(
      `Invalid privacy level: ${level}. Valid levels: ${validLevels.join(', ')}`,
      'INVALID_PRIVACY_LEVEL',
      { field: 'level', value: level, validLevels }
    );
  }

  return true;
}

/**
 * Validate a context index (must be non-negative integer)
 * 
 * @param index - Context index to validate
 * @returns true if valid, throws PrismValidationError if invalid
 * 
 * @example
 * ```typescript
 * validateContextIndex(0); // true
 * validateContextIndex(-1); // throws PrismValidationError
 * ```
 */
export function validateContextIndex(index: number): boolean {
  if (typeof index !== 'number') {
    throw new PrismValidationError(
      'Context index must be a number',
      'INVALID_CONTEXT_INDEX_TYPE',
      { field: 'index', value: typeof index }
    );
  }

  if (!Number.isInteger(index)) {
    throw new PrismValidationError(
      'Context index must be an integer',
      'INVALID_CONTEXT_INDEX_INTEGER',
      { field: 'index', value: index }
    );
  }

  if (index < 0) {
    throw new PrismValidationError(
      'Context index cannot be negative',
      'NEGATIVE_CONTEXT_INDEX',
      { field: 'index', value: index }
    );
  }

  // Max u16 value
  if (index > 65535) {
    throw new PrismValidationError(
      'Context index exceeds maximum value (65535)',
      'CONTEXT_INDEX_TOO_LARGE',
      { field: 'index', value: index }
    );
  }

  return true;
}
