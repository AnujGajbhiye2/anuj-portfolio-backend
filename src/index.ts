import { createApp } from './app';
import { env } from './config/env';
import { logger } from './config/logger';
import { runMigrations } from './db/migrate';

// Run migrations before accepting any requests
runMigrations();

const app = createApp();

const server = app.listen(env.PORT, () => {
  logger.info(
    { port: env.PORT, env: env.NODE_ENV },
    `🚀  server listening on http://localhost:${env.PORT}`,
  );
});

// Graceful shutdown — lets in-flight requests finish before the process exits
function shutdown(signal: string): void {
  logger.info({ signal }, 'shutdown signal received — closing server');
  server.close(() => {
    logger.info('server closed');
    process.exit(0);
  });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
