// Prism Protocol - Proof Error

import { PrismError } from './PrismError';

/**
 * Error thrown when proof generation or verification fails
 * 
 * @example
 * ```typescript
 * try {
 *   const proof = await prism.generateSolvencyProof({
 *     actualBalance: 100n,
 *     threshold: 1000n // Balance too low!
 *   });
 * } catch (error) {
 *   if (error instanceof PrismProofError) {
 *     console.error('Proof error:', error.code);
 *     console.error('Reason:', error.reason);
 *   }
 * }
 * ```
 */
export class PrismProofError extends PrismError {
  /**
   * Reason for proof failure
   */
  public readonly reason?: string;

  /**
   * Proof type that failed
   */
  public readonly proofType?: string;

  constructor(
    message: string,
    code: string = 'PROOF_ERROR',
    context?: {
      reason?: string;
      proofType?: string;
      actualBalance?: bigint;
      threshold?: bigint;
    }
  ) {
    super(message, code, context);
    this.name = 'PrismProofError';
    this.reason = context?.reason;
    this.proofType = context?.proofType;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, PrismProofError);
    }
  }
}
