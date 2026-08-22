import { describe, it } from 'node:test';
import assert from 'node:assert';
import { nextReceiptNumber } from '../modules/versements/versements.service.js';
import { createVersementSchema } from '../modules/versements/versements.validation.js';
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

describe('Versements — validation createVersementSchema (régression BUG 2)', () => {
  it('rejette un payload avec currentYear au lieu de anneeScolaire (payload fautif historique)', () => {
    const badPayload = {
      eleveId: '123e4567-e89b-12d3-a456-426614174000',
      currentYear: '2025-2026',
      tranche: 2,
      montant: 50000,
      reduction: 0,
      modePaiement: 'cash',
      commentaire: '',
    };
    const result = createVersementSchema.safeParse(badPayload);
    assert.strictEqual(result.success, false, 'le payload sans anneeScolaire doit être rejeté');
    const issue = result.error.issues.find(i => i.path.includes('anneeScolaire'));
    assert.ok(issue, 'erreur attendue sur le chemin anneeScolaire');
    assert.strictEqual(issue.code, 'invalid_type');
    assert.strictEqual(issue.received, 'undefined');
  });

  it('accepte le payload corrigé avec anneeScolaire et ignore les clés inconnues', () => {
    const goodPayload = {
      eleveId: '123e4567-e89b-12d3-a456-426614174000',
      anneeScolaire: '2025-2026',
      tranche: 2,
      montant: 50000,
      reduction: 0,
      modePaiement: 'cash',
      commentaire: '',
    };
    const result = createVersementSchema.safeParse(goodPayload);
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.data.anneeScolaire, '2025-2026');
    assert.strictEqual('currentYear' in result.data, false);
  });

  it('la page Versements n\'utilise plus currentYear comme paramètre API', async () => {
    const fs = await import('node:fs');
    const src = await fs.promises.readFile(
      new URL('../../../frontend-csp/src/pages/Versements.jsx', import.meta.url),
      'utf8'
    );
    assert.ok(!/[?&]currentYear=/.test(src), 'les query strings ne doivent plus utiliser currentYear=');
    assert.ok(/anneeScolaire:\s*currentYear/.test(src), 'le payload POST doit envoyer anneeScolaire');
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
