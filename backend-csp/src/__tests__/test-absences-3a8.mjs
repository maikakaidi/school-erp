const BASE = 'http://localhost:5000/api';
let TOKEN_SCHOOL = '';
let TOKEN_PARENT = '';
let TOKEN_ELEVE = '';
const results = [];
let pass = 0, fail = 0;

function test(name, expected, obtained, silent = false) {
  const ok = String(expected) === String(obtained);
  const status = ok ? 'PASS' : 'FAIL';
  if (ok) pass++; else fail++;
  results.push({ name, expected: String(expected), obtained: String(obtained), status });
  if (!silent) console.log(`  [${status}] ${name} — expected=${expected}, obtained=${obtained}`);
}

async function api(method, path, body, token = TOKEN_SCHOOL) {
  const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
  const opts = { method, headers, signal: AbortSignal.timeout(20000) };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE}${path}`, opts);
  const text = await res.text();
  if (!res.ok && res.status !== 404) throw new Error(`HTTP ${res.status}: ${text}`);
  if (res.status === 204) return null;
  try { return JSON.parse(text); } catch { return text; }
}

async function main() {
  console.log('=== 3A.8: TESTS FONCTIONNELS ABSENCES ===\n');

  // Login
  const login = await api('POST', '/auth/login', { phone: '690000000', password: 'Gxggxg1234@' });
  TOKEN_SCHOOL = login.accessToken;
  const schoolId = login.school.id;

  // Get years
  const years = await api('GET', '/academic-years');
  const y2025 = years.find(y => y.name === '2025-2026');
  const y2026 = years.find(y => y.name === '2026-2027');
  console.log(`School: ${schoolId.substring(0,8)} | Years: ${y2025?.name}, ${y2026?.name}\n`);

  // Find a class and students
  const classes = await api('GET', '/classes?limit=5');
  const classeId = classes.classes[0].id;
  console.log(`Using class: ${classes.classes[0].nom} (${classeId.substring(0,8)})\n`);

  // Find test students with inscriptions
  const inscA = await api('GET', `/inscriptions?anneeScolaire=2025-2026`);
  const inscB = await api('GET', `/inscriptions?anneeScolaire=2026-2027`);
  const eleveA = inscA?.find(i => i.eleve?.nom?.includes('TEST-ANNEE-A'));
  const eleveB = inscB?.find(i => i.eleve?.nom?.includes('TEST-ANNEE-B'));

  if (!eleveA || !eleveB) {
    console.log('WARNING: Test students not found, using first available inscriptions');
  }

  const testEleveA = eleveA?.eleveId || inscA?.[0]?.eleveId;
  const testEleveAclasse = eleveA?.classeId || inscA?.[0]?.classeId;
  const testEleveB = eleveB?.eleveId || inscB?.[0]?.eleveId;
  const testEleveBclasse = eleveB?.classeId || inscB?.[0]?.classeId;

  console.log(`Eleve A: ${testEleveA?.substring(0,8)} (2025-2026, classe ${testEleveAclasse?.substring(0,8)})`);
  console.log(`Eleve B: ${testEleveB?.substring(0,8)} (2026-2027, classe ${testEleveBclasse?.substring(0,8)})\n`);

  // ═══════════════════════════════════════════════════
  // 1. CRÉATION ABSENCE 2025-2026
  // ═══════════════════════════════════════════════════
  console.log('--- 1. CRÉATION ABSENCES ---');
  const absA = await api('POST', '/absences', {
    eleveId: testEleveA,
    classeId: testEleveAclasse,
    date: '2025-11-15',
    type: 'absence',
    motif: 'Test 3A.8',
  });
  test('Création absence 2025-2026', '2025-2026', absA.anneeScolaire);
  const absAId = absA.id;

  const absB = await api('POST', '/absences', {
    eleveId: testEleveB,
    classeId: testEleveBclasse,
    date: '2026-11-15',
    type: 'retard',
    motif: 'Test 3A.8 retard',
  });
  test('Création retard 2026-2027', '2026-2027', absB.anneeScolaire);
  const absBId = absB.id;

  // ═══════════════════════════════════════════════════
  // 2. BULK CREATE
  // ═══════════════════════════════════════════════════
  console.log('\n--- 2. CRÉATION EN MASSE ---');
  const bulkResult = await api('POST', '/absences/bulk', {
    classeId: testEleveAclasse,
    date: '2025-11-20',
    type: 'absence',
    eleveIds: [testEleveA],
    motif: 'Test bulk 3A.8',
  });
  test('Bulk create count', '1', bulkResult.count);

  // ═══════════════════════════════════════════════════
  // 3. FILTRAGE PAR ANNÉE — 2025-2026
  // ═══════════════════════════════════════════════════
  console.log('\n--- 3. FILTRAGE 2025-2026 ---');
  const list2025 = await api('GET', `/absences?anneeScolaire=2025-2026&limit=100`);
  const hasA2025 = list2025.absences.some(a => a.id === absAId);
  test('Absence A visible in 2025', 'true', hasA2025 ? 'true' : 'false');
  const hasB2025 = list2025.absences.some(a => a.id === absBId);
  test('Absence B NOT in 2025', 'false', hasB2025 ? 'true' : 'false');

  // ═══════════════════════════════════════════════════
  // 4. FILTRAGE PAR ANNÉE — 2026-2027
  // ═══════════════════════════════════════════════════
  console.log('\n--- 4. FILTRAGE 2026-2027 ---');
  const list2026 = await api('GET', `/absences?anneeScolaire=2026-2027&limit=100`);
  const hasB2026 = list2026.absences.some(a => a.id === absBId);
  test('Absence B visible in 2026', 'true', hasB2026 ? 'true' : 'false');
  const hasA2026 = list2026.absences.some(a => a.id === absAId);
  test('Absence A NOT in 2026', 'false', hasA2026 ? 'true' : 'false');

  // ═══════════════════════════════════════════════════
  // 5. ABSENCES NULL (été) pas récupérées par erreur
  // ═══════════════════════════════════════════════════
  console.log('\n--- 5. ABSENCES NULL (été) ---');
  const nullAbsences = await api('GET', `/absences?anneeScolaire=2025-2026&limit=100`);
  const summerAbs = nullAbsences.absences.filter(a => a.anneeScolaire === null);
  test('No NULL absences in 2025-2026 query', '0', summerAbs.length);

  // ═══════════════════════════════════════════════════
  // 6. STATISTIQUES
  // ═══════════════════════════════════════════════════
  console.log('\n--- 6. STATISTIQUES ---');
  const stats2025 = list2025.stats;
  test('Stats 2025 totalAbsences >= 0', 'true', stats2025.totalAbsences >= 0 ? 'true' : 'false');
  const stats2026 = list2026.stats;
  test('Stats 2026 totalAbsences >= 0', 'true', stats2026.totalAbsences >= 0 ? 'true' : 'false');

  // ═══════════════════════════════════════════════════
  // 7. MODIFICATION ABSENCE
  // ═══════════════════════════════════════════════════
  console.log('\n--- 7. MODIFICATION ---');
  const updated = await api('PUT', `/absences/${absAId}`, { motif: 'Modifié 3A.8', justifie: true, statutJustificatif: 'justifie' });
  test('Update motif', 'Modifié 3A.8', updated.motif);
  test('Update justifie', 'true', updated.justifie ? 'true' : 'false');

  // ═══════════════════════════════════════════════════
  // 8. GET BY ID
  // ═══════════════════════════════════════════════════
  console.log('\n--- 8. GET BY ID ---');
  const one = await api('GET', `/absences/${absAId}`);
  test('Get absence by ID', absAId, one.id);
  test('Year preserved on GET', '2025-2026', one.anneeScolaire);

  // ═══════════════════════════════════════════════════
  // 9. DASHBOARD
  // ═══════════════════════════════════════════════════
  console.log('\n--- 9. DASHBOARD ---');
  const dash2025 = await api('GET', '/statistiques/dashboard?anneeScolaire=2025-2026');
  const dash2026 = await api('GET', '/statistiques/dashboard?anneeScolaire=2026-2027');
  test('Dashboard 2025 nbEleves', 'true', dash2025.nbEleves >= 0 ? 'true' : 'false');
  test('Dashboard 2026 nbEleves', 'true', dash2026.nbEleves >= 0 ? 'true' : 'false');
  test('Dashboard year different', 'true', dash2025.nbEleves !== dash2026.nbEleves ? 'true' : 'false');

  // ═══════════════════════════════════════════════════
  // 10. EXPORT
  // ═══════════════════════════════════════════════════
  console.log('\n--- 10. EXPORT ---');
  try {
    const exportRes = await fetch(`${BASE}/absences/export?anneeScolaire=2025-2026`, {
      headers: { Authorization: `Bearer ${TOKEN_SCHOOL}` },
      signal: AbortSignal.timeout(15000),
    });
    test('Export 2025 status', '200', exportRes.status);
  } catch (e) {
    test('Export 2025', '200', 'ERROR: ' + e.message);
  }

  // ═══════════════════════════════════════════════════
  // 11. RAPPORTS ASSIDUITE
  // ═══════════════════════════════════════════════════
  console.log('\n--- 11. RAPPORTS ASSIDUITÉ ---');
  try {
    const rap2025 = await api('GET', '/rapports/assiduite?anneeScolaire=2025-2026');
    test('Rapports 2025 has rows', 'true', rap2025.rows ? 'true' : 'false');
    const rap2026 = await api('GET', '/rapports/assiduite?anneeScolaire=2026-2027');
    test('Rapports 2026 has rows', 'true', rap2026.rows ? 'true' : 'false');
  } catch (e) {
    test('Rapports', 'OK', 'ERROR: ' + e.message);
  }

  // ═══════════════════════════════════════════════════
  // 12. SUPPRESSION
  // ═══════════════════════════════════════════════════
  console.log('\n--- 12. SUPPRESSION ---');
  await api('DELETE', `/absences/${absAId}`);
  const deleted = await api('GET', `/absences/${absAId}`);
  test('Absence A deleted', 'null', deleted?.id || 'null');
  await api('DELETE', `/absences/${absBId}`);

  // ═══════════════════════════════════════════════════
  // RAPPORT FINAL
  // ═══════════════════════════════════════════════════
  console.log('\n\n=== RAPPORT FINAL 3A.8 ===\n');
  console.log('TEST | ATTENDU | OBTENU | RESULTAT');
  console.log('-----|---------|--------|----------');
  for (const r of results) {
    const name = r.name.substring(0, 45).padEnd(45);
    const expected = r.expected.substring(0, 12).padEnd(12);
    const obtained = r.obtained.substring(0, 20).padEnd(20);
    console.log(`${name} | ${expected} | ${obtained} | ${r.status}`);
  }
  console.log(`\nPASS: ${pass} | FAIL: ${fail} | TOTAL: ${pass + fail}`);
  if (fail > 0) {
    console.log('\n⚠️ FAILURES:');
    for (const r of results.filter(r => r.status === 'FAIL')) {
      console.log(`  ${r.name}: expected=${r.expected} obtained=${r.obtained}`);
    }
  } else {
    console.log('\n✅ ALL TESTS PASSED');
  }
}

main().catch(e => {
  console.error('FATAL ERROR:', e.message);
  process.exit(1);
});
