import { describe, it } from 'node:test';
import assert from 'node:assert';

describe('Absences Service', () => {
  it('should export service functions', async () => {
    const svc = await import('../modules/absences/absences.service.js');
    for (const fn of ['getAllAbsences', 'getAbsenceById', 'createAbsence', 'bulkCreateAbsences', 'updateAbsence', 'deleteAbsence', 'exportAbsences']) {
      assert.strictEqual(typeof svc[fn], 'function', `${fn} manquant`);
    }
  });

  it('should export validation schemas', async () => {
    const v = await import('../modules/absences/absences.validation.js');
    assert.ok(v.createAbsenceSchema, 'createAbsenceSchema manquant');
    assert.ok(v.bulkCreateAbsencesSchema, 'bulkCreateAbsencesSchema manquant');
    assert.ok(v.updateAbsenceSchema, 'updateAbsenceSchema manquant');
  });
});
