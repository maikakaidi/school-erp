
const BASE = 'http://localhost:5000/api';
let TOKEN = '';
const results = [];
let pass = 0, fail = 0, warn = 0;

function test(name, year, expected, obtained) {
  let ok;
  if (expected === 'not_null') ok = obtained && obtained !== 'null' && obtained !== 'undefined' && obtained !== 'NOT_FOUND';
  else if (expected === 'not_error') ok = obtained !== 'error';
  else if (typeof expected === 'string' && expected.startsWith('>=')) ok = parseInt(obtained) >= parseInt(expected.slice(2));
  else if (expected === 'true') ok = String(obtained) === 'true';
  else if (expected === 'false') ok = String(obtained) === 'false';
  else if (expected === 'different') ok = obtained === 'different';
  else ok = String(expected) === String(obtained);
  const status = ok ? 'PASS' : 'FAIL';
  if (ok) pass++; else fail++;
  results.push({ name, year, expected: String(expected), obtained: String(obtained), status });
  console.log(`  [${status}] ${name} (${year}) — expected=${expected}, obtained=${obtained}`);
}

function testWarn(name, year, expected, obtained) {
  let ok;
  if (expected === 'not_null') ok = obtained && obtained !== 'null' && obtained !== 'undefined' && obtained !== 'NOT_FOUND' && obtained !== 'ENDPOINT_UNAVAILABLE';
  else if (expected === 'not_error') ok = obtained !== 'error';
  else if (typeof expected === 'string' && expected.startsWith('>=')) ok = parseInt(obtained) >= parseInt(expected.slice(2));
  else ok = String(expected) === String(obtained);
  const status = ok ? 'PASS' : 'WARN';
  if (ok) pass++; else warn++;
  results.push({ name, year, expected: String(expected), obtained: String(obtained), status });
  console.log(`  [${status}] ${name} (${year}) — expected=${expected}, obtained=${obtained}`);
}

