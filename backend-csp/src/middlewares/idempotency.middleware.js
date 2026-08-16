import prisma from '../config/database.js';

let lastCleanup = 0;
const CLEANUP_INTERVAL = 60_000;

async function cleanupOldKeys() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;
  try {
    await prisma.idempotencyKey.deleteMany({
      where: { createdAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
    });
  } catch { /* noop */ }
}

export const idempotencyMiddleware = async (req, res, next) => {
  const clientId = req.headers['x-client-id'];
  if (!clientId || req.method === 'GET') return next();

  try {
    const existing = await prisma.idempotencyKey.findUnique({ where: { key: clientId } });
    if (existing) {
      return res.status(200).json(existing.response || { message: 'Déjà traité' });
    }
  } catch {
    return next();
  }

  const originalJson = res.json.bind(res);
  res.json = (body) => {
    prisma.idempotencyKey.create({
      data: { key: clientId, response: body, endpoint: req.originalUrl, method: req.method },
    }).catch(() => {});
    return originalJson(body);
  };

  cleanupOldKeys();
  next();
};
