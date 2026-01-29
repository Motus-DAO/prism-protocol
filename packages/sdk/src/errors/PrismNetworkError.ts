// Prism Protocol - Network Error

import { PrismError } from './PrismError';

/**
 * Error thrown when network operations fail
 * 
 * @example
 * ```typescript
 * try {
 *   await prism.createContext({ ... });
 * } catch (error) {
 *   if (error instanceof PrismNetworkError) {
 *     console.error('Network error:', error.code);
 *     // Retry logic here
 *   }
 * }
 * ```
 */
export class PrismNetworkError extends PrismError {
  /**
   * HTTP status code if available
   */
  public readonly statusCode?: number;

  /**
   * URL that failed
   */
  public readonly url?: string;

  constructor(
    message: string,
    code: string = 'NETWORK_ERROR',
    context?: {
      statusCode?: number;
      url?: string;
      originalError?: Error;
      contextIndex?: number;
    }
  ) {
    super(message, code, context);
    this.name = 'PrismNetworkError';
    this.statusCode = context?.statusCode;
    this.url = context?.url;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, PrismNetworkError);
    }
  }
}
