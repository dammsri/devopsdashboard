/**
 * Centralized logging utility for the frontend.
 * Supports log levels and environment-aware output.
 */

const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
};

// Default to INFO in production, DEBUG in development
const CURRENT_LOG_LEVEL = import.meta.env.DEV ? LOG_LEVELS.DEBUG : LOG_LEVELS.INFO;

const formatMessage = (level, message, extra = {}) => {
  const timestamp = new Date().toISOString();
  return {
    timestamp,
    level,
    service: 'dashboard-frontend',
    message,
    ...extra,
  };
};

const logger = {
  debug: (message, extra) => {
    if (CURRENT_LOG_LEVEL <= LOG_LEVELS.DEBUG) {
      console.debug('%c[DEBUG]', 'color: #7f8c8d; font-weight: bold;', formatMessage('DEBUG', message, extra));
    }
  },
  info: (message, extra) => {
    if (CURRENT_LOG_LEVEL <= LOG_LEVELS.INFO) {
      console.info('%c[INFO]', 'color: #3498db; font-weight: bold;', formatMessage('INFO', message, extra));
    }
  },
  warn: (message, extra) => {
    if (CURRENT_LOG_LEVEL <= LOG_LEVELS.WARN) {
      console.warn('%c[WARN]', 'color: #f39c12; font-weight: bold;', formatMessage('WARN', message, extra));
    }
  },
  error: (message, extra) => {
    if (CURRENT_LOG_LEVEL <= LOG_LEVELS.ERROR) {
      console.error('%c[ERROR]', 'color: #e74c3c; font-weight: bold;', formatMessage('ERROR', message, extra));
    }
  },
};

export default logger;
