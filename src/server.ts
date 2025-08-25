import app from './app';
import { config } from './config/environment';
import { logger } from './core/utils/loggers';

async function startServer() {
  try {
    await app.start(config.port);
  } catch (err) {
    logger.error(`Failed to start application on port ${config.port}:`, err);
    process.exit(1);
  }
}

process.on('SIGTERM', () => {
  logger.info('Received SIGTERM. Shutting down gracefully...');
  app.server.close(() => {
    logger.info('Server closed.');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

startServer();
