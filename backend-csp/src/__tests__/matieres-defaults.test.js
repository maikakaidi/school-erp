import { describe, it } from 'node:test';
import assert from 'node:assert';

// ═══════════════════════════════════════════════════════
//  1. MATIÈRES SERVICE — Exports
// ═══════════════════════════════════════════════════════
describe('Matieres Service — exports', () => {
  it('1. getAllMatieres est exporté', async () => {
    const svc = await import('../modules/matieres/matieres.service.js');
    assert.strictEqual(typeof svc.getAllMatieres, 'function');
  });
  it('2. getMatiereById est exporté', async () => {
    const svc = await import('../modules/matieres/matieres.service.js');
    assert.strictEqual(typeof svc.getMatiereById, 'function');
  });
  it('3. createMatiere est exporté', async () => {
    const svc = await import('../modules/matieres/matieres.service.js');
    assert.strictEqual(typeof svc.createMatiere, 'function');
  });
  it('4. updateMatiere est exporté', async () => {
    const svc = await import('../modules/matieres/matieres.service.js');
    assert.strictEqual(typeof svc.updateMatiere, 'function');
  });
  it('5. softDeleteMatiere est exporté', async () => {
    const svc = await import('../modules/matieres/matieres.service.js');
    assert.strictEqual(typeof svc.softDeleteMatiere, 'function');
  });
  it('6. restoreMatiere est exporté', async () => {
    const svc = await import('../modules/matieres/matieres.service.js');
    assert.strictEqual(typeof svc.restoreMatiere, 'function');
  });
  it('7. getMatieresGroupes est exporté', async () => {
    const svc = await import('../modules/matieres/matieres.service.js');
    assert.strictEqual(typeof svc.getMatieresGroupes, 'function');
  });
  it('8. createMatiereGroupe est exporté', async () => {
    const svc = await import('../modules/matieres/matieres.service.js');
    assert.strictEqual(typeof svc.createMatiereGroupe, 'function');
  });
  it('9. deleteMatiereGroupe est exporté', async () => {
    const svc = await import('../modules/matieres/matieres.service.js');
    assert.strictEqual(typeof svc.deleteMatiereGroupe, 'function');
  });
});

// ═══════════════════════════════════════════════════════
//  2. MATIÈRES VALIDATION
// ═══════════════════════════════════════════════════════
describe('Matieres Validation', () => {
  it('10. createMatiereSchema accepte groupeId optionnel', async () => {
    const { createMatiereSchema } = await import('../modules/matieres/matieres.validation.js');
    const valid = createMatiereSchema.parse({ libelle: 'Test' });
    assert.strictEqual(valid.groupeId, undefined);
    const withGroupe = createMatiereSchema.parse({ libelle: 'Arabe', groupeId: '550e8400-e29b-41d4-a716-446655440000' });
    assert.strictEqual(withGroupe.groupeId, '550e8400-e29b-41d4-a716-446655440000');
  });
  it('11. createMatiereSchema requiert libelle', async () => {
    const { createMatiereSchema } = await import('../modules/matieres/matieres.validation.js');
    assert.throws(() => createMatiereSchema.parse({}));
  });
});

// ═══════════════════════════════════════════════════════
//  3. COEFFICIENTS SERVICE — exports
// ═══════════════════════════════════════════════════════
describe('Coefficients Service — exports', () => {
  it('12. getAllCoefficients est exporté', async () => {
    const svc = await import('../modules/coefficients/coefficients.service.js');
    assert.strictEqual(typeof svc.getAllCoefficients, 'function');
  });
  it('13. getCoefficientsByClasse est exporté', async () => {
    const svc = await import('../modules/coefficients/coefficients.service.js');
    assert.strictEqual(typeof svc.getCoefficientsByClasse, 'function');
  });
  it('14. upsertCoefficient est exporté', async () => {
    const svc = await import('../modules/coefficients/coefficients.service.js');
    assert.strictEqual(typeof svc.upsertCoefficient, 'function');
  });
  it('15. deleteCoefficient est exporté', async () => {
    const svc = await import('../modules/coefficients/coefficients.service.js');
    assert.strictEqual(typeof svc.deleteCoefficient, 'function');
  });
});

