import { useState, useEffect } from 'react';
import { Save, Edit2, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { fetchWithAuth } from '../api/fetchWithAuth';

const T = {
  card: '#0c1c2c', border: '#1a3050', accent: '#d4921a',
  green: '#1d9468', text: '#ddd0b8', muted: '#486070', bg: '#06101a',
};

export default function Coefficients() {
  const { t } = useTranslation();
  const [classes, setClasses] = useState([]);
  const [matieres, setMatieres] = useState([]);
  const [annee, setAnnee] = useState('2025-2026');
  const [coeffs, setCoeffs] = useState({});
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetchWithAuth('/classes?limit=100'),
      fetchWithAuth('/matieres')
    ]).then(([c, m]) => {
      setClasses(c.classes || []);
      setMatieres(m || []);
    }).catch(console.error);
  }, []);

  useEffect(() => {
    if (classes.length === 0 || matieres.length === 0) return;
    loadCoefficients();
  }, [annee, classes, matieres]);

  const loadCoefficients = async () => {
    setLoading(true);
    try {
      const data = await fetchWithAuth(`/coefficients?anneeScolaire=${annee}`);
      const map = {};
      data.forEach(c => {
        map[`${c.classeId}_${c.matiereId}`] = c.coefficient;
      });
      setCoeffs(map);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleSave = async (classeId, matiereId, coeff) => {
    try {
      await fetchWithAuth('/coefficients', {
        method: 'POST',
        body: JSON.stringify({ classeId, matiereId, coefficient: parseInt(coeff), anneeScolaire: annee })
      });
      setCoeffs(prev => ({ ...prev, [`${classeId}_${matiereId}`]: coeff }));
      setEditing(null);
    } catch (err) { alert(err.message); }
  };

  if (loading) return <div style={{ color: T.text, padding: 20 }}>{t('common.loading')}</div>;

  return (
    <div className="fade-up">
      <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 24, color: T.text }}>{t('coefficients.title')}</h1>
      <p style={{ marginBottom: 20, color: T.muted }}>{t('coefficients.subtitle')}</p>

      <div style={{ marginBottom: 20 }}>
        <label style={{ marginRight: 10, color: T.muted }}>{t('coefficients.anneeScolaire')}</label>
        <select value={annee} onChange={e => setAnnee(e.target.value)} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '6px 12px', color: T.text }}>
          <option>2024-2025</option><option>2025-2026</option><option>2026-2027</option>
        </select>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', background: T.card, borderRadius: 14 }}>
          <thead>
            <tr style={{ background: '#0a1624' }}>
              <th style={{ padding: '12px', textAlign: 'left' }}>{t('coefficients.classeMatiere')}</th>
              {matieres.map(m => <th key={m.id} style={{ padding: '8px', textAlign: 'center', fontSize: 12 }}>{m.libelle}</th>)}
            </tr>
          </thead>
          <tbody>
            {classes.map(classe => (
              <tr key={classe.id} style={{ borderBottom: `1px solid ${T.border}` }}>
                <td style={{ padding: '12px', fontWeight: 'bold', color: T.accent }}>{classe.nom}</td>
                {matieres.map(m => {
                  const key = `${classe.id}_${m.id}`;
                  const coeff = coeffs[key] || '';
                  const isEditing = editing === key;
                  return (
                    <td key={m.id} style={{ padding: '8px', textAlign: 'center' }}>
                      {isEditing ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <input type="number" defaultValue={coeff} onBlur={e => handleSave(classe.id, m.id, e.target.value)} autoFocus style={{ width: 50, background: T.bg, border: `1px solid ${T.border}`, borderRadius: 4, padding: '4px', textAlign: 'center', color: T.text }} />
                          <button onClick={() => setEditing(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.muted }}><X size={14} /></button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                          <span>{coeff || '—'}</span>
                          <button onClick={() => setEditing(key)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.accent }}><Edit2 size={12} /></button>
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}