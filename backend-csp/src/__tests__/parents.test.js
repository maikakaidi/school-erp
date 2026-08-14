import { describe, it } from 'node:test';
import assert from 'node:assert';

describe('Parents Service (gestion école)', () => {
  it('should export service functions', async () => {
    const svc = await import('../modules/parents/parents.service.js');
    for (const fn of ['getAllParents', 'getParentById', 'createParent', 'updateParent', 'deleteParent']) {
      assert.strictEqual(typeof svc[fn], 'function', `${fn} manquant`);
    }
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
