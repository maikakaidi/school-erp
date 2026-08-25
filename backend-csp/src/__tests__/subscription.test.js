import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import prisma from '../config/database.js';

// ═══════════════════════════════════════════════════════
//  BESOIN 2 — Abonnement côté école
//
//  Tests de :
//  1. getSchoolProfile retourne les champs d'abonnement
//  2. Scoping par schoolId (pas de fuite inter-écoles)
//  3. Calcul jours restants — abonnement actif
//  4. Calcul jours restants — période d'essai
//  5. Calcul jours restants — abonnement expiré
//  6. Renouvellement : ancienne date → nouvelle date
// ═══════════════════════════════════════════════════════

const SCHOOL_A = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
const SCHOOL_B = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22';

let db;
const patches = [];

function patch(obj, methodName, impl) {
  const original = obj[methodName];
  obj[methodName] = async (...args) => impl(...args);
  patches.push({ obj, methodName, original });
}

function restore() {
  for (const { obj, methodName, original } of patches.reverse()) obj[methodName] = original;
  patches.length = 0;
}

beforeEach(() => {
  db = new Map();
  db.set(SCHOOL_A, {
    id: SCHOOL_A,
    name: 'École A',
    phone: '00112233',
    subscriptionStatus: 'active',
    trialDays: 15,
    subscriptionStart: new Date('2025-09-01'),
    subscriptionEnd: new Date('2026-09-01'),
    createdAt: new Date('2025-09-01'),
    isActive: true,
  });
  db.set(SCHOOL_B, {
    id: SCHOOL_B,
    name: 'École B',
    phone: '44556677',
    subscriptionStatus: 'trial',
    trialDays: 15,
    subscriptionStart: null,
    subscriptionEnd: null,
    createdAt: new Date(Date.now() - 5 * 86400000),
    isActive: true,
  });

  patch(prisma.school, 'findUnique', async ({ where }) => {
    return db.get(where.id) || null;
  });
  patch(prisma.school, 'findMany', async () => {
    return [...db.values()];
  });
  patch(prisma.school, 'update', async ({ where, data }) => {
    const school = db.get(where.id);
    if (!school) throw new Error('School not found');
    const updated = { ...school, ...data };
    db.set(where.id, updated);
    return updated;
  });
});

afterEach(() => {
  restore();
});

// ─── T1. getSchoolProfile retourne les champs d'abonnement ───
it('T1. getSchoolProfile retourne subscriptionStatus, subscriptionEnd, trialDays, createdAt', async () => {
  const service = await import('../modules/schools/schools.service.js');
  const profile = await service.getSchoolProfile(SCHOOL_A);
  assert.strictEqual(profile.subscriptionStatus, 'active');
  assert.ok(profile.subscriptionEnd instanceof Date);
  assert.strictEqual(profile.trialDays, 15);
  assert.ok(profile.createdAt instanceof Date);
  assert.strictEqual(profile.name, 'École A');
});

// ─── T2. Scoping : getSchoolProfile ne retourne que l'école demandée ───
it('T2. getSchoolProfile(SCHOOL_A) ne retourne PAS les données de SCHOOL_B', async () => {
  const service = await import('../modules/schools/schools.service.js');
  const profileA = await service.getSchoolProfile(SCHOOL_A);
  assert.strictEqual(profileA.id, SCHOOL_A);
  assert.strictEqual(profileA.name, 'École A');
  assert.strictEqual(profileA.subscriptionStatus, 'active');

  const profileB = await service.getSchoolProfile(SCHOOL_B);
  assert.strictEqual(profileB.id, SCHOOL_B);
  assert.strictEqual(profileB.name, 'École B');
  assert.strictEqual(profileB.subscriptionStatus, 'trial');
});

// ─── T3. Calcul jours restants — abonnement actif ───
it('T3. Jours restants calculés correctement pour un abonnement actif', async () => {
  const now = new Date();
  const end = new Date(now.getTime() + 30 * 86400000);
  db.set(SCHOOL_A, { ...db.get(SCHOOL_A), subscriptionStatus: 'active', subscriptionEnd: end });

  const service = await import('../modules/schools/schools.service.js');
  const profile = await service.getSchoolProfile(SCHOOL_A);

  const diff = new Date(profile.subscriptionEnd) - now;
  const daysRemaining = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  assert.ok(daysRemaining >= 29 && daysRemaining <= 30, `Expected ~30 days, got ${daysRemaining}`);
});

// ─── T4. Calcul jours restants — période d'essai ───
it('T4. Jours restants calculés correctement pour un essai', async () => {
  const createdAt = new Date(Date.now() - 5 * 86400000);
  db.set(SCHOOL_A, { ...db.get(SCHOOL_A), subscriptionStatus: 'trial', createdAt, subscriptionEnd: null });

  const service = await import('../modules/schools/schools.service.js');
  const profile = await service.getSchoolProfile(SCHOOL_A);

  const trialMs = (profile.trialDays || 15) * 86400000;
  const endDate = new Date(createdAt.getTime() + trialMs);
  const daysRemaining = Math.max(0, Math.ceil((endDate - new Date()) / (1000 * 60 * 60 * 24)));
  assert.ok(daysRemaining >= 9 && daysRemaining <= 11, `Expected ~10 days, got ${daysRemaining}`);
});

