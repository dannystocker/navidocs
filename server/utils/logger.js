/**
 * Unified Logger - All application events in one place
 *
 * Logs are written to both console and file with structured format:
 * [timestamp] LEVEL EVENT_NAME {"context":"json"}
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOG_DIR = path.resolve(__dirname, '../../logs');
const LOG_FILE = path.join(LOG_DIR, 'navidocs.log');

// Ensure log directory exists
try {
  fs.mkdirSync(LOG_DIR, { recursive: true });
} catch (err) {
  console.error('Failed to create log directory:', err);
}

/**
 * Log levels
 */
export const LogLevel = {
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR',
  DEBUG: 'DEBUG'
};

/**
 * Main logging function
 * @param {string} level - Log level (INFO, WARN, ERROR, DEBUG)
 * @param {string} event - Event name (e.g., UPLOAD_START, DB_ERROR)
 * @param {Object} context - Additional context data
 */
export function log(level, event, context = {}) {
  const timestamp = new Date().toISOString();
  const contextStr = Object.keys(context).length > 0 ? JSON.stringify(context) : '';
  const logLine = `[${timestamp}] ${level.padEnd(5)} ${event.padEnd(30)} ${contextStr}\n`;

  // Write to console
  const colorCode = {
    INFO: '\x1b[36m',    // Cyan
    WARN: '\x1b[33m',    // Yellow
    ERROR: '\x1b[31m',   // Red
    DEBUG: '\x1b[90m'    // Gray
  }[level] || '';
  const resetCode = '\x1b[0m';

  console.log(`${colorCode}${logLine.trim()}${resetCode}`);

  // Write to file (async, non-blocking)
  try {
    fs.appendFileSync(LOG_FILE, logLine);
  } catch (err) {
    console.error('Failed to write to log file:', err);
  }
}

/**
 * Convenience methods
 */
export const logger = {
  info: (event, context) => log(LogLevel.INFO, event, context),
  warn: (event, context) => log(LogLevel.WARN, event, context),
  error: (event, context) => log(LogLevel.ERROR, event, context),
  debug: (event, context) => log(LogLevel.DEBUG, event, context)
};

/**
 * Express middleware to log all requests
 */
export function requestLogger(req, res, next) {
  const start = Date.now();

  // Log request
  logger.info('HTTP_REQUEST', {
    method: req.method,
    path: req.path,
    query: req.query,
    ip: req.ip
  });

  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - start;
    const level = res.statusCode >= 400 ? LogLevel.ERROR : LogLevel.INFO;

    log(level, 'HTTP_RESPONSE', {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`
    });
  });

  next();
}

/**
 * Log rotation (call this daily or when file gets too big)
 */
export function rotateLog() {
  try {
    const stats = fs.statSync(LOG_FILE);
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB

    if (stats.size > MAX_SIZE) {
      const timestamp = new Date().toISOString().split('T')[0];
      const archivePath = path.join(LOG_DIR, `navidocs-${timestamp}.log`);
      fs.renameSync(LOG_FILE, archivePath);
      logger.info('LOG_ROTATED', { archive: archivePath });
    }
  } catch (err) {
    console.error('Log rotation failed:', err);
  }
}

export default logger;
