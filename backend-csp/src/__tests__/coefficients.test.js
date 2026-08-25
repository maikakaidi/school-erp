import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import prisma from '../config/database.js';

// ═══════════════════════════════════════════════════════
//  BUG COEFFICIENT 5 → « — » : tests de régression
//
//  Représentation canonique :
//   - coefficient numérique => ligne Coefficient présente (upsert)
//   - « — » (null)          => ligne Coefficient absente (deleteMany)
//
//  NB: mock.method(node:test) est incompatible avec les delegates
//  Prisma (proxy) => patch manuel save/restore ci-dessous.
// ═══════════════════════════════════════════════════════

const SCHOOL = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
const SCHOOL2 = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a99';
const CLASSE = '550e8400-e29b-41d4-a716-446655440000';
const MATIERE = '550e8400-e29b-41d4-a716-446655440001';
const ANNEE = '2025-2026';

const bodyWith = (coefficient) =>
  ({ classeId: CLASSE, matiereId: MATIERE, anneeScolaire: ANNEE, coefficient });

// DB simulée : clé composite (classeId|matiereId|anneeScolaire)
const keyOf = (classeId, matiereId, anneeScolaire) => `${classeId}|${matiereId}|${anneeScolaire}`;
let db;
const patches = [];

function patch(obj, methodName, impl) {
  const original = obj[methodName];
  let calls = 0;
  obj[methodName] = async (...args) => { calls++; return impl(...args); };
  patches.push({ obj, methodName, original });
  return { get callCount() { return calls; } };
}

beforeEach(() => {
  db = new Map();
  patch(prisma.coefficient, 'upsert', async ({ where, update, create }) => {
    const w = where.classeId_matiereId_anneeScolaire;
    const k = keyOf(w.classeId, w.matiereId, w.anneeScolaire);
    const existing = db.get(k);
    if (existing) {
      const updated = { ...existing, ...update };
      db.set(k, updated);
      return updated;
    }
    const created = { id: `coeff-${db.size + 1}`, schoolId: create.schoolId, ...create };
    db.set(k, created);
    return created;
  });
  patch(prisma.coefficient, 'deleteMany', async ({ where }) => {
    if (!where.id) {
      const k = keyOf(where.classeId, where.matiereId, where.anneeScolaire);
      const row = db.get(k);
      const existed = !!row && row.schoolId === where.schoolId;
      if (existed) db.delete(k);
      return { count: existed ? 1 : 0 };
    }
    let count = 0;
    for (const [k, row] of db.entries()) {
      if (row.id === where.id && row.schoolId === where.schoolId) { db.delete(k); count++; }
    }
    return { count };
  });
});
afterEach(() => {
  for (const { obj, methodName, original } of patches.reverse()) obj[methodName] = original;
  patches.length = 0;
});

async function callUpsert(body, schoolId = SCHOOL) {
  const ctrl = await import('../modules/coefficients/coefficients.controller.js');
  let result, statusCode, nextError;
  const res = {
    json: (d) => { result = d; return res; },
    status: (c) => { statusCode = c; return res; },
    send: () => res,
  };
  await ctrl.upsert({ user: { schoolId }, body }, res, (e) => { nextError = e; });
  return { result, statusCode, nextError };
}

const getRow = () => db.get(keyOf(CLASSE, MATIERE, ANNEE));

// ─── Validation ────────────────────────────────────────
describe('Coefficients Validation — null explicite', () => {
  it('T3a. coefficient null est accepté explicitement', async () => {
    const { createCoefficientSchema } = await import('../modules/coefficients/coefficients.validation.js');
    assert.strictEqual(createCoefficientSchema.parse(bodyWith(null)).coefficient, null);
  });
  it('T3b. coefficient "" est converti en null (demande de suppression)', async () => {
    const { createCoefficientSchema } = await import('../modules/coefficients/coefficients.validation.js');
    assert.strictEqual(createCoefficientSchema.parse(bodyWith('')).coefficient, null);
  });
  it('champ ABSENT n\'est pas confondu avec null => rejeté', async () => {
    const { createCoefficientSchema } = await import('../modules/coefficients/coefficients.validation.js');
    assert.throws(() => createCoefficientSchema.parse({
      classeId: CLASSE, matiereId: MATIERE, anneeScolaire: ANNEE,
    }));
  });
  it('la chaîne « — » n\'est jamais acceptée par l\'API', async () => {
    const { createCoefficientSchema } = await import('../modules/coefficients/coefficients.validation.js');
    assert.throws(() => createCoefficientSchema.parse(bodyWith('—')));
  });
});

