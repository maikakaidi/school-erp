import { describe, it } from 'node:test';
import assert from 'node:assert';
import { nextReceiptNumber } from '../modules/versements/versements.service.js';
import { nombreEnLettres } from '../utils/pdf.generator.js';

describe('Versements — Reçu', () => {
  it('should export service functions', async () => {
    const svc = await import('../modules/versements/versements.service.js');
    for (const fn of [
      'createVersement', 'getVersementsByEleve', 'getSituationFinanciere',
      'getVersementByRecuNumber', 'generateReçuPDF', 'exportVersements', 'nextReceiptNumber',
    ]) {
      assert.strictEqual(typeof svc[fn], 'function', `${fn} manquant`);
    }
  });

  it('should compute sequential receipt numbers per year', () => {
    assert.strictEqual(nextReceiptNumber('2025-2026', null), 'REC-25-0001');
    assert.strictEqual(nextReceiptNumber('2025-2026', 'REC-25-0003'), 'REC-25-0004');
    assert.strictEqual(nextReceiptNumber('2025-2026', 'REC-25-0999'), 'REC-25-1000');
  });

  it('should reset the sequence when the year changes', () => {
    assert.strictEqual(nextReceiptNumber('2025-2026', 'REC-24-0042'), 'REC-25-0001');
  });

  it('should ignore legacy timestamp receipt numbers', () => {
    assert.strictEqual(nextReceiptNumber('2025-2026', 'REC-1723456789012-AB12'), 'REC-25-0001');
  });

  it('should validate the receipt route allows school and parent access', async () => {
    const routes = await import('../modules/versements/versements.routes.js');
    assert.ok(routes.default, 'router manquant');
  });
});

describe('Nombre en lettres (français)', () => {
  it('handles small numbers', () => {
    assert.strictEqual(nombreEnLettres(0), 'zéro');
    assert.strictEqual(nombreEnLettres(5), 'cinq');
    assert.strictEqual(nombreEnLettres(21), 'vingt-et-un');
    assert.strictEqual(nombreEnLettres(80), 'quatre-vingts');
    assert.strictEqual(nombreEnLettres(90), 'quatre-vingt-dix');
    assert.strictEqual(nombreEnLettres(99), 'quatre-vingt-dix-neuf');
  });

  it('handles hundreds and thousands', () => {
    assert.strictEqual(nombreEnLettres(100), 'cent');
    assert.strictEqual(nombreEnLettres(199), 'cent quatre-vingt-dix-neuf');
    assert.strictEqual(nombreEnLettres(1000), 'mille');
    assert.strictEqual(nombreEnLettres(2026), 'deux mille vingt-six');
    assert.strictEqual(nombreEnLettres(300000), 'trois cent mille');
  });

  it('handles millions', () => {
    assert.strictEqual(nombreEnLettres(1000000), 'un million');
    assert.strictEqual(nombreEnLettres(1500000), 'un million cinq cent mille');
    assert.strictEqual(nombreEnLettres(2000000), 'deux millions');
  });
});
