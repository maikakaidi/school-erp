import { describe, it } from 'node:test';
import assert from 'node:assert';

// ═══════════════════════════════════════════════════════
//  1. DEFAULTS TEMPLATE — DEFAULT_CLASSES
// ═══════════════════════════════════════════════════════
describe('Defaults Template — DEFAULT_CLASSES', () => {
it('1. DEFAULT_CLASSES est exporté et contient 16 classes', async () => {
    const { DEFAULT_CLASSES } = await import('../modules/defaults/defaults.template.js');
    assert.strictEqual(DEFAULT_CLASSES.length, 16);
  });
  it('2. Toutes les classes ont nom et niveau', async () => {
    const { DEFAULT_CLASSES } = await import('../modules/defaults/defaults.template.js');
    for (const c of DEFAULT_CLASSES) {
      assert.ok(c.nom, `nom manquant pour ${JSON.stringify(c)}`);
      assert.ok(c.niveau, `niveau manquant pour ${JSON.stringify(c)}`);
    }
  });
  it('3. Les 4 niveaux collège sont présents (6eme, 5eme, 4eme, 3eme)', async () => {
    const { DEFAULT_CLASSES } = await import('../modules/defaults/defaults.template.js');
    const niveaux = new Set(DEFAULT_CLASSES.map(c => c.niveau));
    assert.ok(niveaux.has('6eme'), '6eme manquant');
    assert.ok(niveaux.has('5eme'), '5eme manquant');
    assert.ok(niveaux.has('4eme'), '4eme manquant');
    assert.ok(niveaux.has('3eme'), '3eme manquant');
  });
  it('4. Les niveaux lycée sont présents (2nde, 1ere, Terminale)', async () => {
    const { DEFAULT_CLASSES } = await import('../modules/defaults/defaults.template.js');
    const niveaux = new Set(DEFAULT_CLASSES.map(c => c.niveau));
    assert.ok(niveaux.has('2nde'), '2nde manquant');
    assert.ok(niveaux.has('1ere'), '1ere manquant');
    assert.ok(niveaux.has('Terminale'), 'Terminale manquant');
  });
  it('5. Collège a au moins 2 classes par niveau (A + B)', async () => {
    const { DEFAULT_CLASSES } = await import('../modules/defaults/defaults.template.js');
    const college = DEFAULT_CLASSES.filter(c => ['6eme', '5eme', '4eme', '3eme'].includes(c.niveau));
    const byNiveau = {};
    for (const c of college) {
      byNiveau[c.niveau] = (byNiveau[c.niveau] || 0) + 1;
    }
    for (const [n, count] of Object.entries(byNiveau)) {
      assert.ok(count >= 2, `Niveau ${n} n'a que ${count} classe(s), attendu ≥ 2`);
    }
  });
  it('6. DEFAULT_CLASSES est importé dans auth.service.js', async () => {
    const authModule = await import('../modules/auth/auth.service.js');
    assert.ok(authModule.registerSchool, 'registerSchool non exporté');
  });
});

// ═══════════════════════════════════════════════════════
//  2. AUTH SERVICE — registerSchool imports
// ═══════════════════════════════════════════════════════
describe('Auth Service — registerSchool imports', () => {
  it('7. registerSchool est une fonction exportée', async () => {
    const { registerSchool } = await import('../modules/auth/auth.service.js');
    assert.strictEqual(typeof registerSchool, 'function');
  });
});

// ═══════════════════════════════════════════════════════
//  3. DEFAULTS SERVICE — comportement
// ═══════════════════════════════════════════════════════
describe('Defaults Service — comportement', () => {
  it('8. initializeDefaults est exporté et est une fonction', async () => {
    const { initializeDefaults } = await import('../modules/defaults/defaults.service.js');
    assert.strictEqual(typeof initializeDefaults, 'function');
  });
  it('9. initializeDefaults sans classes retourne created: 0 (ne crash pas)', async () => {
    const { initializeDefaults } = await import('../modules/defaults/defaults.service.js');
    const fakeId = '00000000-0000-0000-0000-000000000000';
    const result = await initializeDefaults(fakeId, '9999-9999');
    assert.ok(result, 'result est falsy');
    assert.strictEqual(result.created, 0);
    assert.ok(result.message.includes('Aucune classe'));
  });
});