// ═══════════════════════════════════════════════════════
//  4. COEFFICIENTS VALIDATION
// ═══════════════════════════════════════════════════════
describe('Coefficients Validation', () => {
  it('16. createCoefficientSchema valide un coeff positif', async () => {
    const { createCoefficientSchema } = await import('../modules/coefficients/coefficients.validation.js');
    const valid = createCoefficientSchema.parse({
      classeId: '550e8400-e29b-41d4-a716-446655440000',
      matiereId: '550e8400-e29b-41d4-a716-446655440001',
      coefficient: 3,
      anneeScolaire: '2025-2026'
    });
    assert.strictEqual(valid.coefficient, 3);
  });
  it('17. createCoefficientSchema rejette coeff négatif', async () => {
    const { createCoefficientSchema } = await import('../modules/coefficients/coefficients.validation.js');
    assert.throws(() => createCoefficientSchema.parse({
      classeId: '550e8400-e29b-41d4-a716-446655440000',
      matiereId: '550e8400-e29b-41d4-a716-446655440001',
      coefficient: -1,
      anneeScolaire: '2025-2026'
    }));
  });
});

// ═══════════════════════════════════════════════════════
//  5. DEFAULTS TEMPLATE — Structure
// ═══════════════════════════════════════════════════════
describe('Defaults Template', () => {
  it('18. MATIERES_CATALOGUE contient 16 matières', async () => {
    const { MATIERES_CATALOGUE } = await import('../modules/defaults/defaults.template.js');
    assert.strictEqual(MATIERES_CATALOGUE.length, 16);
  });
  it('19. GROUPE_CHOIX contient Arabe et Espagnol', async () => {
    const { GROUPE_CHOIX } = await import('../modules/defaults/defaults.template.js');
    assert.strictEqual(GROUPE_CHOIX.nom, 'Arabe/Espagnol');
    assert.deepStrictEqual(GROUPE_CHOIX.options, ['Arabe', 'Espagnol']);
  });
  it('20. COLLEGE_CONFIG a 4 niveaux (6eme, 5eme, 4eme, 3eme)', async () => {
    const { COLLEGE_CONFIG } = await import('../modules/defaults/defaults.template.js');
    assert.deepStrictEqual(Object.keys(COLLEGE_CONFIG), ['6eme', '5eme', '4eme', '3eme']);
  });
  it('21. LYCEE_CONFIG a 8 niveaux', async () => {
    const { LYCEE_CONFIG } = await import('../modules/defaults/defaults.template.js');
    assert.strictEqual(Object.keys(LYCEE_CONFIG).length, 8);
    assert.ok(LYCEE_CONFIG['2nde_a']);
    assert.ok(LYCEE_CONFIG['2nde_c']);
    assert.ok(LYCEE_CONFIG['1ere_a']);
    assert.ok(LYCEE_CONFIG['1ere_c']);
    assert.ok(LYCEE_CONFIG['1ere_d']);
    assert.ok(LYCEE_CONFIG['tle_a']);
    assert.ok(LYCEE_CONFIG['tle_c']);
    assert.ok(LYCEE_CONFIG['tle_d']);
  });
  it('22. getConfigKey retourne type college pour 6eme', async () => {
    const { getConfigKey } = await import('../modules/defaults/defaults.template.js');
    const result = getConfigKey({ niveau: '6eme', nom: '6eme A' });
    assert.deepStrictEqual(result, { type: 'college', key: '6eme' });
  });
  it('23. getConfigKey retourne 2nde_c pour 2nde C', async () => {
    const { getConfigKey } = await import('../modules/defaults/defaults.template.js');
    const result = getConfigKey({ niveau: '2nde', nom: '2nde C' });
    assert.deepStrictEqual(result, { type: 'lycee', key: '2nde_c' });
  });
  it('24. getConfigKey retourne 2nde_a par défaut pour 2nde', async () => {
    const { getConfigKey } = await import('../modules/defaults/defaults.template.js');
    const result = getConfigKey({ niveau: '2nde', nom: '2nde A' });
    assert.deepStrictEqual(result, { type: 'lycee', key: '2nde_a' });
  });
  it('25. getConfigKey retourne tle_c pour Terminale C', async () => {
    const { getConfigKey } = await import('../modules/defaults/defaults.template.js');
    const result = getConfigKey({ niveau: 'Terminale', nom: 'Terminale C' });
    assert.deepStrictEqual(result, { type: 'lycee', key: 'tle_c' });
  });
  it('26. getConfigKey retourne null pour niveau inconnu', async () => {
    const { getConfigKey } = await import('../modules/defaults/defaults.template.js');
    const result = getConfigKey({ niveau: 'CP', nom: 'CP A' });
    assert.strictEqual(result, null);
  });
});

