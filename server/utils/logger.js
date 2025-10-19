/**
 * Centralized Logging Utility
 * Provides consistent logging with timestamps and context
 */

const LOG_LEVELS = {
  ERROR: 'ERROR',
  WARN: 'WARN',
  INFO: 'INFO',
  DEBUG: 'DEBUG',
};

const COLORS = {
  ERROR: '\x1b[31m',   // Red
  WARN: '\x1b[33m',    // Yellow
  INFO: '\x1b[36m',    // Cyan
  DEBUG: '\x1b[90m',   // Gray
  RESET: '\x1b[0m',
  BOLD: '\x1b[1m',
};

class Logger {
  constructor(context = 'App') {
    this.context = context;
    this.logLevel = process.env.LOG_LEVEL || 'INFO';
  }

  shouldLog(level) {
    const levels = Object.keys(LOG_LEVELS);
    const currentLevelIndex = levels.indexOf(this.logLevel);
    const requestedLevelIndex = levels.indexOf(level);
    return requestedLevelIndex <= currentLevelIndex;
  }

  formatMessage(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const color = COLORS[level] || '';
    const reset = COLORS.RESET;
    const bold = COLORS.BOLD;

    let formattedMessage = `${color}${bold}[${timestamp}] [${level}] [${this.context}]${reset}${color} ${message}${reset}`;

    if (data) {
      formattedMessage += `\n${color}${JSON.stringify(data, null, 2)}${reset}`;
    }

    return formattedMessage;
  }

  error(message, error = null) {
    if (!this.shouldLog('ERROR')) return;

    const data = error ? {
      message: error.message,
      stack: error.stack,
      ...error,
    } : null;

    console.error(this.formatMessage('ERROR', message, data));
  }

  warn(message, data = null) {
    if (!this.shouldLog('WARN')) return;
    console.warn(this.formatMessage('WARN', message, data));
  }

  info(message, data = null) {
    if (!this.shouldLog('INFO')) return;
    console.log(this.formatMessage('INFO', message, data));
  }

  debug(message, data = null) {
    if (!this.shouldLog('DEBUG')) return;
    console.log(this.formatMessage('DEBUG', message, data));
  }

  // Convenience method for HTTP requests
  http(method, path, statusCode, duration = null) {
    const durationStr = duration ? ` (${duration}ms)` : '';
    const statusColor = statusCode >= 400 ? COLORS.ERROR : statusCode >= 300 ? COLORS.WARN : COLORS.INFO;
    const message = `${statusColor}${method} ${path} ${statusCode}${durationStr}${COLORS.RESET}`;

    if (this.shouldLog('INFO')) {
      console.log(this.formatMessage('INFO', message));
    }
  }

  // Create a child logger with additional context
  child(additionalContext) {
    return new Logger(`${this.context}:${additionalContext}`);
  }
}

// Create default logger instance
const logger = new Logger();

// Create context-specific loggers
const loggers = {
  app: logger,
  upload: logger.child('Upload'),
  ocr: logger.child('OCR'),
  search: logger.child('Search'),
  db: logger.child('Database'),
  meilisearch: logger.child('Meilisearch'),
};

export default logger;
export { Logger, loggers };
