/**
 * Simple logger for React Native frontend
 * Replaces winston which is not compatible with React Native
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const currentLevel: LogLevel = __DEV__ ? 'debug' : 'info';

const formatTimestamp = () => new Date().toISOString();

const safeSerialize = (value: unknown): string => {
  try {
    return JSON.stringify(value);
  } catch {
    return '"[unserializable]"';
  }
};

const formatMessage = (level: LogLevel, message: string, ...meta: unknown[]) => {
  const timestamp = formatTimestamp();
  const metaStr = meta.length > 0 ? ` ${safeSerialize(meta)}` : '';
  return `[${timestamp}] [${level.toUpperCase()}] ireport-frontend: ${message}${metaStr}`;
};

const logger = {
  debug: (message: string, ...meta: unknown[]) => {
    if (LOG_LEVELS.debug >= LOG_LEVELS[currentLevel]) {
      console.debug(formatMessage('debug', message, ...meta));
    }
  },

  info: (message: string, ...meta: unknown[]) => {
    if (LOG_LEVELS.info >= LOG_LEVELS[currentLevel]) {
      console.info(formatMessage('info', message, ...meta));
    }
  },

  warn: (message: string, ...meta: unknown[]) => {
    if (LOG_LEVELS.warn >= LOG_LEVELS[currentLevel]) {
      console.warn(formatMessage('warn', message, ...meta));
    }
  },

  error: (message: string, ...meta: unknown[]) => {
    if (LOG_LEVELS.error >= LOG_LEVELS[currentLevel]) {
      console.error(formatMessage('error', message, ...meta));
    }
  },
};

export default logger;
