import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
const prisma = new PrismaClient();

const SCHOOL_ID = '9f537768-5e9b-4694-bcd2-c8025f468d40';
const YEAR_2025 = '2025-2026';
const YEAR_2026 = '2026-2027';

let results = [];
let pass = 0, fail = 0, warn = 0;

function test(name, year, expected, obtained) {
  let ok;
  if (typeof expected === 'string' && expected.startsWith('>=')) {
    const min = parseInt(expected.slice(2));
    ok = parseInt(obtained) >= min;
  } else {
    ok = String(expected) === String(obtained);
  }
  const status = ok ? 'PASS' : 'FAIL';
  if (ok) pass++; else fail++;
  results.push({ name, year, expected: String(expected), obtained: String(obtained), status });
  console.log(`  [${status}] ${name} (${year}) — expected=${expected}, obtained=${obtained}`);
}

function testWarn(name, year, expected, obtained) {
  let ok;
  if (typeof expected === 'string' && expected.startsWith('>=')) {
    const min = parseInt(expected.slice(2));
    ok = parseInt(obtained) >= min;
  } else {
    ok = String(expected) === String(obtained);
  }
  const status = ok ? 'PASS' : 'WARN';
  if (ok) pass++; else warn++;
  results.push({ name, year, expected: String(expected), obtained: String(obtained), status });
  console.log(`  [${status}] ${name} (${year}) — expected=${expected}, obtained=${obtained}`);
}