// ═══════════════════════════════════════════════════════
//  6. DEFAULTS TEMPLATE — Coefficients par niveau
// ═══════════════════════════════════════════════════════
describe('Defaults Template — Collège', () => {
  it('27. 6eme a PC=1', async () => {
    const { COLLEGE_CONFIG } = await import('../modules/defaults/defaults.template.js');
    const pc = COLLEGE_CONFIG['6eme'].find(c => c.libelle === 'Physique Chimie');
    assert.strictEqual(pc.coefficient, 1);
  });
  it('28. 5eme a PC=1', async () => {
    const { COLLEGE_CONFIG } = await import('../modules/defaults/defaults.template.js');
    const pc = COLLEGE_CONFIG['5eme'].find(c => c.libelle === 'Physique Chimie');
    assert.strictEqual(pc.coefficient, 1);
  });
  it('29. 4eme a PC=2', async () => {
    const { COLLEGE_CONFIG } = await import('../modules/defaults/defaults.template.js');
    const pc = COLLEGE_CONFIG['4eme'].find(c => c.libelle === 'Physique Chimie');
    assert.strictEqual(pc.coefficient, 2);
  });
  it('30. 3eme a PC=2', async () => {
    const { COLLEGE_CONFIG } = await import('../modules/defaults/defaults.template.js');
    const pc = COLLEGE_CONFIG['3eme'].find(c => c.libelle === 'Physique Chimie');
    assert.strictEqual(pc.coefficient, 2);
  });
  it('31. Tous les niveaux collège ont Arabe/Espagnol', async () => {
    const { COLLEGE_CONFIG } = await import('../modules/defaults/defaults.template.js');
    for (const [key, cfg] of Object.entries(COLLEGE_CONFIG)) {
      const grp = cfg.find(c => c.libelle === 'Arabe/Espagnol');
      assert.ok(grp, `Arabe/Espagnol manquant en ${key}`);
      assert.strictEqual(grp.coefficient, 4);
    }
  });
});

describe('Defaults Template — Lycée', () => {
  it('32. 2nde A n a PAS de Philosophie', async () => {
    const { LYCEE_CONFIG } = await import('../modules/defaults/defaults.template.js');
    const phil = LYCEE_CONFIG['2nde_a'].find(c => c.libelle === 'Philosophie');
    assert.strictEqual(phil, undefined);
  });
  it('33. 2nde C n a PAS de Philosophie', async () => {
    const { LYCEE_CONFIG } = await import('../modules/defaults/defaults.template.js');
    const phil = LYCEE_CONFIG['2nde_c'].find(c => c.libelle === 'Philosophie');
    assert.strictEqual(phil, undefined);
  });
  it('34. 1ere C et 1ere D ont les mêmes coefficients', async () => {
    const { LYCEE_CONFIG } = await import('../modules/defaults/defaults.template.js');
    const coeffC = LYCEE_CONFIG['1ere_c'].map(c => `${c.libelle}:${c.coefficient}`).sort();
    const coeffD = LYCEE_CONFIG['1ere_d'].map(c => `${c.libelle}:${c.coefficient}`).sort();
    assert.deepStrictEqual(coeffC, coeffD);
  });
  it('35. Tle C et Tle D ont les mêmes coefficients', async () => {
    const { LYCEE_CONFIG } = await import('../modules/defaults/defaults.template.js');
    const coeffC = LYCEE_CONFIG['tle_c'].map(c => `${c.libelle}:${c.coefficient}`).sort();
    const coeffD = LYCEE_CONFIG['tle_d'].map(c => `${c.libelle}:${c.coefficient}`).sort();
    assert.deepStrictEqual(coeffC, coeffD);
  });
  it('36. 1ere A et Tle A ont Arabe/Espagnol comme groupe', async () => {
    const { LYCEE_CONFIG } = await import('../modules/defaults/defaults.template.js');
    const grp1ere = LYCEE_CONFIG['1ere_a'].find(c => c.libelle === 'Arabe/Espagnol');
    const grpTle = LYCEE_CONFIG['tle_a'].find(c => c.libelle === 'Arabe/Espagnol');
    assert.ok(grp1ere, 'Arabe/Espagnol manquant en 1ere A');
    assert.ok(grpTle, 'Arabe/Espagnol manquant en Tle A');
    assert.strictEqual(grp1ere.coefficient, 2);
    assert.strictEqual(grpTle.coefficient, 3);
  });
});

// ═══════════════════════════════════════════════════════
//  7. DEFAULTS SERVICE — export
// ═══════════════════════════════════════════════════════
describe('Defaults Service', () => {
  it('37. initializeDefaults est exporté', async () => {
    const svc = await import('../modules/defaults/defaults.service.js');
    assert.strictEqual(typeof svc.initializeDefaults, 'function');
  });
});

