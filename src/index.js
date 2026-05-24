import { createApp } from './app.js';
import { config } from './config.js';
import { initDatabase, closePool } from './db/database.js';
import { initOtpModule } from './otp/index.js';
import { seedIfEmpty } from './seed.js';

async function main() {
  try {
    console.log('Starting database initialization...');
    await initDatabase();
    await initOtpModule();
    console.log('PostgreSQL connected and schema ready');
  } catch (err) {
    console.error('Database initialization failed:', err);
    throw err;
  }

  if (config.seedOnStartup) {
    await seedIfEmpty();
  }

  const app = createApp();
  const server = app.listen(config.port, config.host, () => {
    console.log(
      `Sakal Maratha API listening on ${config.host}:${config.port} (${config.nodeEnv})`
    );
    console.log('Health check: GET /api/health');
  });

  server.on('error', (err) => {
    console.error('HTTP server error:', err);
  });

  function shutdown(signal) {
    console.log(`${signal} received — shutting down`);
    server.close(async () => {
      await closePool();
      console.log('HTTP server and database pool closed');
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000);
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

// Log uncaught errors for easier debugging in container logs
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

main().catch((err) => {
  console.error('Failed to start:', err);
  process.exit(1);
});
