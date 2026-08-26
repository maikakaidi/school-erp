import { useState, useEffect } from 'react';
import { Settings, Save, X } from 'lucide-react';
import { fetchWithAuth } from '../api/fetchWithAuth';
import { useAcademicYear } from '../context/AcademicYearContext';

const T = {
  card: '#0c1c2c', border: '#1a3050', accent: '#d4921a',
  green: '#1d9468', red: '#b83838', text: '#ddd0b8', muted: '#486070', bg: '#06101a',
};

const NIVEAUX = [
  { label: '6ème', key: '6eme', type: 'college' },
  { label: '5ème', key: '5eme', type: 'college' },
  { label: '4ème', key: '4eme', type: 'college' },
  { label: '3ème', key: '3eme', type: 'college' },
  { label: '2nde A', key: '2nde_a', type: 'lycee' },
  { label: '2nde C', key: '2nde_c', type: 'lycee' },
  { label: '1ère A', key: '1ere_a', type: 'lycee' },
  { label: '1ère C', key: '1ere_c', type: 'lycee' },
  { label: '1ère D', key: '1ere_d', type: 'lycee' },
  { label: 'Tle A', key: 'tle_a', type: 'lycee' },
  { label: 'Tle C', key: 'tle_c', type: 'lycee' },
  { label: 'Tle D', key: 'tle_d', type: 'lycee' },
];

export default function MatieresConfig() {
  const { currentYear } = useAcademicYear();
  const [classes, setClasses] = useState([]);
  const [matieres, setMatieres] = useState([]);
  const [coeffs, setCoeffs] = useState({});
  const [activeTab, setActiveTab] = useState('6eme');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!currentYear) return;
    Promise.all([
      fetchWithAuth(`/classes?anneeScolaire=${currentYear}&limit=100`),
      fetchWithAuth('/matieres'),
      fetchWithAuth(`/coefficients?anneeScolaire=${currentYear}`)
    ]).then(([c, m, co]) => {
      setClasses(c.classes || []);
      setMatieres((m || []).filter(mat => mat.isActive !== false));
      const map = {};
      (co || []).forEach(coeff => { map[`${coeff.classeId}_${coeff.matiereId}`] = coeff.coefficient; });
      setCoeffs(map);
    }).catch(console.error).finally(() => setLoading(false));
  }, [currentYear]);

  const getClassesForTab = (niveau) => {
    return classes.filter(c => {
      const n = c.niveau;
      if (niveau.type === 'college') return n === niveau.key.replace('eme', 'eme').replace('eme', 'eme');
      const nomLower = c.nom.toLowerCase();
      if (niveau.key === '2nde_a') return nomLower.includes('2nde') && !nomLower.includes('2nde c');
      if (niveau.key === '2nde_c') return nomLower.includes('2nde c');
      if (niveau.key === '1ere_a') return nomLower.includes('1ere') && !nomLower.includes('1ere c') && !nomLower.includes('1ere d');
      if (niveau.key === '1ere_c') return nomLower.includes('1ere c');
      if (niveau.key === '1ere_d') return nomLower.includes('1ere d');
      if (niveau.key === 'tle_a') return (nomLower.includes('terminale') || nomLower.includes('tle')) && !nomLower.includes('terminale c') && !nomLower.includes('terminale d') && !nomLower.includes('tle c') && !nomLower.includes('tle d');
      if (niveau.key === 'tle_c') return (nomLower.includes('terminale c') || nomLower.includes('tle c'));
      if (niveau.key === 'tle_d') return (nomLower.includes('terminale d') || nomLower.includes('tle d'));
      return false;
    });
  };

  const updateCoeff = (classeId, matiereId, value) => {
    setCoeffs(prev => ({ ...prev, [`${classeId}_${matiereId}`]: value }));
  };

  const saveCoeffs = async () => {
    setSaving(true);
    const tab = NIVEAUX.find(n => n.key === activeTab);
    const tabClasses = getClassesForTab(tab);
    let saved = 0;

    for (const classe of tabClasses) {
      for (const m of matieres) {
        const key = `${classe.id}_${m.id}`;
        const val = parseInt(coeffs[key]);
        if (val && val > 0) {
          try {
            await fetchWithAuth('/coefficients', {
              method: 'POST',
              body: JSON.stringify({ classeId: classe.id, matiereId: m.id, coefficient: val, anneeScolaire: currentYear })
            });
            saved++;
          } catch (err) { console.error(err); }
        }
      }
    }
    setSaving(false);
    alert(`${saved} coefficients sauvegardés`);
  };

  const tab = NIVEAUX.find(n => n.key === activeTab);
  const tabClasses = tab ? getClassesForTab(tab) : [];

  if (loading) return <div style={{ color: T.text, padding: 20 }}>Chargement...</div>;

  return (
    <div className="fade-up">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 24, color: T.text }}>Configuration des Matières</h1>
          <p style={{ color: T.muted, fontSize: 13 }}>Cliquez sur une cellule pour modifier le coefficient</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: T.muted, padding: '6px 12px' }}>{currentYear}</span>
          <button onClick={saveCoeffs} disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, background: T.green, border: 'none', color: '#fff', cursor: 'pointer', opacity: saving ? 0.5 : 1 }}>
            <Save size={14} /> {saving ? 'Sauvegarde...' : 'Sauvegarder'}
          </button>
        </div>
      </div>

      {/* Onglets */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, flexWrap: 'wrap' }}>
        {NIVEAUX.map(n => (
          <button key={n.key} onClick={() => setActiveTab(n.key)} style={{
            padding: '8px 14px', borderRadius: 8, border: `1px solid ${activeTab === n.key ? T.accent : T.border}`,
            background: activeTab === n.key ? T.accent + '20' : 'transparent',
            color: activeTab === n.key ? T.accent : T.muted, cursor: 'pointer', fontSize: 13, fontWeight: activeTab === n.key ? 700 : 400,
          }}>
            {n.label}
          </button>
        ))}
      </div>

      {/* Matrice */}
      {tabClasses.length === 0 ? (
        <div style={{ padding: 40, textAlign: 'center', color: T.muted, background: T.card, borderRadius: 14 }}>
          Aucune classe trouvée pour {tab?.label}
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', background: T.card, borderRadius: 14 }}>
            <thead>
              <tr style={{ background: '#0a1624' }}>
                <th style={{ padding: '12px', textAlign: 'left', minWidth: 140 }}>Classe</th>
                {matieres.map(m => (
                  <th key={m.id} style={{ padding: '8px', textAlign: 'center', fontSize: 11, minWidth: 80 }}>{m.libelle}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tabClasses.map(classe => (
                <tr key={classe.id} style={{ borderBottom: `1px solid ${T.border}` }}>
                  <td style={{ padding: '12px', fontWeight: 'bold', color: T.accent, whiteSpace: 'nowrap' }}>{classe.nom}</td>
                  {matieres.map(m => {
                    const key = `${classe.id}_${m.id}`;
                    const val = coeffs[key] || '';
                    return (
                      <td key={m.id} style={{ padding: '4px', textAlign: 'center' }}>
                        <input
                          type="number"
                          min="0"
                          max="20"
                          value={val}
                          onChange={e => updateCoeff(classe.id, m.id, e.target.value)}
                          style={{ width: 50, background: T.bg, border: `1px solid ${T.border}`, borderRadius: 4, padding: '4px', textAlign: 'center', color: T.text, fontSize: 12 }}
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