// ─── T5. Calcul jours restants — abonnement expiré ───
it('T5. Jours restants = 0 pour un abonnement expiré', async () => {
  const past = new Date(Date.now() - 10 * 86400000);
  db.set(SCHOOL_A, { ...db.get(SCHOOL_A), subscriptionStatus: 'expired', subscriptionEnd: past });

  const service = await import('../modules/schools/schools.service.js');
  const profile = await service.getSchoolProfile(SCHOOL_A);

  const diff = new Date(profile.subscriptionEnd) - new Date();
  const daysRemaining = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  assert.strictEqual(daysRemaining, 0);
});

// ─── T6. Renouvellement : ancienne date → nouvelle date après rafraîchissement ───
it('T6. Après renouvellement, getSchoolProfile retourne la nouvelle date d\'expiration', async () => {
  const oldEnd = new Date(Date.now() + 5 * 86400000);
  db.set(SCHOOL_A, { ...db.get(SCHOOL_A), subscriptionStatus: 'active', subscriptionEnd: oldEnd });

  const service = await import('../modules/schools/schools.service.js');
  const before = await service.getSchoolProfile(SCHOOL_A);
  const oldDays = Math.max(0, Math.ceil((new Date(before.subscriptionEnd) - new Date()) / (1000 * 60 * 60 * 24)));
  assert.ok(oldDays <= 6, `Before renewal: expected ≤6 days, got ${oldDays}`);

  const newEnd = new Date(Date.now() + 365 * 86400000);
  await prisma.school.update({ where: { id: SCHOOL_A }, data: { subscriptionEnd: newEnd } });

  const after = await service.getSchoolProfile(SCHOOL_A);
  const newDays = Math.max(0, Math.ceil((new Date(after.subscriptionEnd) - new Date()) / (1000 * 60 * 60 * 24)));
  assert.ok(newDays >= 364, `After renewal: expected ≥364 days, got ${newDays}`);
  assert.ok(newDays > oldDays, 'New days should exceed old days');
});

// ─── T7. Le controller utilise req.user.schoolId (scoping auth) ───
it('T7. getProfile controller utilise schoolId du token (pas de paramètre utilisateur)', async () => {
  const controller = await import('../modules/schools/schools.controller.js');
  let result = null;
  const req = { user: { schoolId: SCHOOL_A } };
  const res = { json: (d) => { result = d; } };
  const next = (err) => { if (err) throw err; };

  await controller.getProfile(req, res, next);
  assert.strictEqual(result.id, SCHOOL_A);
  assert.strictEqual(result.subscriptionStatus, 'active');
});

// ─── T8. Le controller ne peut pas être dévié vers une autre école ───
it('T8. getProfile ignore tout schoolId dans le body — scope toujours par token', async () => {
  const controller = await import('../modules/schools/schools.controller.js');
  let result = null;
  const req = { user: { schoolId: SCHOOL_A }, body: { id: SCHOOL_B } };
  const res = { json: (d) => { result = d; } };
  const next = (err) => { if (err) throw err; };

  await controller.getProfile(req, res, next);
  assert.strictEqual(result.id, SCHOOL_A, 'Must return SCHOOL_A, not SCHOOL_B');
  assert.strictEqual(result.name, 'École A');
});

// ─── T9. Calcul jours restants = 0 pour essai expiré (> trialDays) ───
it('T9. Jours restants = 0 pour un essai expiré', async () => {
  const createdAt = new Date(Date.now() - 20 * 86400000);
  db.set(SCHOOL_A, { ...db.get(SCHOOL_A), subscriptionStatus: 'trial', trialDays: 15, createdAt, subscriptionEnd: null });

  const service = await import('../modules/schools/schools.service.js');
  const profile = await service.getSchoolProfile(SCHOOL_A);

  const trialMs = (profile.trialDays || 15) * 86400000;
  const endDate = new Date(createdAt.getTime() + trialMs);
  const daysRemaining = Math.max(0, Math.ceil((endDate - new Date()) / (1000 * 60 * 60 * 24)));
  assert.strictEqual(daysRemaining, 0);
});

// ─── T10. getSchoolProfile inclut bien tous les champs requis pour le frontend ───
it('T10. Profil contient subscriptionStart, subscriptionEnd, trialDays, createdAt', async () => {
  const service = await import('../modules/schools/schools.service.js');
  const profile = await service.getSchoolProfile(SCHOOL_A);
  assert.ok('subscriptionStatus' in profile, 'Missing subscriptionStatus');
  assert.ok('subscriptionStart' in profile, 'Missing subscriptionStart');
  assert.ok('subscriptionEnd' in profile, 'Missing subscriptionEnd');
  assert.ok('trialDays' in profile, 'Missing trialDays');
  assert.ok('createdAt' in profile, 'Missing createdAt');
});
