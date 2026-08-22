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

  describe('BUG 4 — option "Automatique" (classeId)', () => {
    const base = { eleveId: 'e1', date: '2026-08-22', type: 'absence', justifie: false, statutJustificatif: 'non_justifie' };

    it('accepte un payload sans classeId (mode Automatique)', async () => {
      const { createAbsenceSchema } = await import('../modules/absences/absences.validation.js');
      const result = createAbsenceSchema.safeParse(base);
      assert.strictEqual(result.success, true, JSON.stringify(result.error?.issues));
    });

    it("rejette classeId='' — le frontend doit envoyer undefined", async () => {
      const { createAbsenceSchema } = await import('../modules/absences/absences.validation.js');
      const result = createAbsenceSchema.safeParse({ ...base, classeId: '' });
      assert.strictEqual(result.success, false);
      const issue = result.error.issues.find((i) => i.path.includes('classeId'));
      assert.ok(issue, 'issue classeId attendue');
      assert.strictEqual(issue.code, 'too_small');
    });

    it('accepte une classe sélectionnée manuellement', async () => {
      const { createAbsenceSchema } = await import('../modules/absences/absences.validation.js');
      const result = createAbsenceSchema.safeParse({ ...base, classeId: 'c1' });
      assert.strictEqual(result.success, true);
    });

    it('updateAbsenceSchema accepte un payload sans classeId', async () => {
      const { updateAbsenceSchema } = await import('../modules/absences/absences.validation.js');
      const result = updateAbsenceSchema.safeParse({ eleveId: 'e1', date: '2026-08-22', type: 'retard' });
      assert.strictEqual(result.success, true, JSON.stringify(result.error?.issues));
    });
  });
});
