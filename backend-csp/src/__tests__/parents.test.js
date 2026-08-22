import { describe, it } from 'node:test';
import assert from 'node:assert';

describe('Parents Service (gestion école)', () => {
  it('should export service functions', async () => {
    const svc = await import('../modules/parents/parents.service.js');
    for (const fn of ['getAllParents', 'getParentById', 'createParent', 'updateParent', 'deleteParent']) {
      assert.strictEqual(typeof svc[fn], 'function', `${fn} manquant`);
    }
  });

  it('toHttpError mappe P2002 vers une erreur métier HTTP 409 (régression BUG 1)', async () => {
    const { toHttpError } = await import('../modules/parents/parents.service.js');
    const p2002 = Object.assign(new Error('Unique constraint failed'), {
      name: 'PrismaClientKnownRequestError',
      code: 'P2002',
      meta: { modelName: 'Parent', target: ['schoolId', 'telephone'] },
    });
    const mapped = toHttpError(p2002);
    assert.strictEqual(mapped.status, 409, 'P2002 doit donner status 409, pas 500');
    assert.match(mapped.message, /téléphone/i);
    assert.notStrictEqual(mapped.name, 'PrismaClientKnownRequestError');
  });

  it('toHttpError laisse passer les erreurs non P2002 inchangées', async () => {
    const { toHttpError } = await import('../modules/parents/parents.service.js');
    const other = Object.assign(new Error('boom'), { code: 'P2025' });
    const out = toHttpError(other);
    assert.strictEqual(out, other, 'erreur non P2002 doit être retournée telle quelle');
    assert.strictEqual(toHttpError(null), null);
  });

  it('les erreurs métier du service portent un status HTTP explicite (pas de 500)', async () => {
    const src = await import('node:fs').then(fs =>
      fs.promises.readFile(new URL('../modules/parents/parents.service.js', import.meta.url), 'utf8')
    );
    assert.ok(src.includes('e.status = 409'), 'conflit téléphone doit porter status 409');
    assert.ok(src.includes('e.status = 404'), 'parent introuvable doit porter status 404');
    assert.ok(src.includes('e.status = 400'), 'élèves invalides doit porter status 400');
  });
});

describe('Parent Service (espace parent)', () => {
  it('should export service functions', async () => {
    const svc = await import('../modules/parent/parent.service.js');
    for (const fn of ['getProfile', 'getChildren', 'getChildOwned', 'getNotes', 'getPayments', 'getDashboard']) {
      assert.strictEqual(typeof svc[fn], 'function', `${fn} manquant`);
    }
  });
});
