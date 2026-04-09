import pino from 'pino';
import { isDev } from './env';

// In development: pino-pretty formats logs as human-readable coloured output.
// In production: plain JSON — structured, fast, and easy to pipe into log aggregators.
const transport = isDev
  ? pino.transport({
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:HH:MM:ss',
        ignore: 'pid,hostname',
        messageFormat: '{msg}',
        singleLine: false,
      },
    })
  : undefined;

export const logger = pino(
  {
    // debug in dev (shows all log levels), info in production
    level: isDev ? 'debug' : 'info',
    // Redact sensitive fields from logs automatically
    redact: {
      paths: ['req.headers.authorization', 'req.headers["x-admin-secret"]', 'body.password'],
      censor: '[REDACTED]',
    },
  },
  transport,
);