describe('Coefficients Validation — contrat existant conservé', () => {
  it('entier positif accepté (5 et 1)', async () => {
    const { createCoefficientSchema } = await import('../modules/coefficients/coefficients.validation.js');
    assert.strictEqual(createCoefficientSchema.parse(bodyWith(5)).coefficient, 5);
    assert.strictEqual(createCoefficientSchema.parse(bodyWith(1)).coefficient, 1);
  });
  it('chaîne numérique acceptée ("5" -> 5)', async () => {
    const { createCoefficientSchema } = await import('../modules/coefficients/coefficients.validation.js');
    assert.strictEqual(createCoefficientSchema.parse(bodyWith('5')).coefficient, 5);
  });
  it('T6. coefficient 0 refusé', async () => {
    const { createCoefficientSchema } = await import('../modules/coefficients/coefficients.validation.js');
    assert.throws(() => createCoefficientSchema.parse(bodyWith(0)));
  });
  it('T7. coefficient négatif refusé', async () => {
    const { createCoefficientSchema } = await import('../modules/coefficients/coefficients.validation.js');
    assert.throws(() => createCoefficientSchema.parse(bodyWith(-2)));
  });
  it('T8. coefficient décimal refusé (contrat entier)', async () => {
    const { createCoefficientSchema } = await import('../modules/coefficients/coefficients.validation.js');
    assert.throws(() => createCoefficientSchema.parse(bodyWith(2.5)));
  });
});

