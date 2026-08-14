import { describe, it } from 'node:test';
import assert from 'node:assert';

describe('Annonces Service', () => {
  it('should export service functions', async () => {
    const svc = await import('../modules/annonces/annonces.service.js');
    for (const fn of [
      'getAllAnnonces', 'getAnnonceById', 'createAnnonce', 'updateAnnonce', 'deleteAnnonce',
      'getAnnoncesForParent', 'getUnreadAnnoncesCountForParent', 'markAnnonceReadForParent',
    ]) {
      assert.strictEqual(typeof svc[fn], 'function', `${fn} manquant`);
    }
  });

  it('should export validation schemas', async () => {
    const v = await import('../modules/annonces/annonces.validation.js');
    assert.ok(v.createAnnonceSchema, 'createAnnonceSchema manquant');
    assert.ok(v.updateAnnonceSchema, 'updateAnnonceSchema manquant');
  });
});
