import { describe, it } from 'node:test';
import assert from 'node:assert';
import { upsertNoteSchema } from '../modules/notes/notes.validation.js';

describe('Notes — validation upsertNoteSchema (régression BUG 3)', () => {
  const base = {
    eleveId: '123e4567-e89b-12d3-a456-426614174000',
    matiereId: '223e4567-e89b-12d3-a456-426614174000',
    classeId: '323e4567-e89b-12d3-a456-426614174000',
    semestre: 1,
  };

  it('rejette le payload historique : currentYear au lieu de anneeScolaire', () => {
    const historique = {
      ...base,
      currentYear: '2025-2026',
      devoir: 12.5,
      composition: null,
      appreciation: '',
    };
    const result = upsertNoteSchema.safeParse(historique);
    assert.strictEqual(result.success, false);
    const anneeIssue = result.error.issues.find(i => i.path.includes('anneeScolaire'));
    assert.ok(anneeIssue, 'erreur attendue sur anneeScolaire');
    assert.strictEqual(anneeIssue.code, 'invalid_type');
    assert.strictEqual(anneeIssue.received, 'undefined');
  });

  it('accepte null explicite pour devoir/composition/appreciation (effacement volontaire WYSIWYG)', () => {
    const r = upsertNoteSchema.safeParse({
      ...base,
      anneeScolaire: '2025-2026',
      devoir: null,
      composition: null,
      appreciation: '',
    });
    assert.strictEqual(r.success, true, 'null doit être accepté');
    assert.strictEqual(r.data.devoir, null);
    assert.strictEqual(r.data.composition, null);
  });

  it('accepte un payload partiel : appreciation seule (clés omises)', () => {
    const r = upsertNoteSchema.safeParse({ ...base, anneeScolaire: '2025-2026', appreciation: 'Bon travail' });
    assert.strictEqual(r.success, true);
    assert.strictEqual('devoir' in r.data, false);
    assert.strictEqual('composition' in r.data, false);
  });

  it('accepte composition seule', () => {
    const r = upsertNoteSchema.safeParse({ ...base, anneeScolaire: '2025-2026', composition: 14 });
    assert.strictEqual(r.success, true);
    assert.strictEqual(r.data.composition, 14);
  });

  it('accepte une note de 0/20 (falsy mais valide)', () => {
    const r = upsertNoteSchema.safeParse({ ...base, anneeScolaire: '2025-2026', devoir: 0, appreciation: '' });
    assert.strictEqual(r.success, true);
    assert.strictEqual(r.data.devoir, 0);
  });

  it("accepte l'enregistrement d'une appréciation seule", () => {
    const r = upsertNoteSchema.safeParse({ ...base, anneeScolaire: '2025-2026', appreciation: 'Bon travail' });
    assert.strictEqual(r.success, true);
    assert.strictEqual(r.data.appreciation, 'Bon travail');
  });

  it('rejette une note hors bornes (>20) et un type invalide', () => {
    assert.strictEqual(upsertNoteSchema.safeParse({ ...base, anneeScolaire: '2025-2026', devoir: 25 }).success, false);
    assert.strictEqual(upsertNoteSchema.safeParse({ ...base, anneeScolaire: '2025-2026', composition: 'abc' }).success, false);
  });

  it('le service préserve la note 0 (pas de destruction via || null)', async () => {
    const fs = await import('node:fs');
    const src = await fs.promises.readFile(
      new URL('../modules/notes/notes.service.js', import.meta.url),
      'utf8'
    );
    assert.ok(!/data\.devoir \|\| null/.test(src), '|| null détruirait la valeur 0');
    assert.ok(!/data\.composition \|\| null/.test(src), '|| null détruirait la valeur 0');
    assert.ok(/data\.devoir !== undefined/.test(src), 'champ omis doit être préservé (WYSIWYG)');
  });

  it('la page Notes n\'utilise plus currentYear comme paramètre API', async () => {
    const fs = await import('node:fs');
    const src = await fs.promises.readFile(
      new URL('../../../frontend-csp/src/pages/Notes.jsx', import.meta.url),
      'utf8'
    );
    assert.ok(!/[?&]currentYear=/.test(src), 'les query strings ne doivent plus utiliser currentYear=');
    assert.ok(/anneeScolaire:\s*currentYear/.test(src), 'le payload POST doit envoyer anneeScolaire');
    assert.ok(/parseFloat\(devoir\) : null/.test(src), 'champ vide doit envoyer null explicite (WYSIWYG)');
  });
});