// ─── Flux POST complet (controller + service) ──────────
describe('Coefficients Flux POST — upsert vs clear', () => {
  it('T1. INSERT 5 -> OK, ligne créée via upsert, deleteMany non appelé', async () => {
    const { result, nextError } = await callUpsert(bodyWith(5));
    assert.ok(!nextError, `erreur inattendue: ${nextError}`);
    assert.strictEqual(result.coefficient, 5);
    const row = getRow();
    assert.ok(row, 'ligne attendue en base');
    assert.strictEqual(row.coefficient, 5);
  });

  it('T2. UPDATE 5 -> 4 -> OK, même ligne mise à jour, pas de deleteMany', async () => {
    await callUpsert(bodyWith(5));
    const { result, nextError } = await callUpsert(bodyWith(4));
    assert.ok(!nextError);
    assert.strictEqual(result.coefficient, 4);
    const rows = [...db.values()].filter(r => r.classeId === CLASSE && r.matiereId === MATIERE);
    assert.strictEqual(rows.length, 1, 'une seule ligne pour la clé composite');
    assert.strictEqual(rows[0].coefficient, 4);
  });

  it('T3. UPDATE 5 -> null -> ligne supprimée et réponse de succès normale', async () => {
    await callUpsert(bodyWith(5));
    assert.ok(getRow(), 'prérequis: ligne présente');
    const { result, nextError } = await callUpsert(bodyWith(null));
    assert.ok(!nextError, `erreur inattendue: ${nextError}`);
    assert.deepStrictEqual(result, { count: 1 });
    assert.strictEqual(getRow(), undefined, 'la ligne doit être absente après clear');
  });

  it('T4. « — » -> 5 -> la ligne est recréée', async () => {
    await callUpsert(bodyWith(5));
    await callUpsert(bodyWith(null));
    assert.strictEqual(getRow(), undefined);
    const { result, nextError } = await callUpsert(bodyWith(5));
    assert.ok(!nextError);
    assert.strictEqual(result.coefficient, 5);
    assert.strictEqual(getRow().coefficient, 5);
  });

  it('T5. « — » -> « — » -> aucune erreur, suppression idempotente (count 0)', async () => {
    await callUpsert(bodyWith(null)); // ligne déjà absente
    const { result, nextError } = await callUpsert(bodyWith(null));
    assert.ok(!nextError, 'clear sur ligne absente ne doit pas échouer');
    assert.deepStrictEqual(result, { count: 0 });
    assert.strictEqual(getRow(), undefined);
  });

  it('T6b. POST coefficient 0 -> rejeté par le contrôleur, base inchangée', async () => {
    await callUpsert(bodyWith(5));
    const { nextError, result } = await callUpsert(bodyWith(0));
    assert.ok(nextError, 'ZodError attendue via next(error)');
    assert.strictEqual(nextError.name, 'ZodError');
    assert.strictEqual(result, undefined);
    assert.strictEqual(getRow().coefficient, 5);
  });

  it('T7b. POST coefficient négatif -> rejeté, base inchangée', async () => {
    await callUpsert(bodyWith(5));
    const { nextError } = await callUpsert(bodyWith(-1));
    assert.ok(nextError && nextError.name === 'ZodError');
    assert.strictEqual(getRow().coefficient, 5);
  });

  it('T8b. POST coefficient décimal -> rejeté, base inchangée', async () => {
    await callUpsert(bodyWith(5));
    const { nextError } = await callUpsert(bodyWith(2.5));
    assert.ok(nextError && nextError.name === 'ZodError');
    assert.strictEqual(getRow().coefficient, 5);
  });

  it('scoping école: clear ne supprime que dans sa propre école', async () => {
    await callUpsert(bodyWith(5), SCHOOL);
    const { nextError } = await callUpsert(bodyWith(null), SCHOOL2);
    assert.ok(!nextError);
    assert.strictEqual(db.get(keyOf(CLASSE, MATIERE, ANNEE)).schoolId, SCHOOL,
      'la ligne de l\'autre école doit rester intacte');
  });

  it('T9. coeff propre Arabe (groupeId≠null) upsert OK via POST', async () => {
    const ARABE = '550e8400-e29b-41d4-a716-446655440010';
    const { result, nextError } = await callUpsert({ classeId: CLASSE, matiereId: ARABE, anneeScolaire: ANNEE, coefficient: 4 });
    assert.ok(!nextError, `erreur inattendue: ${nextError}`);
    assert.strictEqual(result.coefficient, 4);
    assert.strictEqual(result.matiereId, ARABE);
  });

  it('T10. coeff propre Espagnol (groupeId≠null) upsert OK via POST', async () => {
    const ESP = '550e8400-e29b-41d4-a716-446655440011';
    const { result, nextError } = await callUpsert({ classeId: CLASSE, matiereId: ESP, anneeScolaire: ANNEE, coefficient: 3 });
    assert.ok(!nextError, `erreur inattendue: ${nextError}`);
    assert.strictEqual(result.coefficient, 3);
  });

  it('T11. getAllCoefficients ne filtre PLUS par groupeId:null', async () => {
    const svc = await import('../modules/coefficients/coefficients.service.js');
    let capturedWhere = null;
    const realFindMany = prisma.coefficient.findMany;
    prisma.coefficient.findMany = async ({ where }) => { capturedWhere = where; return []; };
    try {
      await svc.getAllCoefficients(SCHOOL, ANNEE);
    } finally {
      prisma.coefficient.findMany = realFindMany;
    }
    assert.ok(capturedWhere, 'findMany doit être appelé');
    assert.strictEqual(capturedWhere.matiere.groupeId, undefined,
      'groupeId:null ne doit PLUS être dans le filtre');
    assert.deepStrictEqual(capturedWhere.matiere, { isActive: true },
      'le filtre doit être uniquement isActive:true');
  });

  it('T12. getCoefficientsByClasse ne filtre PLUS par groupeId:null', async () => {
    const svc = await import('../modules/coefficients/coefficients.service.js');
    let capturedWhere = null;
    const realFindMany = prisma.coefficient.findMany;
    prisma.coefficient.findMany = async ({ where }) => { capturedWhere = where; return []; };
    try {
      await svc.getCoefficientsByClasse(SCHOOL, CLASSE, ANNEE);
    } finally {
      prisma.coefficient.findMany = realFindMany;
    }
    assert.ok(capturedWhere, 'findMany doit être appelé');
    assert.strictEqual(capturedWhere.matiere.groupeId, undefined,
      'groupeId:null ne doit PLUS être dans le filtre');
    assert.deepStrictEqual(capturedWhere.matiere, { isActive: true },
      'le filtre doit être uniquement isActive:true');
  });

  it('clearCoefficient exporté; deleteMany cible schoolId+classe+matière+année', async () => {
    const svc = await import('../modules/coefficients/coefficients.service.js');
    assert.strictEqual(typeof svc.clearCoefficient, 'function');
    await callUpsert(bodyWith(5));
    let capturedWhere = null;
    const realDeleteMany = prisma.coefficient.deleteMany;
    prisma.coefficient.deleteMany = async ({ where }) => { capturedWhere = where; return { count: 1 }; };
    try {
      const res = await svc.clearCoefficient(SCHOOL, { classeId: CLASSE, matiereId: MATIERE, anneeScolaire: ANNEE });
      assert.deepStrictEqual(res, { count: 1 });
    } finally {
      prisma.coefficient.deleteMany = realDeleteMany;
    }
    assert.deepStrictEqual(capturedWhere, { schoolId: SCHOOL, classeId: CLASSE, matiereId: MATIERE, anneeScolaire: ANNEE });
  });
});
