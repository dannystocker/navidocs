/**
 * Request Logging Middleware
 * Logs all HTTP requests with timing
 */

import logger from '../utils/logger.js';

export function requestLogger(req, res, next) {
  const start = Date.now();

  // Log request start
  logger.debug(`→ ${req.method} ${req.path}`, {
    query: req.query,
    body: req.method !== 'GET' ? maskSensitiveData(req.body) : undefined,
  });

  // Capture response
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.http(req.method, req.path, res.statusCode, duration);
  });

  next();
}

// Mask sensitive data in logs
function maskSensitiveData(data) {
  if (!data || typeof data !== 'object') return data;

  const masked = { ...data };
  const sensitiveKeys = ['password', 'token', 'secret', 'apiKey', 'authorization'];

  for (const key of Object.keys(masked)) {
    if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk))) {
      masked[key] = '***REDACTED***';
    }
  }

  return masked;
}
