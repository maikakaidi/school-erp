import { describe, it } from 'node:test';
import assert from 'node:assert';

describe('Auth Enseignant', () => {
  it('should export loginEnseignant', async () => {
    const svc = await import('../modules/auth/auth.service.js');
    assert.strictEqual(typeof svc.loginEnseignant, 'function');
  });

  it('should export login-enseignant controller', async () => {
    const ctrl = await import('../modules/auth/auth.controller.js');
    assert.strictEqual(typeof ctrl.loginEnseignant, 'function');
  });
});

describe('Affectations Service', () => {
  it('should export service functions', async () => {
    const svc = await import('../modules/affectations/affectations.service.js');
    assert.strictEqual(typeof svc.getAllAffectations, 'function');
    assert.strictEqual(typeof svc.createAffectation, 'function');
    assert.strictEqual(typeof svc.updateAffectation, 'function');
    assert.strictEqual(typeof svc.deleteAffectation, 'function');
  });
});

describe('Prof Service (espace enseignant)', () => {
  it('should export service functions', async () => {
    const svc = await import('../modules/prof/prof.service.js');
    for (const fn of [
      'getProfile', 'getAffectations', 'getEleves', 'getNotes', 'saveNotes',
      'getAbsences', 'createAbsence', 'deleteAbsence', 'getEmploiDuTemps',
      'getNotifications', 'getUnreadNotificationsCount', 'markNotificationRead',
      'getAnnonces', 'getUnreadAnnoncesCount', 'markAnnonceRead', 'getDashboard',
    ]) {
      assert.strictEqual(typeof svc[fn], 'function', `prof.service should export ${fn}`);
    }
  });

  it('should export validation schemas', async () => {
    const val = await import('../modules/prof/prof.validation.js');
    assert.ok(val.saveNotesSchema, 'saveNotesSchema');
    assert.ok(val.createAbsenceSchema, 'createAbsenceSchema');
  });
});

describe('Annonces Enseignant', () => {
  it('should export enseignant helpers', async () => {
    const svc = await import('../modules/annonces/annonces.service.js');
    assert.strictEqual(typeof svc.getAnnoncesForEnseignant, 'function');
    assert.strictEqual(typeof svc.getUnreadAnnoncesCountForEnseignant, 'function');
    assert.strictEqual(typeof svc.markAnnonceReadForEnseignant, 'function');
  });
});
