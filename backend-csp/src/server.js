import app from './app.js';
import prisma from './config/database.js';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`[API-SCHOOL] Server running on port ${PORT} (${process.env.NODE_ENV || 'development'})`);
  console.log(`[API-SCHOOL] PID: ${process.pid}`);
});

// Graceful shutdown
const shutdown = async (signal) => {
  console.log(`\n[API-SCHOOL] ${signal} received — shutting down gracefully...`);
  server.close(async () => {
    await prisma.$disconnect();
    console.log('[API-SCHOOL] Database disconnected. Exiting.');
    process.exit(0);
  });
  // Force exit after 10s
  setTimeout(() => {
    console.error('[API-SCHOOL] Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('unhandledRejection', (err) => {
  console.error('[API-SCHOOL] Unhandled rejection:', err);
});
process.on('uncaughtException', (err) => {
  console.error('[API-SCHOOL] Uncaught exception:', err);
  shutdown('uncaughtException');
});
