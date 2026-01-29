// Prism Protocol - Validation Error

import { PrismError } from './PrismError';

/**
 * Error thrown when input validation fails
 * 
 * @example
 * ```typescript
 * try {
 *   await prism.createContext({ type: 999 }); // Invalid type
 * } catch (error) {
 *   if (error instanceof PrismValidationError) {
 *     console.error('Validation failed:', error.code);
 *     console.error('Field:', error.field);
 *   }
 * }
 * ```
 */
export class PrismValidationError extends PrismError {
  /**
   * Field that failed validation
   */
  public readonly field?: string;

  /**
   * Value that failed validation
   */
  public readonly value?: any;

  constructor(
    message: string,
    code: string = 'VALIDATION_ERROR',
    context?: {
      field?: string;
      value?: any;
      validTypes?: number[];
      validLevels?: number[];
    }
  ) {
    super(message, code, context);
    this.name = 'PrismValidationError';
    this.field = context?.field;
    this.value = context?.value;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, PrismValidationError);
    }
  }
}