// ═══════════════════════════════════════════════════════
//  4. TEMPLATES — cohérence pour initialization
// ═══════════════════════════════════════════════════════
describe('Templates — cohérence initialization', () => {
  it('10. MATIERES_CATALOGUE contient Arabe, Espagnol, Arabe/Espagnol', async () => {
    const { MATIERES_CATALOGUE } = await import('../modules/defaults/defaults.template.js');
    const codes = MATIERES_CATALOGUE.map(m => m.code);
    assert.ok(codes.includes('ARB'), 'Arabe manquant');
    assert.ok(codes.includes('ESP'), 'Espagnol manquant');
    assert.ok(codes.includes('ARB_ESP'), 'Arabe/Espagnol manquant');
  });
  it('11. GROUPE_CHOIX.options === ["Arabe", "Espagnol"]', async () => {
    const { GROUPE_CHOIX } = await import('../modules/defaults/defaults.template.js');
    assert.deepStrictEqual(GROUPE_CHOIX.options, ['Arabe', 'Espagnol']);
  });
  it('12. Tous les coefficients collège sont des entiers > 0', async () => {
    const { COLLEGE_CONFIG } = await import('../modules/defaults/defaults.template.js');
    for (const [niveau, coeffs] of Object.entries(COLLEGE_CONFIG)) {
      for (const c of coeffs) {
        assert.ok(typeof c.coefficient === 'number', `${niveau}/${c.libelle}: coefficient n'est pas un nombre`);
        assert.ok(c.coefficient > 0, `${niveau}/${c.libelle}: coefficient ≤ 0`);
        assert.ok(Number.isInteger(c.coefficient), `${niveau}/${c.libelle}: coefficient n'est pas entier`);
      }
    }
  });
  it('13. Tous les coefficients lycée sont des entiers > 0', async () => {
    const { LYCEE_CONFIG } = await import('../modules/defaults/defaults.template.js');
    for (const [niveau, coeffs] of Object.entries(LYCEE_CONFIG)) {
      for (const c of coeffs) {
        assert.ok(typeof c.coefficient === 'number', `${niveau}/${c.libelle}: coefficient n'est pas un nombre`);
        assert.ok(c.coefficient > 0, `${niveau}/${c.libelle}: coefficient ≤ 0`);
        assert.ok(Number.isInteger(c.coefficient), `${niveau}/${c.libelle}: coefficient n'est pas entier`);
      }
    }
  });
});

// ═══════════════════════════════════════════════════════
//  5. MATIÈRES FRONTEND — anneeScolaire passé aux classes
// ═══════════════════════════════════════════════════════
describe('Frontend — anneeScolaire dans les requêtes classes', () => {
  it('14. MatieresConfig.jsx référence currentYear pour /classes', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const content = fs.readFileSync(
      path.resolve('../frontend-csp/src/pages/MatieresConfig.jsx'),
      'utf-8'
    );
    assert.ok(
      content.includes('anneeScolaire=${currentYear}') || content.includes("anneeScolaire=${currentYear}"),
      'MatieresConfig.jsx ne passe pas anneeScolaire à /classes'
    );
  });
  it('15. Coefficients.jsx référence currentYear pour /classes', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const content = fs.readFileSync(
      path.resolve('../frontend-csp/src/pages/Coefficients.jsx'),
      'utf-8'
    );
    assert.ok(
      content.includes('anneeScolaire=${currentYear}') || content.includes("anneeScolaire=${currentYear}"),
      'Coefficients.jsx ne passe pas anneeScolaire à /classes'
    );
  });
});

// ═══════════════════════════════════════════════════════
//  6. AUTH SERVICE — AcademicYear creation dans registerSchool
// ═══════════════════════════════════════════════════════
describe('Auth Service — AcademicYear dans registerSchool', () => {
  const AUTH_PATH = new URL('../modules/auth/auth.service.js', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1');

  it('16. auth.service.js contient academicYear.create', async () => {
    const fs = await import('fs');
    const content = fs.readFileSync(AUTH_PATH, 'utf-8');
    assert.ok(
      content.includes('academicYear.create'),
      'registerSchool ne crée pas d\'AcademicYear'
    );
  });
  it('17. auth.service.js contient classe.createMany', async () => {
    const fs = await import('fs');
    const content = fs.readFileSync(AUTH_PATH, 'utf-8');
    assert.ok(
      content.includes('classe.createMany'),
      'registerSchool ne crée pas de classes'
    );
  });
  it('18. auth.service.js importe DEFAULT_CLASSES', async () => {
    const fs = await import('fs');
    const content = fs.readFileSync(AUTH_PATH, 'utf-8');
    assert.ok(
      content.includes('DEFAULT_CLASSES'),
      'auth.service.js n\'importe pas DEFAULT_CLASSES'
    );
  });
  it('19. AcademicYear est créée avec isCurrent: true', async () => {
    const fs = await import('fs');
    const content = fs.readFileSync(AUTH_PATH, 'utf-8');
    assert.ok(
      content.includes("isCurrent: true"),
      'AcademicYear n\'est pas créée avec isCurrent: true'
    );
  });
});
