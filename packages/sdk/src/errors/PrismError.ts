// Prism Protocol - Base Error Class

/**
 * Base error class for all Prism Protocol errors
 * 
 * @example
 * ```typescript
 * throw new PrismError('Operation failed', 'OPERATION_FAILED', { context: 'createContext' });
 * ```
 */
export class PrismError extends Error {
  /**
   * Error code for programmatic error handling
   */
  public readonly code: string;

  /**
   * Additional context about the error
   */
  public readonly context?: any;

  /**
   * Timestamp when the error occurred
   */
  public readonly timestamp: number;

  constructor(
    message: string,
    code: string,
    context?: any
  ) {
    super(message);
    this.name = 'PrismError';
    this.code = code;
    this.context = context;
    this.timestamp = Date.now();

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, PrismError);
    }
  }

  /**
   * Convert error to JSON for logging
   */
  toJSON(): object {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      context: this.context,
      timestamp: this.timestamp,
      stack: this.stack
    };
  }
}