// ═══════════════════════════════════════════════════════
//  8. INSCRIPTIONS VALIDATION
// ═══════════════════════════════════════════════════════
describe('Inscriptions Validation', () => {
  it('38. createInscriptionSchema accepte langueChoisie optionnel', async () => {
    const { createInscriptionSchema } = await import('../modules/inscriptions/inscriptions.validation.js');
    const valid = createInscriptionSchema.parse({
      eleveId: '550e8400-e29b-41d4-a716-446655440000',
      classeId: '550e8400-e29b-41d4-a716-446655440001',
      anneeScolaire: '2025-2026'
    });
    assert.strictEqual(valid.langueChoisie, undefined);
    const withLangue = createInscriptionSchema.parse({
      eleveId: '550e8400-e29b-41d4-a716-446655440000',
      classeId: '550e8400-e29b-41d4-a716-446655440001',
      anneeScolaire: '2025-2026',
      langueChoisie: 'Arabe'
    });
    assert.strictEqual(withLangue.langueChoisie, 'Arabe');
  });
});

// ═══════════════════════════════════════════════════════
//  9. ELEVES SERVICE — exports
// ═══════════════════════════════════════════════════════
describe('Eleves Service', () => {
  it('39. createEleve est exporté', async () => {
    const svc = await import('../modules/eleves/eleves.service.js');
    assert.strictEqual(typeof svc.createEleve, 'function');
  });
  it('40. getAllEleves est exporté', async () => {
    const svc = await import('../modules/eleves/eleves.service.js');
    assert.strictEqual(typeof svc.getAllEleves, 'function');
  });
});

// ═══════════════════════════════════════════════════════
//  10. BULLETINS SERVICE — exports
// ═══════════════════════════════════════════════════════
describe('Bulletins Service', () => {
  it('41. calculateBulletin est exporté', async () => {
    const svc = await import('../modules/bulletins/bulletins.service.js');
    assert.strictEqual(typeof svc.calculateBulletin, 'function');
  });
  it('42. getClassement est exporté', async () => {
    const svc = await import('../modules/bulletins/bulletins.service.js');
    assert.strictEqual(typeof svc.getClassement, 'function');
  });
});

// ═══════════════════════════════════════════════════════
//  11. Lycée configs
// ═══════════════════════════════════════════════════════
describe('Defaults Template — Lycée complet', () => {
  it('43. 2nde A a Français et Espagnol', async () => {
    const { LYCEE_CONFIG } = await import('../modules/defaults/defaults.template.js');
    const fr = LYCEE_CONFIG['2nde_a'].find(c => c.libelle === 'Français');
    const esp = LYCEE_CONFIG['2nde_a'].find(c => c.libelle === 'Espagnol');
    assert.ok(fr, 'Français manquant en 2nde A');
    assert.ok(esp, 'Espagnol manquant en 2nde A');
  });
  it('44. 1ere A a Philosophie', async () => {
    const { LYCEE_CONFIG } = await import('../modules/defaults/defaults.template.js');
    const phil = LYCEE_CONFIG['1ere_a'].find(c => c.libelle === 'Philosophie');
    assert.ok(phil);
    assert.strictEqual(phil.coefficient, 1);
  });
  it('45. Tle A a Philosophie=4', async () => {
    const { LYCEE_CONFIG } = await import('../modules/defaults/defaults.template.js');
    const phil = LYCEE_CONFIG['tle_a'].find(c => c.libelle === 'Philosophie');
    assert.strictEqual(phil?.coefficient, 4);
  });
  it('46. Tle C a Physique Chimie=5', async () => {
    const { LYCEE_CONFIG } = await import('../modules/defaults/defaults.template.js');
    const pc = LYCEE_CONFIG['tle_c'].find(c => c.libelle === 'Physique Chimie');
    assert.strictEqual(pc?.coefficient, 5);
  });
  it('47. 2nde A a Math=3', async () => {
    const { LYCEE_CONFIG } = await import('../modules/defaults/defaults.template.js');
    const math = LYCEE_CONFIG['2nde_a'].find(c => c.libelle === 'Mathématiques');
    assert.strictEqual(math?.coefficient, 3);
  });
  it('48. 2nde C a Math=4', async () => {
    const { LYCEE_CONFIG } = await import('../modules/defaults/defaults.template.js');
    const math = LYCEE_CONFIG['2nde_c'].find(c => c.libelle === 'Mathématiques');
    assert.strictEqual(math?.coefficient, 4);
  });
});
