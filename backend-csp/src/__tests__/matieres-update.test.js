import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import prisma from '../config/database.js';

// ═══════════════════════════════════════════════════════
//  BUG MODIFICATION MATIÈRES (groupeId null) : régression
//
//  Une matière peut ne faire partie d'aucun groupe :
//  représentation canonique = groupeId NULL en base.
//  L'UPDATE doit l'accepter ; le groupe non envoyé reste inchangé.
// ═══════════════════════════════════════════════════════

const SCHOOL = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
const ID = '550e8400-e29b-41d4-a716-446655440001';
const GROUPE = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';

// Payload « ligne API brute » tel que l'ancien openEdit(m) l'envoyait
const fullRow = (over = {}) => ({
  id: ID,
  schoolId: SCHOOL,
  libelle: 'Anglais',
  code: 'Anglais',
  type: 'Litteraire',
  isActive: true,
  groupeId: null,
  groupe: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...over,
});

let patches = [];
function patch(obj, methodName, impl) {
  const original = obj[methodName];
  let captured = null;
  obj[methodName] = async (...args) => { captured = args; return impl(...args); };
  patches.push({ obj, methodName, original });
  return { get args() { return captured; } };
}
afterEach(() => {
  for (const { obj, methodName, original } of patches.reverse()) obj[methodName] = original;
  patches = [];
});

async function callUpdate(body) {
  const ctrl = await import('../modules/matieres/matieres.controller.js');
  let result, statusCode, nextError;
  const res = {
    json: (d) => { result = d; return res; },
    status: (c) => { statusCode = c; return res; },
    send: () => res,
  };
  await ctrl.update({ user: { schoolId: SCHOOL }, params: { id: ID }, body }, res, (e) => { nextError = e; });
  return { result, statusCode, nextError };
}

// ─── Validation ────────────────────────────────────────
describe('Matieres Validation UPDATE — groupeId nullable', () => {
  it('UPDATE matière sans groupe : groupeId null accepté', async () => {
    const { updateMatiereSchema } = await import('../modules/matieres/matieres.validation.js');
    const parsed = updateMatiereSchema.parse({ libelle: 'Anglais', code: 'Anglais', type: 'Litteraire', groupeId: null });
    assert.strictEqual(parsed.groupeId, null);
  });
  it('UPDATE matière avec groupe : groupeId UUID accepté', async () => {
    const { updateMatiereSchema } = await import('../modules/matieres/matieres.validation.js');
    const parsed = updateMatiereSchema.parse({ libelle: 'Arabe', groupeId: GROUPE });
    assert.strictEqual(parsed.groupeId, GROUPE);
  });
  it('UPDATE sans groupeId (absent) accepté — inchangé côté serveur', async () => {
    const { updateMatiereSchema } = await import('../modules/matieres/matieres.validation.js');
    const parsed = updateMatiereSchema.parse({ libelle: 'Maths' });
    assert.strictEqual(parsed.groupeId, undefined);
  });
  it('groupeId invalide rejeté', async () => {
    const { updateMatiereSchema } = await import('../modules/matieres/matieres.validation.js');
    assert.throws(() => updateMatiereSchema.parse({ libelle: 'X', groupeId: 'pas-un-uuid' }));
    assert.throws(() => updateMatiereSchema.parse({ libelle: 'X', groupeId: 42 }));
  });
  it('partial pur : {} accepté', async () => {
    const { updateMatiereSchema } = await import('../modules/matieres/matieres.validation.js');
    assert.deepStrictEqual(updateMatiereSchema.parse({}), {});
  });
});

describe('Matieres Validation CREATE — comportement inchangé', () => {
  it('CREATE exige libelle et accepte groupeId UUID optionnel (régression T10/T11)', async () => {
    const { createMatiereSchema } = await import('../modules/matieres/matieres.validation.js');
    const valid = createMatiereSchema.parse({ libelle: 'Test' });
    assert.strictEqual(valid.groupeId, undefined);
    assert.strictEqual(createMatiereSchema.parse({ libelle: 'A', groupeId: GROUPE }).groupeId, GROUPE);
    assert.throws(() => createMatiereSchema.parse({}));
  });
  it('CREATE reste strict : groupeId null rejeté', async () => {
    const { createMatiereSchema } = await import('../modules/matieres/matieres.validation.js');
    assert.throws(() => createMatiereSchema.parse({ libelle: 'Test', groupeId: null }));
  });
});

// ─── Flux PUT complet (controller + service) ───────────
describe('Matieres Flux PUT — modification réelle', () => {
  beforeEach(() => { patches = []; });

  it('matière SANS groupe modifiable via ancien payload full-row (groupeId null + clés inconnues strippées)', async () => {
    const spy = patch(prisma.matiere, 'updateMany', async () => ({ count: 1 }));
    const { result, nextError, statusCode } = await callUpdate(fullRow());
    assert.ok(!nextError, `erreur inattendue: ${nextError}`);
    assert.strictEqual(statusCode, undefined);
    assert.deepStrictEqual(result, { message: 'Matière mise à jour' });
    const { where, data } = spy.args[0];
    assert.deepStrictEqual(where, { id: ID, schoolId: SCHOOL });
    assert.deepStrictEqual(data, { libelle: 'Anglais', code: 'Anglais', type: 'Litteraire', groupeId: null },
      'seuls les champs métier doivent atteindre Prisma');
  });

  it('matière AVEC groupe modifiable et groupe conservé (payload propre sans groupeId)', async () => {
    const spy = patch(prisma.matiere, 'updateMany', async ({ where, data }) => {
      if (!('groupeId' in data)) return { count: 1 }; // groupe intact
      return { count: 0 };
    });
    const payload = { libelle: 'Anglais', code: 'ANG', type: 'Litteraire' };
    const { result, nextError } = await callUpdate(payload);
    assert.ok(!nextError);
    assert.deepStrictEqual(result, { message: 'Matière mise à jour' });
    const { data } = spy.args[0];
    assert.ok(!('groupeId' in data), 'groupeId absent du payload => groupe conservé');
  });

  it('404 si la matière n\'existe pas dans cette école', async () => {
    patch(prisma.matiere, 'updateMany', async () => ({ count: 0 }));
    const { statusCode, result } = await callUpdate({ libelle: 'X' });
    assert.strictEqual(statusCode, 404);
    assert.deepStrictEqual(result, { message: 'Matière non trouvée' });
  });

  it('400 ZodError si groupeId invalide, rien écrit en base', async () => {
    const spy = patch(prisma.matiere, 'updateMany', async () => { throw new Error('NE DOIT PAS ÊTRE APPELÉ'); });
    const { nextError, statusCode } = await callUpdate({ libelle: 'X', groupeId: 'invalide' });
    assert.ok(nextError && nextError.name === 'ZodError');
    assert.strictEqual(nextError.status, 400);
    assert.strictEqual(statusCode, undefined);
    assert.strictEqual(spy.args, null, 'updateMany ne doit jamais être appelé');
  });
});