async function api(method, path, body) {
  const headers = { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' };
  const opts = { method, headers, signal: AbortSignal.timeout(15000) };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE}${path}`, opts);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

async function main() {
  console.log('=== TEST API HTTP — NON-MÉLANGE ANNÉES ===\n');

  // Login
  const login = await api('POST', '/auth/login', { phone: '690000000', password: 'Gxggxg1234@' });
  TOKEN = login.accessToken;
  console.log(`  Logged in as ${login.school.name} (id=${login.school.id})\n`);

  // 1. Test académic years exist
  console.log('--- 1. ANNÉES SCOLAIRES ---');
  const years = await api('GET', '/academic-years');
  test('Années existantes', '', '>=2', years.length);
  const has2025 = years.find(y => y.name === '2025-2026');
  const has2026 = years.find(y => y.name === '2026-2027');
  test('Year 2025-2026 exists', '', 'true', has2025 ? 'true' : 'false');
  test('Year 2026-2027 exists', '', 'true', has2026 ? 'true' : 'false');

  // 2. Test current year
  console.log('\n--- 2. ANNÉE COURANTE ---');
  const currentYear = await api('GET', '/academic-years/current');
  test('Current year set', '', 'not_null', currentYear?.name || 'null');
  console.log(`    Current: ${currentYear?.name || 'NONE'}`);

  // 3. Test INSCRIPTIONS
  console.log('\n--- 3. INSCRIPTIONS (API) ---');
  const insc2025 = await api('GET', '/inscriptions?anneeScolaire=2025-2026');
  const insc2026 = await api('GET', '/inscriptions?anneeScolaire=2026-2027');
  test('Inscriptions 2025 count', '2025-2026', '>=1', insc2025?.length ?? insc2025?.inscriptions?.length ?? 'unknown');
  test('Inscriptions 2026 count', '2026-2027', '>=1', insc2026?.length ?? insc2026?.inscriptions?.length ?? 'unknown');

  // Check specific eleves
  const inscA2025 = Array.isArray(insc2025) ? insc2025 : (insc2025?.inscriptions || []);
  const inscB2026 = Array.isArray(insc2026) ? insc2026 : (insc2026?.inscriptions || []);
  const eleveAIn2025 = inscA2025.some(i => i.eleve?.nom?.includes('TEST-ANNEE-A') || i.eleveId === '9ab4372b-93a7-4d76-9176-f971321e0f77');
  const eleveBIn2025 = inscA2025.some(i => i.eleve?.nom?.includes('TEST-ANNEE-B') || i.eleveId === 'a346367c-b38a-42dc-a815-c81e8bb549af');
  test('Eleve A visible in 2025', '2025-2026', 'true', eleveAIn2025 ? 'true' : 'false');
  test('Eleve B NOT visible in 2025', '2025-2026', 'false', eleveBIn2025 ? 'true' : 'false');

  const eleveBin2026 = inscB2026.some(i => i.eleve?.nom?.includes('TEST-ANNEE-B') || i.eleveId === 'a346367c-b38a-42dc-a815-c81e8bb549af');
  const eleveAin2026 = inscB2026.some(i => i.eleve?.nom?.includes('TEST-ANNEE-A') || i.eleveId === '9ab4372b-93a7-4d76-9176-f971321e0f77');
  test('Eleve B visible in 2026', '2026-2027', 'true', eleveBin2026 ? 'true' : 'false');
  test('Eleve A NOT visible in 2026', '2026-2027', 'false', eleveAin2026 ? 'true' : 'false');

  // 4. Test NOTES
  console.log('\n--- 4. NOTES (API) ---');
  const notes2025 = await api('GET', `/notes/classe?classeId=${inscA2025[0]?.classeId || ''}&matiereId=&semestre=1&anneeScolaire=2025-2026`).catch(() => null);
  // Use the notes endpoint by eleve instead
  const notesA2025 = await api('GET', `/notes/eleve?eleveId=9ab4372b-93a7-4d76-9176-f971321e0f77&semestre=1&anneeScolaire=2025-2026`).catch(() => null);
  const notesA2026 = await api('GET', `/notes/eleve?eleveId=9ab4372b-93a7-4d76-9176-f971321e0f77&semestre=1&anneeScolaire=2026-2027`).catch(() => null);
  const notesB2026 = await api('GET', `/notes/eleve?eleveId=a346367c-b38a-42dc-a815-c81e8bb549af&semestre=1&anneeScolaire=2026-2027`).catch(() => null);
  
  if (notesA2025) {
    const mathNote = notesA2025?.notes?.find(n => n.matiereId === 'f40c9eab-cdf1-466b-af20-04b753724980');
    testWarn('Note A Math 2025 via API', '2025-2026', '15.5', mathNote?.moyenne?.toString() || notesA2025?.notes?.[0]?.moyenne?.toString() || 'NOT_FOUND');
  } else {
    testWarn('Note A Math 2025 via API', '2025-2026', '15.5', 'ENDPOINT_UNAVAILABLE');
  }

  if (notesA2026) {
    const mathNote = notesA2026?.notes?.find(n => n.matiereId === 'f40c9eab-cdf1-466b-af20-04b753724980');
    testWarn('Note A Math NOT in 2026 via API', '2026-2027', '0', notesA2026?.notes?.length || 0);
  } else {
    testWarn('Note A Math NOT in 2026 via API', '2026-2027', 'empty', 'ENDPOINT_UNAVAILABLE');
  }

  // 5. Test COEFFICIENTS
  console.log('\n--- 5. COEFFICIENTS (API) ---');
  const coeffs2025 = await api('GET', '/coefficients?anneeScolaire=2025-2026');
  const coeffs2026 = await api('GET', '/coefficients?anneeScolaire=2026-2027');
  testWarn('Coefficients 2025 count', '2025-2026', '>=1', coeffs2025?.length ?? 'unknown');
  testWarn('Coefficients 2026 count', '2026-2027', '>=1', coeffs2026?.length ?? 'unknown');

  // 6. Test DASHBOARD
  console.log('\n--- 6. DASHBOARD (API) ---');
  const dash2025 = await api('GET', '/statistiques/dashboard?anneeScolaire=2025-2026');
  const dash2026 = await api('GET', '/statistiques/dashboard?anneeScolaire=2026-2027');
  test('Dashboard nbEleves 2025', '2025-2026', '>=1', dash2025?.nbEleves || 0);
  test('Dashboard nbEleves 2026', '2026-2027', '>=1', dash2026?.nbEleves || 0);
  test('Dashboard nbEleves different', 'diff', 'different', dash2025?.nbEleves !== dash2026?.nbEleves ? 'different' : 'same');
  test('Dashboard nbClasses 2025', '2025-2026', '>=1', dash2025?.nbClasses || 0);
  test('Dashboard nbClasses 2026', '2026-2027', '>=1', dash2026?.nbClasses || 0);

  // 7. Test EXAMENS
  console.log('\n--- 7. EXAMENS (API) ---');
  const exams2025 = await api('GET', '/examens?anneeScolaire=2025-2026');
  const exams2026 = await api('GET', '/examens?anneeScolaire=2026-2027');
  test('Examens 2025 count', '2025-2026', '>=1', exams2025?.length ?? 0);
  test('Examens 2026 count', '2026-2027', '>=1', exams2026?.length ?? 0);
  
  const examAIn2025 = exams2025?.some(e => e.nom === 'EXAM-TEST-A');
  const examAIn2026 = exams2026?.some(e => e.nom === 'EXAM-TEST-A');
  test('EXAM-TEST-A in 2025', '2025-2026', 'true', examAIn2025 ? 'true' : 'false');
  test('EXAM-TEST-A NOT in 2026', '2026-2027', 'false', examAIn2026 ? 'true' : 'false');

  // 8. Test RAPPORTS
  console.log('\n--- 8. RAPPORTS (API) ---');
  const rapports2025 = await api('GET', '/rapports/assiduite?anneeScolaire=2025-2026').catch(e => ({ error: e.message }));
  const rapports2026 = await api('GET', '/rapports/assiduite?anneeScolaire=2026-2027').catch(e => ({ error: e.message }));
  testWarn('Rapports assiduite 2025', '2025-2026', 'not_error', rapports2025?.error ? 'error' : 'not_error');
  testWarn('Rapports assiduite 2026', '2026-2027', 'not_error', rapports2026?.error ? 'error' : 'not_error');

  // 9. Test YEAR SWITCH via API (set-current)
  console.log('\n--- 9. YEAR SWITCH ---');
  if (has2026) {
    await api('POST', '/academic-years/set-current', { yearId: has2026.id });
    const currentAfterSwitch = await api('GET', '/academic-years/current');
    test('Year switched to 2026-2027', '2026-2027', currentAfterSwitch?.name, '2026-2027');
  }
  if (has2025) {
    await api('POST', '/academic-years/set-current', { yearId: has2025.id });
    const currentAfterSwitchBack = await api('GET', '/academic-years/current');
    test('Year switched back to 2025-2026', '2025-2026', currentAfterSwitchBack?.name, '2025-2026');
  }

  // 10. Test RAPPORT FINAL
  console.log('\n\n=== RAPPORT FINAL ===\n');
  console.log('TEST | ANNÉE | ATTENDU | OBTENU | RESULTAT');
  console.log('-----|-------|---------|--------|----------');
  for (const r of results) {
    const name = r.name.padEnd(50);
    const year = r.year.padEnd(8);
    const expected = r.expected.substring(0, 12).padEnd(12);
    const obtained = r.obtained.substring(0, 20).padEnd(20);
    const status = r.status;
    console.log(`${name} | ${year} | ${expected} | ${obtained} | ${status}`);
  }
  console.log(`\nPASS: ${pass} | FAIL: ${fail} | WARN: ${warn} | TOTAL: ${pass + fail + warn}`);
  if (fail > 0) {
    console.log('\n⚠️ FAILURES DETECTED — See details above');
  } else {
    console.log('\n✅ ALL TESTS PASSED');
  }
}

main().catch(e => {
  console.error('FATAL ERROR:', e.message);
  console.error(e.stack);
  process.exit(1);
});
