import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received — closing Prisma connection');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received — closing Prisma connection');
  await prisma.$disconnect();
  process.exit(0);
});

export default prisma;