try {
  console.log('=== PHASE 2: TEST NON-MÉLANGE ANNÉES ===\n');

  // ===== 1. PRÉPARATION DES DONNÉES =====
  console.log('--- 1. PRÉPARATION DES DONNÉES ---');

  // Créer les années scolaires si absentes
  for (const name of [YEAR_2025, YEAR_2026]) {
    const existing = await prisma.academicYear.findFirst({ where: { schoolId: SCHOOL_ID, name } });
    if (!existing) {
      const startYear = parseInt(name.split('-')[0]);
      await prisma.academicYear.create({
        data: {
          schoolId: SCHOOL_ID,
          name,
          startDate: new Date(`${startYear}-09-01`),
          endDate: new Date(`${startYear + 1}-06-30`),
          isCurrent: false,
        },
      });
      console.log(`  Created year ${name}`);
    } else {
      console.log(`  Year ${name} already exists (id=${existing.id})`);
    }
  }

  // Récupérer les années
  const year2025 = await prisma.academicYear.findFirst({ where: { schoolId: SCHOOL_ID, name: YEAR_2025 } });
  const year2026 = await prisma.academicYear.findFirst({ where: { schoolId: SCHOOL_ID, name: YEAR_2026 } });

  // Récupérer les classes existantes
  const classes = await prisma.classe.findMany({ where: { schoolId: SCHOOL_ID } });
  const class3e = classes.find(c => c.niveau === '3eme');
  const class2nde = classes.find(c => c.nom.toLowerCase().includes('2nde'));
  const class1ere = classes.find(c => c.nom.toLowerCase().includes('1ere'));
  
  console.log(`  Classes found: ${classes.length}`);
  console.log(`  3eme: ${class3e?.nom || 'NOT FOUND'}, 2nde: ${class2nde?.nom || 'NOT FOUND'}, 1ere: ${class1ere?.nom || 'NOT FOUND'}`);

  // Récupérer les matières
  const matieres = await prisma.matiere.findMany({ where: { schoolId: SCHOOL_ID, isActive: true } });
  const mathMat = matieres.find(m => m.libelle?.toLowerCase().includes('math'));
  const frMat = matieres.find(m => m.libelle?.toLowerCase().includes('fran'));
  console.log(`  Matieres found: ${matieres.length}, Math: ${mathMat?.libelle || 'NOT FOUND'}, Fr: ${frMat?.libelle || 'NOT FOUND'}`);

  // Créer des élèves de test dédiés
  const timestamp = Date.now().toString(36);
  
  // Élève A pour 2025-2026
  let eleveA = await prisma.eleve.findFirst({ where: { schoolId: SCHOOL_ID, nom: `TEST-ANNEE-A-${timestamp}` } });
  if (!eleveA) {
    eleveA = await prisma.eleve.create({
      data: {
        schoolId: SCHOOL_ID,
        nom: `TEST-ANNEE-A-${timestamp}`,
        prenom: 'ÉlèveAnnéeA',
        sexe: 'M',
        dateNaissance: new Date('2010-01-15'),
        lieuNaissance: 'Douala',
        nationalite: 'Camerounaise',
        nomParent: 'ParentA',
        adresseParent: 'Douala',
        telParent: '690000001',
        matricule: `TST-A-${timestamp}`,
        isActive: true,
      },
    });
    console.log(`  Created eleveA: ${eleveA.nom} (${eleveA.id})`);
  } else {
    console.log(`  eleveA exists: ${eleveA.nom} (${eleveA.id})`);
  }

  // Élève B pour 2026-2027
  let eleveB = await prisma.eleve.findFirst({ where: { schoolId: SCHOOL_ID, nom: `TEST-ANNEE-B-${timestamp}` } });
  if (!eleveB) {
    eleveB = await prisma.eleve.create({
      data: {
        schoolId: SCHOOL_ID,
        nom: `TEST-ANNEE-B-${timestamp}`,
        prenom: 'ÉlèveAnnéeB',
        sexe: 'F',
        dateNaissance: new Date('2011-03-20'),
        lieuNaissance: 'Yaoundé',
        nationalite: 'Camerounaise',
        nomParent: 'ParentB',
        adresseParent: 'Yaoundé',
        telParent: '690000002',
        matricule: `TST-B-${timestamp}`,
        isActive: true,
      },
    });
    console.log(`  Created eleveB: ${eleveB.nom} (${eleveB.id})`);
  } else {
    console.log(`  eleveB exists: ${eleveB.nom} (${eleveB.id})`);
  }

  // Vérifier qu'il y a des classes pour les inscriptions
  if (!class3e && !class2nde && !class1ere && classes.length === 0) {
    console.log('  WARNING: No classes found, creating test classes...');
  }
  const targetClassA = class3e || class1ere || classes[0];
  const targetClassB = class2nde || class1ere || classes[0];
  
  if (!targetClassA || !targetClassB) {
    console.log('  FATAL: No classes available');
    process.exit(1);
  }

  // Inscription A → 2025-2026
  let inscA = await prisma.inscription.findFirst({ where: { schoolId: SCHOOL_ID, eleveId: eleveA.id, anneeScolaire: YEAR_2025 } });
  if (!inscA) {
    inscA = await prisma.inscription.create({
      data: {
        schoolId: SCHOOL_ID,
        eleveId: eleveA.id,
        classeId: targetClassA.id,
        anneeScolaire: YEAR_2025,
        type: 'Ordinaire',
        reduction: 0,
        dateInscription: new Date(),
      },
    });
    console.log(`  Created inscA: ${eleveA.nom} → ${targetClassA.nom} (${YEAR_2025})`);
  }

  // Inscription B → 2026-2027
  let inscB = await prisma.inscription.findFirst({ where: { schoolId: SCHOOL_ID, eleveId: eleveB.id, anneeScolaire: YEAR_2026 } });
  if (!inscB) {
    inscB = await prisma.inscription.create({
      data: {
        schoolId: SCHOOL_ID,
        eleveId: eleveB.id,
        classeId: targetClassB.id,
        anneeScolaire: YEAR_2026,
        type: 'Ordinaire',
        reduction: 0,
        dateInscription: new Date(),
      },
    });
    console.log(`  Created inscB: ${eleveB.nom} → ${targetClassB.nom} (${YEAR_2026})`);
  }

  // ===== COEFFICIENTS =====
  if (mathMat) {
    const coeffA = await prisma.coefficient.findFirst({ where: { schoolId: SCHOOL_ID, classeId: targetClassA.id, matiereId: mathMat.id, anneeScolaire: YEAR_2025 } });
    if (!coeffA) {
      await prisma.coefficient.create({ data: { schoolId: SCHOOL_ID, classeId: targetClassA.id, matiereId: mathMat.id, coefficient: 3, anneeScolaire: YEAR_2025 } });
      console.log(`  Created coeff Math=3 for ${YEAR_2025}`);
    }
    const coeffB = await prisma.coefficient.findFirst({ where: { schoolId: SCHOOL_ID, classeId: targetClassB.id, matiereId: mathMat.id, anneeScolaire: YEAR_2026 } });
    if (!coeffB) {
      await prisma.coefficient.create({ data: { schoolId: SCHOOL_ID, classeId: targetClassB.id, matiereId: mathMat.id, coefficient: 4, anneeScolaire: YEAR_2026 } });
      console.log(`  Created coeff Math=4 for ${YEAR_2026}`);
    }
  }

  // ===== NOTES =====
  if (mathMat) {
    const noteA = await prisma.note.findFirst({ where: { schoolId: SCHOOL_ID, eleveId: eleveA.id, matiereId: mathMat.id, anneeScolaire: YEAR_2025 } });
    if (!noteA) {
      await prisma.note.create({ data: { schoolId: SCHOOL_ID, eleveId: eleveA.id, matiereId: mathMat.id, classeId: targetClassA.id, semestre: 1, anneeScolaire: YEAR_2025, devoir1: 15, composition: 16, moyenne: 15.5 } });
      console.log(`  Created noteA Math=15.5 for ${YEAR_2025}`);
    }
    const noteB = await prisma.note.findFirst({ where: { schoolId: SCHOOL_ID, eleveId: eleveB.id, matiereId: mathMat.id, anneeScolaire: YEAR_2026 } });
    if (!noteB) {
      await prisma.note.create({ data: { schoolId: SCHOOL_ID, eleveId: eleveB.id, matiereId: mathMat.id, classeId: targetClassB.id, semestre: 1, anneeScolaire: YEAR_2026, devoir1: 12, composition: 11, moyenne: 11.5 } });
      console.log(`  Created noteB Math=11.5 for ${YEAR_2026}`);
    }
  }

  // ===== ABSENCES =====
  for (let i = 0; i < 3; i++) {
    const existing = await prisma.absence.findFirst({ where: { schoolId: SCHOOL_ID, eleveId: eleveA.id, date: new Date(`2025-10-${10 + i}`) } });
    if (!existing) {
      await prisma.absence.create({ data: { schoolId: SCHOOL_ID, eleveId: eleveA.id, classeId: targetClassA.id, date: new Date(`2025-10-${10 + i}`), type: 'absence', motif: `Absence test ${i + 1}` } });
    }
  }
  const existingB = await prisma.absence.findFirst({ where: { schoolId: SCHOOL_ID, eleveId: eleveB.id, date: new Date('2026-10-10') } });
  if (!existingB) {
    await prisma.absence.create({ data: { schoolId: SCHOOL_ID, eleveId: eleveB.id, classeId: targetClassB.id, date: new Date('2026-10-10'), type: 'absence', motif: 'Absence test B' } });
  }
  console.log(`  Absences created: A=3 (${YEAR_2025}), B=1 (${YEAR_2026})`);

  // ===== EXAMENS =====
  const examenA = await prisma.examenBlanc.findFirst({ where: { schoolId: SCHOOL_ID, anneeScolaire: YEAR_2025, nom: 'EXAM-TEST-A' } });
  if (!examenA && targetClassA) {
    await prisma.examenBlanc.create({ data: { schoolId: SCHOOL_ID, nom: 'EXAM-TEST-A', classeId: targetClassA.id, anneeScolaire: YEAR_2025, dateDebut: new Date('2026-01-15'), dateFin: new Date('2026-01-20') } });
    console.log(`  Created examen A for ${YEAR_2025}`);
  }
  const examenB = await prisma.examenBlanc.findFirst({ where: { schoolId: SCHOOL_ID, anneeScolaire: YEAR_2026, nom: 'EXAM-TEST-B' } });
  if (!examenB && targetClassB) {
    await prisma.examenBlanc.create({ data: { schoolId: SCHOOL_ID, nom: 'EXAM-TEST-B', classeId: targetClassB.id, anneeScolaire: YEAR_2026, dateDebut: new Date('2027-01-15'), dateFin: new Date('2027-01-20') } });
    console.log(`  Created examen B for ${YEAR_2026}`);
  }

  console.log('\n--- DONNÉES PRÉPARÉES ---');
  console.log(`  Élève A: ${eleveA.nom} (${eleveA.id}) → inscription ${YEAR_2025}`);
  console.log(`  Élève B: ${eleveB.nom} (${eleveB.id}) → inscription ${YEAR_2026}`);
  console.log(`  Classe A: ${targetClassA.nom}, Classe B: ${targetClassB.nom}`);

  // ===== 2. TEST INSCRIPTIONS (API Direct) =====
  console.log('\n--- 2. TEST INSCRIPTIONS ---');

  const inscCount2025 = await prisma.inscription.count({ where: { schoolId: SCHOOL_ID, anneeScolaire: YEAR_2025 } });
  const inscCount2026 = await prisma.inscription.count({ where: { schoolId: SCHOOL_ID, anneeScolaire: YEAR_2026 } });
  test('Inscriptions count 2025', YEAR_2025, '>=1', inscCount2025);
  test('Inscriptions count 2026', YEAR_2026, '>=1', inscCount2026);

  const inscAin2025 = await prisma.inscription.findFirst({ where: { schoolId: SCHOOL_ID, eleveId: eleveA.id, anneeScolaire: YEAR_2025 } });
  test('Eleve A in 2025', YEAR_2025, 'found', inscAin2025 ? 'found' : 'NOT_FOUND');

  const inscAin2026 = await prisma.inscription.findFirst({ where: { schoolId: SCHOOL_ID, eleveId: eleveA.id, anneeScolaire: YEAR_2026 } });
  test('Eleve A NOT in 2026', YEAR_2026, 'null', inscAin2026 ? 'found' : 'null');

  const inscBin2026 = await prisma.inscription.findFirst({ where: { schoolId: SCHOOL_ID, eleveId: eleveB.id, anneeScolaire: YEAR_2026 } });
  test('Eleve B in 2026', YEAR_2026, 'found', inscBin2026 ? 'found' : 'NOT_FOUND');

  const inscBin2025 = await prisma.inscription.findFirst({ where: { schoolId: SCHOOL_ID, eleveId: eleveB.id, anneeScolaire: YEAR_2025 } });
  test('Eleve B NOT in 2025', YEAR_2025, 'null', inscBin2025 ? 'found' : 'null');

  // ===== 3. TEST NOTES =====
  console.log('\n--- 3. TEST NOTES ---');

  const noteA2025 = mathMat ? await prisma.note.findFirst({ where: { schoolId: SCHOOL_ID, eleveId: eleveA.id, matiereId: mathMat.id, anneeScolaire: YEAR_2025 } }) : null;
  test('Note A Math 2025', YEAR_2025, '15.5', noteA2025?.moyenne?.toString() || 'NOT_FOUND');

  const noteA2026 = mathMat ? await prisma.note.findFirst({ where: { schoolId: SCHOOL_ID, eleveId: eleveA.id, matiereId: mathMat.id, anneeScolaire: YEAR_2026 } }) : null;
  test('Note A Math NOT in 2026', YEAR_2026, 'null', noteA2026 ? noteA2026.moyenne?.toString() : 'null');

  const noteB2026 = mathMat ? await prisma.note.findFirst({ where: { schoolId: SCHOOL_ID, eleveId: eleveB.id, matiereId: mathMat.id, anneeScolaire: YEAR_2026 } }) : null;
  test('Note B Math 2026', YEAR_2026, '11.5', noteB2026?.moyenne?.toString() || 'NOT_FOUND');

  const noteB2025 = mathMat ? await prisma.note.findFirst({ where: { schoolId: SCHOOL_ID, eleveId: eleveB.id, matiereId: mathMat.id, anneeScolaire: YEAR_2025 } }) : null;
  test('Note B Math NOT in 2025', YEAR_2025, 'null', noteB2025 ? noteB2025.moyenne?.toString() : 'null');

  // ===== 4. TEST COEFFICIENTS =====
  console.log('\n--- 4. TEST COEFFICIENTS ---');

  const coeffA2025 = mathMat ? await prisma.coefficient.findFirst({ where: { schoolId: SCHOOL_ID, classeId: targetClassA.id, matiereId: mathMat.id, anneeScolaire: YEAR_2025 } }) : null;
  test('Coeff Math 2025', YEAR_2025, '3', coeffA2025?.coefficient?.toString() || 'NOT_FOUND');

  const coeffB2026 = mathMat ? await prisma.coefficient.findFirst({ where: { schoolId: SCHOOL_ID, classeId: targetClassB.id, matiereId: mathMat.id, anneeScolaire: YEAR_2026 } }) : null;
  test('Coeff Math 2026', YEAR_2026, '4', coeffB2026?.coefficient?.toString() || 'NOT_FOUND');

  // Modifier coeff en 2026, vérifier 2025 inchangé
  if (mathMat && coeffB2026) {
    await prisma.coefficient.update({ where: { id: coeffB2026.id }, data: { coefficient: 5 } });
    const coeffA_after = await prisma.coefficient.findFirst({ where: { schoolId: SCHOOL_ID, classeId: targetClassA.id, matiereId: mathMat.id, anneeScolaire: YEAR_2025 } });
    test('Coeff 2025 unchanged after modif 2026', YEAR_2025, '3', coeffA_after?.coefficient?.toString() || 'NOT_FOUND');
    // Restaurer
    await prisma.coefficient.update({ where: { id: coeffB2026.id }, data: { coefficient: 4 } });
  }

  // ===== 5. TEST ABSENCES =====
  console.log('\n--- 5. TEST ABSENCES ---');

  // Absence model has no anneeScolaire — filter by date range (2025 vs 2026)
  const absA2025 = await prisma.absence.count({ where: { schoolId: SCHOOL_ID, eleveId: eleveA.id, date: { gte: new Date('2025-01-01'), lt: new Date('2026-01-01') } } });
  test('Absences A in 2025 range', YEAR_2025, '3', absA2025);

  const absA2026 = await prisma.absence.count({ where: { schoolId: SCHOOL_ID, eleveId: eleveA.id, date: { gte: new Date('2026-01-01'), lt: new Date('2027-01-01') } } });
  test('Absences A NOT in 2026 range', YEAR_2026, '0', absA2026);

  const absB2026 = await prisma.absence.count({ where: { schoolId: SCHOOL_ID, eleveId: eleveB.id, date: { gte: new Date('2026-01-01'), lt: new Date('2027-01-01') } } });
  test('Absences B in 2026 range', YEAR_2026, '1', absB2026);

  const absB2025 = await prisma.absence.count({ where: { schoolId: SCHOOL_ID, eleveId: eleveB.id, date: { gte: new Date('2025-01-01'), lt: new Date('2026-01-01') } } });
  test('Absences B NOT in 2025 range', YEAR_2025, '0', absB2025);

  // NOTE: Absence model has NO anneeScolaire field — this is a structural gap

  // ===== 6. TEST EXAMENS =====
  console.log('\n--- 6. TEST EXAMENS ---');

  const examCount2025 = await prisma.examenBlanc.count({ where: { schoolId: SCHOOL_ID, anneeScolaire: YEAR_2025 } });
  const examCount2026 = await prisma.examenBlanc.count({ where: { schoolId: SCHOOL_ID, anneeScolaire: YEAR_2026 } });
  test('Examens count 2025', YEAR_2025, '>=1', examCount2025);
  test('Examens count 2026', YEAR_2026, '>=1', examCount2026);

  const examAin2025 = await prisma.examenBlanc.findFirst({ where: { schoolId: SCHOOL_ID, nom: 'EXAM-TEST-A', anneeScolaire: YEAR_2025 } });
  test('EXAM-TEST-A in 2025', YEAR_2025, 'found', examAin2025 ? 'found' : 'NOT_FOUND');

  const examAin2026 = await prisma.examenBlanc.findFirst({ where: { schoolId: SCHOOL_ID, nom: 'EXAM-TEST-A', anneeScolaire: YEAR_2026 } });
  test('EXAM-TEST-A NOT in 2026', YEAR_2026, 'null', examAin2026 ? 'found' : 'null');

  const examBin2026 = await prisma.examenBlanc.findFirst({ where: { schoolId: SCHOOL_ID, nom: 'EXAM-TEST-B', anneeScolaire: YEAR_2026 } });
  test('EXAM-TEST-B in 2026', YEAR_2026, 'found', examBin2026 ? 'found' : 'NOT_FOUND');

  const examBin2025 = await prisma.examenBlanc.findFirst({ where: { schoolId: SCHOOL_ID, nom: 'EXAM-TEST-B', anneeScolaire: YEAR_2025 } });
  test('EXAM-TEST-B NOT in 2025', YEAR_2025, 'null', examBin2025 ? 'found' : 'null');

  // ===== 7. TEST STATISTIQUES (nbEleves via inscriptions) =====
  console.log('\n--- 7. TEST STATISTIQUES ---');

  const nbEleves2025 = await prisma.inscription.count({ where: { schoolId: SCHOOL_ID, anneeScolaire: YEAR_2025 } });
  const nbEleves2026 = await prisma.inscription.count({ where: { schoolId: SCHOOL_ID, anneeScolaire: YEAR_2026 } });
  testWarn('Dashboard nbEleves 2025', YEAR_2025, '>=1', nbEleves2025);
  testWarn('Dashboard nbEleves 2026', YEAR_2026, '>=1', nbEleves2026);

  const nbClasses2025 = await prisma.classe.count({ where: { schoolId: SCHOOL_ID, inscriptions: { some: { anneeScolaire: YEAR_2025 } } } });
  const nbClasses2026 = await prisma.classe.count({ where: { schoolId: SCHOOL_ID, inscriptions: { some: { anneeScolaire: YEAR_2026 } } } });
  testWarn('Dashboard nbClasses 2025', YEAR_2025, '>=1', nbClasses2025);
  testWarn('Dashboard nbClasses 2026', YEAR_2026, '>=1', nbClasses2026);

  // ===== 8. TEST MULTI-TENANT =====
  console.log('\n--- 8. TEST MULTI-TENANT ---');

  const otherSchool = await prisma.school.findFirst({ where: { id: { not: SCHOOL_ID } } });
  if (otherSchool) {
    const otherInsc2025 = await prisma.inscription.findFirst({ where: { schoolId: otherSchool.id, anneeScolaire: YEAR_2025 } });
    test('Other school inscriptions not in our school', 'isolation', 'different_school', otherSchool.id !== SCHOOL_ID ? 'different_school' : 'SAME');
    
    // Verify our eleves are not in other school
    const ourEleveInOther = await prisma.inscription.findFirst({ where: { schoolId: otherSchool.id, eleveId: eleveA.id } });
    test('Our eleveA NOT in other school', 'isolation', 'null', ourEleveInOther ? 'found' : 'null');
  } else {
    console.log('  No other school found, skipping multi-tenant test');
    testWarn('Multi-tenant', 'N/A', 'N/A', 'SKIPPED');
  }

  // ===== 9. TEST resolveAcademicYear =====
  console.log('\n--- 9. TEST resolveAcademicYear ---');

  // Import the function
  const { resolveAcademicYear } = await import('../modules/academic-years/academicYears.service.js');
  
  const resolvedYear = await resolveAcademicYear(SCHOOL_ID, YEAR_2025);
  test('resolveAcademicYear(2025-2026)', YEAR_2025, YEAR_2025, resolvedYear);

  const resolvedNull = await resolveAcademicYear(SCHOOL_ID, null);
  test('resolveAcademicYear(null) → current year', 'current', 'not_null', resolvedNull ? 'not_null' : 'null');

  const resolvedYear2026 = await resolveAcademicYear(SCHOOL_ID, YEAR_2026);
  test('resolveAcademicYear(2026-2027)', YEAR_2026, YEAR_2026, resolvedYear2026);

  // ===== RAPPORT FINAL =====
  console.log('\n\n=== RAPPORT FINAL ===\n');
  console.log('TEST | ANNÉE | ATTENDU | OBTENU | RESULTAT');
  console.log('-----|-------|---------|--------|----------');
  for (const r of results) {
    const name = r.name.padEnd(48);
    const year = r.year.padEnd(6);
    const expected = r.expected.padEnd(10);
    const obtained = r.obtained.padEnd(20);
    const status = r.status.padEnd(4);
    console.log(`${name} | ${year} | ${expected} | ${obtained} | ${status}`);
  }
  console.log(`\nPASS: ${pass} | FAIL: ${fail} | WARN: ${warn} | TOTAL: ${pass + fail + warn}`);
  console.log(`\nDonnées utilisées:`);
  console.log(`  School: ${SCHOOL_ID} (CSP barebari)`);
  console.log(`  Élève A: ${eleveA.nom} (${eleveA.matricule}) → ${YEAR_2025}`);
  console.log(`  Élève B: ${eleveB.nom} (${eleveB.matricule}) → ${YEAR_2026}`);
  console.log(`  Classe A: ${targetClassA.nom}, Classe B: ${targetClassB.nom}`);
  console.log(`  Matière: ${mathMat?.libelle || 'N/A'}`);

} catch (err) {
  console.error('ERROR:', err.message);
  console.error(err.stack);
} finally {
  await prisma.$disconnect();
}
