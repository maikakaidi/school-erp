import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './config/swagger.js';
import { errorHandler } from './middlewares/error.middleware.js';
import { localeMiddleware } from './middlewares/locale.middleware.js';
import { idempotencyMiddleware } from './middlewares/idempotency.middleware.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Import routes
import authRoutes from './modules/auth/auth.routes.js';
import schoolRoutes from './modules/schools/schools.routes.js';
import superAdminRoutes from './modules/super-admin/superAdmin.routes.js';
import elevesRoutes from './modules/eleves/eleves.routes.js';
import enseignantsRoutes from './modules/enseignants/enseignants.routes.js';
import classesRoutes from './modules/classes/classes.routes.js';
import notesRoutes from './modules/notes/notes.routes.js';
import versementsRoutes from './modules/versements/versements.routes.js';
import bulletinsRoutes from './modules/bulletins/bulletins.routes.js';
import examensRoutes from './modules/examens/examens.routes.js';
import depensesRoutes from './modules/depenses/depenses.routes.js';
import statistiquesRoutes from './modules/statistiques/statistiques.routes.js';
import settingsRoutes from './modules/settings/settings.routes.js';
import inscriptionsRoutes from './modules/inscriptions/inscriptions.routes.js';
import fraisRoutes from './modules/frais/frais.routes.js';
import matieresRoutes from './modules/matieres/matieres.routes.js';
import coefficientsRoutes from './modules/coefficients/coefficients.routes.js';
import horairesRoutes from './modules/horaires/horaires.routes.js';
import salairesRoutes from './modules/salaires/salaires.routes.js';
import notificationsRoutes from './modules/notifications/notifications.routes.js';
import parentsRoutes from './modules/parents/parents.routes.js';
import parentRoutes from './modules/parent/parent.routes.js';
import absencesRoutes from './modules/absences/absences.routes.js';
import annoncesRoutes from './modules/annonces/annonces.routes.js';
import affectationsRoutes from './modules/affectations/affectations.routes.js';
import profRoutes from './modules/prof/prof.routes.js';
import eleveRoutes from './modules/eleve/eleve.routes.js';
import messagesRoutes from './modules/messages/messages.routes.js';
import rapportsRoutes from './modules/rapports/rapports.routes.js';
import academicYearsRoutes from './modules/academic-years/academicYears.routes.js';
import exportRoutes from './modules/export/export.routes.js';

const app = express();

// Security
const cspDirectives = helmet.contentSecurityPolicy.getDefaultDirectives();
cspDirectives['img-src'] = ["'self'", 'data:', 'blob:', 'https://res.cloudinary.com'];
cspDirectives['connect-src'] = ["'self'", 'https://res.cloudinary.com'];
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: { directives: cspDirectives },
}));
const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:3000,http://127.0.0.1:3000')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);
// CORS : autorise la liste blanche + toute requête same-origin
// (le navigateur envoie un header Origin sur les sous-ressources `crossorigin`
// servies par ce même serveur : scripts modules, feuilles de style)
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && !allowedOrigins.includes(origin)) {
    try {
      const sameOrigin = `${req.protocol}://${req.get('host')}`;
      if (origin !== sameOrigin) {
        const err = new Error('Origine non autorisée');
        err.status = 403;
        return next(err);
      }
    } catch {
      const err = new Error('Origine non autorisée');
      err.status = 403;
      return next(err);
    }
  }
  return cors({ origin: true, credentials: true })(req, res, next);
});
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('src/uploads'));

// Idempotency — sur les mutations (POST/PUT/PATCH/DELETE) avec X-Client-Id
app.use((req, res, next) => {
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method) && req.headers['x-client-id']) {
    return idempotencyMiddleware(req, res, next);
  }
  next();
});

// Rate limiting — global (très large, pour éviter les abus)
const globalLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 1000 });
app.use(globalLimiter);

// Rate limiting — par école (plus strict)
const schoolLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 120, // 120 requêtes/minute par école
  keyGenerator: (req) => req.user?.schoolId || req.ip,
  message: { message: 'Trop de requêtes, veuillez réessayer dans 1 minute' },
});

// Rate limiting — Super Admin (plus strict, route critique)
const superAdminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 60, // 60 requêtes / 15 min
  message: { message: 'Trop de requêtes, veuillez réessayer plus tard' },
});

// Locale middleware (AVANT les routes pour que req.t() soit disponible partout)
app.use(localeMiddleware);

// Structured request logger
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const ms = Date.now() - start;
    const level = res.statusCode >= 500 ? 'ERROR' : res.statusCode >= 400 ? 'WARN' : 'INFO';
    const log = { level, method: req.method, path: req.originalUrl, status: res.statusCode, ms, ts: new Date().toISOString() };
    if (req.user?.schoolId) log.schoolId = req.user.schoolId;
    if (level !== 'INFO') console.error(JSON.stringify(log));
    else if (process.env.NODE_ENV !== 'production' || ms > 1000) console.log(JSON.stringify(log));
  });
  next();
});

// Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes publiques — rate limit strict sur auth (anti brute force)
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 30 });
app.use('/api/auth', authLimiter, authRoutes);

// Routes protegees
app.use('/api/schools', schoolRoutes);
app.use('/api/super-admin', superAdminLimiter, superAdminRoutes);
app.use('/api/eleves', elevesRoutes);
app.use('/api/enseignants', enseignantsRoutes);
app.use('/api/classes', classesRoutes);
app.use('/api/notes', notesRoutes);
app.use('/api/versements', versementsRoutes);
app.use('/api/bulletins', bulletinsRoutes);
app.use('/api/examens', examensRoutes);
app.use('/api/depenses', depensesRoutes);
app.use('/api/statistiques', statistiquesRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/inscriptions', inscriptionsRoutes);
app.use('/api/frais', fraisRoutes);
app.use('/api/matieres', matieresRoutes);
app.use('/api/coefficients', coefficientsRoutes);
app.use('/api/horaires', horairesRoutes);
app.use('/api/salaires', salairesRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/parents', parentsRoutes);
app.use('/api/parent', parentRoutes);
app.use('/api/absences', absencesRoutes);
app.use('/api/annonces', annoncesRoutes);
app.use('/api/affectations', affectationsRoutes);
app.use('/api/prof', profRoutes);
app.use('/api/eleve', eleveRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/rapports', rapportsRoutes);
app.use('/api/academic-years', academicYearsRoutes);
app.use('/api/export', exportRoutes);

// Health check — with DB ping
import prisma from './config/database.js';
app.get('/health', async (req, res) => {
  const start = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    const dbMs = Date.now() - start;
    res.status(200).json({ status: 'OK', db: 'connected', dbMs, uptime: process.uptime() | 0 });
  } catch (err) {
    res.status(503).json({ status: 'DEGRADED', db: 'disconnected', error: err.message });
  }
});

// Servir le frontend buildé (production, un seul service)
const frontendDist = path.resolve(__dirname, '../../frontend-csp/dist');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.use((req, res, next) => {
    if (req.method !== 'GET' || req.path.startsWith('/api') || req.path.startsWith('/uploads')) return next();
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

app.use(errorHandler);
export default app;
