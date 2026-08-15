import { describe, it } from 'node:test';
import assert from 'node:assert';

describe('Messages Service', () => {
  it('should export service functions', async () => {
    const svc = await import('../modules/messages/messages.service.js');
    assert.strictEqual(typeof svc.conversationKey, 'function');
    assert.strictEqual(typeof svc.sendFromSchool, 'function');
    assert.strictEqual(typeof svc.getConversations, 'function');
    assert.strictEqual(typeof svc.getConversation, 'function');
    assert.strictEqual(typeof svc.replyFromActor, 'function');
    assert.strictEqual(typeof svc.getMyConversation, 'function');
    assert.strictEqual(typeof svc.markReadForActor, 'function');
    assert.strictEqual(typeof svc.getUnreadCountForActor, 'function');
    assert.strictEqual(typeof svc.getUnreadCountForSchool, 'function');
  });
});

describe('Rapports Service', () => {
  it('should export service functions', async () => {
    const svc = await import('../modules/rapports/rapports.service.js');
    assert.strictEqual(typeof svc.getAssiduiteParClasse, 'function');
    assert.strictEqual(typeof svc.getPaiementsEnRetard, 'function');
    assert.strictEqual(typeof svc.generateAssiduitePDF, 'function');
    assert.strictEqual(typeof svc.generatePaiementsPDF, 'function');
  });
});
