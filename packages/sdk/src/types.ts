// Prism Protocol Types

import { PublicKey } from '@solana/web3.js';

// ============================================================================
// ENUMS
// ============================================================================

export enum PrivacyLevel {
  Maximum = 0,   // Full anonymity
  High = 1,      // Minimal disclosure
  Medium = 2,    // Balanced
  Low = 3,       // More transparent
  Public = 4     // Fully public
}

export enum ContextType {
  DeFi = 0,        // Dark pool trading, swaps
  Social = 1,      // Social interactions
  Gaming = 2,      // Gaming activities  
  Professional = 3, // Work-related
  Temporary = 4,   // Auto-burn after use
  Public = 5       // Flex mode - fully public
}

// ============================================================================
// ACCOUNT TYPES
// ============================================================================

export interface RootIdentity {
  owner: PublicKey;
  createdAt: number;
  privacyLevel: PrivacyLevel;
  contextCount: number;
  bump: number;
}

export interface ContextIdentity {
  rootIdentity: PublicKey;
  contextType: ContextType;
  createdAt: number;
  maxPerTransaction: bigint;
  totalSpent: bigint;
  revoked: boolean;
  contextIndex: number;
  bump: number;
}

// ============================================================================
// PROOF TYPES
// ============================================================================

export interface SolvencyProof {
  proof: Uint8Array;
  publicInputs: {
    threshold: bigint;
    isSolvent: boolean;
  };
  timestamp: number;
  contextAddress?: PublicKey;
}

export interface ProofRequest {
  type: 'solvency';
  threshold: bigint;
  actualBalance: bigint;
}

// ============================================================================
// CONFIG TYPES
// ============================================================================

export interface PrismConfig {
  rpcUrl: string;
  programId?: PublicKey;
  commitment?: 'processed' | 'confirmed' | 'finalized';
}

export interface CreateContextOptions {
  type: ContextType;
  privacyLevel?: PrivacyLevel;
  maxPerTransaction?: bigint;
}

export interface CreateRootOptions {
  privacyLevel?: PrivacyLevel;
}

// ============================================================================
// RESULT TYPES
// ============================================================================

export interface CreateRootResult {
  rootAddress: PublicKey;
  signature: string;
  privacyLevel: PrivacyLevel;
}

export interface CreateContextResult {
  contextAddress: PublicKey;
  signature: string;
  contextType: ContextType;
  contextIndex: number;
  rootIdentityHash?: string;
  encryptionCommitment?: string;
}

export interface RevokeContextResult {
  signature: string;
  contextAddress: PublicKey;
  totalSpent: bigint;
}
