// Prism Protocol - Retry Logic for Network Operations

import { PrismNetworkError } from './errors/PrismNetworkError';
import { getLogger } from './utils/logger';

/**
 * Retry configuration
 */
export interface RetryConfig {
  /**
   * Maximum number of retry attempts (default: 3)
   */
  maxRetries?: number;

  /**
   * Delay between retries in milliseconds (default: 1000)
   */
  retryDelay?: number;

  /**
   * Exponential backoff multiplier (default: 2)
   */
  backoffMultiplier?: number;

  /**
   * Maximum delay between retries in milliseconds (default: 10000)
   */
  maxDelay?: number;

  /**
   * Function to determine if an error should be retried
   */
  shouldRetry?: (error: Error) => boolean;
}

/**
 * Default retry configuration
 */
const DEFAULT_RETRY_CONFIG: Required<RetryConfig> = {
  maxRetries: 3,
  retryDelay: 1000,
  backoffMultiplier: 2,
  maxDelay: 10000,
  shouldRetry: (error: Error) => {
    // Retry on network errors
    if (error instanceof PrismNetworkError) {
      return true;
    }
    
    // Retry on generic errors that might be network-related
    const message = error.message.toLowerCase();
    return (
      message.includes('network') ||
      message.includes('timeout') ||
      message.includes('connection') ||
      message.includes('fetch') ||
      message.includes('rpc')
    );
  }
};

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Calculate delay with exponential backoff
 */
function calculateDelay(attempt: number, config: Required<RetryConfig>): number {
  const baseDelay = config.retryDelay;
  const multiplier = config.backoffMultiplier;
  const delay = baseDelay * Math.pow(multiplier, attempt);
  return Math.min(delay, config.maxDelay);
}

/**
 * Retry a function with exponential backoff
 * 
 * @param fn - Function to retry
 * @param config - Retry configuration
 * @returns Result of the function
 * 
 * @example
 * ```typescript
 * const result = await retry(
 *   () => prism.createContext({ type: ContextType.DeFi }),
 *   { maxRetries: 3, retryDelay: 1000 }
 * );
 * ```
 */
export async function retry<T>(
  fn: () => Promise<T>,
  config: RetryConfig = {}
): Promise<T> {
  const logger = getLogger();
  const retryConfig: Required<RetryConfig> = {
    ...DEFAULT_RETRY_CONFIG,
    ...config
  };

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Check if we should retry
      if (attempt < retryConfig.maxRetries && retryConfig.shouldRetry(lastError)) {
        const delay = calculateDelay(attempt, retryConfig);
        
        logger.warn(
          `Operation failed (attempt ${attempt + 1}/${retryConfig.maxRetries + 1}), retrying in ${delay}ms...`,
          { error: lastError.message }
        );

        await sleep(delay);
        continue;
      }

      // Don't retry - throw the error
      throw lastError;
    }
  }

  // This should never be reached, but TypeScript needs it
  throw lastError || new Error('Retry failed');
}

/**
 * Retry a Solana transaction with simulation
 * 
 * @param fn - Function that sends the transaction
 * @param simulateFn - Function to simulate the transaction first
 * @param config - Retry configuration
 * @returns Transaction signature
 * 
 * @example
 * ```typescript
 * const signature = await retryWithSimulation(
 *   () => program.methods.createContext(...).rpc(),
 *   () => program.methods.createContext(...).simulate(),
 *   { maxRetries: 3 }
 * );
 * ```
 */
export async function retryWithSimulation<T>(
  fn: () => Promise<T>,
  simulateFn: () => Promise<any>,
  config: RetryConfig = {}
): Promise<T> {
  const logger = getLogger();
  
  // First, simulate the transaction
  try {
    logger.debug('Simulating transaction before sending...');
    await simulateFn();
    logger.debug('Transaction simulation successful');
  } catch (simError) {
    logger.warn('Transaction simulation failed', simError);
    // Continue anyway - simulation might fail but transaction could succeed
  }

  // Then retry the actual transaction
  return retry(fn, config);
}
