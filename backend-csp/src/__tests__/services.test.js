import { describe, it } from 'node:test';
import assert from 'node:assert';

describe('Notification Service', () => {
  it('should export service functions', async () => {
    const svc = await import('../modules/notifications/notifications.service.js');
    assert.strictEqual(typeof svc.createNotification, 'function');
    assert.strictEqual(typeof svc.getNotifications, 'function');
    assert.strictEqual(typeof svc.getUnreadCount, 'function');
    assert.strictEqual(typeof svc.markAsRead, 'function');
    assert.strictEqual(typeof svc.markAllAsRead, 'function');
    assert.strictEqual(typeof svc.deleteNotification, 'function');
    assert.strictEqual(typeof svc.deleteAllRead, 'function');
  });
});

describe('Versements Service', () => {
  it('should export service functions', async () => {
    const svc = await import('../modules/versements/versements.service.js');
    assert.strictEqual(typeof svc.createVersement, 'function');
    assert.strictEqual(typeof svc.getVersementsByEleve, 'function');
    assert.strictEqual(typeof svc.getSituationFinanciere, 'function');
    assert.strictEqual(typeof svc.exportVersements, 'function');
  });
});

describe('Eleves Service', () => {
  it('should export service functions', async () => {
    const svc = await import('../modules/eleves/eleves.service.js');
    assert.strictEqual(typeof svc.getAllEleves, 'function');
    assert.strictEqual(typeof svc.createEleve, 'function');
    assert.strictEqual(typeof svc.exportEleves, 'function');
  });
});

describe('Enseignants Service', () => {
  it('should export service functions', async () => {
    const svc = await import('../modules/enseignants/enseignants.service.js');
    assert.strictEqual(typeof svc.getAllEnseignants, 'function');
    assert.strictEqual(typeof svc.exportEnseignants, 'function');
  });
});

describe('Notes Service', () => {
  it('should export service functions', async () => {
    const svc = await import('../modules/notes/notes.service.js');
    assert.strictEqual(typeof svc.upsertNote, 'function');
    assert.strictEqual(typeof svc.getNotesByClasse, 'function');
    assert.strictEqual(typeof svc.exportNotes, 'function');
  });
});
