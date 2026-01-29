// Prism Protocol - Structured Logging

/**
 * Log levels
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4
}

/**
 * Logger interface for structured logging
 */
export interface Logger {
  /**
   * Log debug message (development only)
   */
  debug(msg: string, data?: any): void;

  /**
   * Log info message
   */
  info(msg: string, data?: any): void;

  /**
   * Log warning message
   */
  warn(msg: string, data?: any): void;

  /**
   * Log error message
   */
  error(msg: string, error?: Error | any, data?: any): void;
}

/**
 * Default logger implementation using console
 */
class ConsoleLogger implements Logger {
  private level: LogLevel;

  constructor(level: LogLevel = LogLevel.INFO) {
    this.level = level;
  }

  debug(msg: string, data?: any): void {
    if (this.level <= LogLevel.DEBUG) {
      if (data !== undefined) {
        console.debug(`[Prism] ${msg}`, data);
      } else {
        console.debug(`[Prism] ${msg}`);
      }
    }
  }

  info(msg: string, data?: any): void {
    if (this.level <= LogLevel.INFO) {
      if (data !== undefined) {
        console.log(`[Prism] ${msg}`, data);
      } else {
        console.log(`[Prism] ${msg}`);
      }
    }
  }

  warn(msg: string, data?: any): void {
    if (this.level <= LogLevel.WARN) {
      if (data !== undefined) {
        console.warn(`[Prism] ⚠ ${msg}`, data);
      } else {
        console.warn(`[Prism] ⚠ ${msg}`);
      }
    }
  }

  error(msg: string, error?: Error | any, data?: any): void {
    if (this.level <= LogLevel.ERROR) {
      const errorData: any = { message: msg };
      
      if (error) {
        if (error instanceof Error) {
          errorData.error = {
            name: error.name,
            message: error.message,
            stack: error.stack
          };
        } else {
          errorData.error = error;
        }
      }

      if (data) {
        errorData.data = data;
      }

      console.error(`[Prism] ❌ ${msg}`, errorData);
    }
  }

  /**
   * Set log level
   */
  setLevel(level: LogLevel): void {
    this.level = level;
  }

  /**
   * Get current log level
   */
  getLevel(): LogLevel {
    return this.level;
  }
}

/**
 * Silent logger that doesn't output anything
 */
class SilentLogger implements Logger {
  debug(_msg: string, _data?: any): void {}
  info(_msg: string, _data?: any): void {}
  warn(_msg: string, _data?: any): void {}
  error(_msg: string, _error?: Error | any, _data?: any): void {}
}

/**
 * Create a logger instance
 * 
 * @param level - Log level (default: INFO)
 * @param silent - If true, returns a silent logger (default: false)
 * @returns Logger instance
 * 
 * @example
 * ```typescript
 * const logger = createLogger(LogLevel.DEBUG);
 * logger.info('SDK initialized');
 * logger.error('Operation failed', error);
 * ```
 */
export function createLogger(level: LogLevel = LogLevel.INFO, silent: boolean = false): Logger {
  if (silent) {
    return new SilentLogger();
  }
  return new ConsoleLogger(level);
}

/**
 * Default logger instance
 */
let defaultLogger: Logger | null = null;

/**
 * Get or create the default logger
 */
export function getLogger(): Logger {
  if (!defaultLogger) {
    // Check for environment variable
    const envLevel = process.env.PRISM_LOG_LEVEL?.toUpperCase();
    let level = LogLevel.INFO;
    
    if (envLevel === 'DEBUG') level = LogLevel.DEBUG;
    else if (envLevel === 'INFO') level = LogLevel.INFO;
    else if (envLevel === 'WARN') level = LogLevel.WARN;
    else if (envLevel === 'ERROR') level = LogLevel.ERROR;
    else if (envLevel === 'NONE') level = LogLevel.NONE;

    defaultLogger = createLogger(level);
  }
  return defaultLogger;
}

/**
 * Set the default logger
 */
export function setLogger(logger: Logger): void {
  defaultLogger = logger;
}
