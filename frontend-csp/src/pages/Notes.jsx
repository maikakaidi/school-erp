import { useState, useEffect } from 'react';
import { fetchWithAuth } from '../api/fetchWithAuth';
import { Save, Download } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { downloadExcel } from '../api/downloadExcel';
import { useAcademicYear } from '../context/AcademicYearContext';

const T = {
  card: '#0c1c2c', border: '#1a3050', accent: '#d4921a',
  green: '#1d9468', red: '#b83838', blue: '#2878c8',
  text: '#ddd0b8', muted: '#486070', bg: '#06101a',
};

export default function Notes() {
  const { t } = useTranslation();
  const { years, currentYear } = useAcademicYear();
  const [classes, setClasses] = useState([]);
  const [matieres, setMatieres] = useState([]);
  const [classeId, setClasseId] = useState('');
  const [matiereId, setMatiereId] = useState('');
  const [semestre, setSemestre] = useState(1);
  const [eleves, setEleves] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    Promise.all([
      fetchWithAuth('/classes?limit=100'),
      fetchWithAuth('/matieres')
    ]).then(([classesData, matieresData]) => {
      setClasses(classesData.classes || []);
      setMatieres(matieresData || []);
    }).catch(console.error);
  }, []);

  const loadEleves = async () => {
    if (!classeId || !matiereId) return;
    setLoading(true);
    try {
      const data = await fetchWithAuth(`/notes/classe?classeId=${classeId}&matiereId=${matiereId}&semestre=${semestre}&anneeScolaire=${currentYear}`);
      setEleves(data);
    } catch (err) {
      console.error(err);
      setMessage(t('notes.loadError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (classeId && matiereId) loadEleves();
    else setEleves([]);
  }, [classeId, matiereId, semestre, currentYear]);

  const handleNoteChange = (eleveId, field, value) => {
    setEleves(prev => prev.map(e => {
      if (e.id === eleveId) {
        const note = e.notes?.[0] || {};
        return {
          ...e,
          notes: [{ ...note, [field]: value }],
        };
      }
      return e;
    }));
  };

  const saveNotes = async (eleveId, devoir, composition, appreciation) => {
    setSaving(true);
    try {
      const payload = {
        eleveId,
        matiereId,
        classeId,
        semestre,
        anneeScolaire: currentYear,
        devoir: devoir !== '' && devoir !== null && devoir !== undefined ? parseFloat(devoir) : null,
        composition: composition !== '' && composition !== null && composition !== undefined ? parseFloat(composition) : null,
        appreciation: appreciation || '',
      };
      if (import.meta.env.DEV) console.log('PAYLOAD NOTES', payload);
      const result = await fetchWithAuth('/notes', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      if (result?._pending) {
        setMessage('Note enregistrée (en attente de sync)');
        setTimeout(() => setMessage(''), 3000);
        setSaving(false);
        return;
      }
      setMessage(t('notes.saved'));
      setTimeout(() => setMessage(''), 2000);
      loadEleves();
    } catch (err) {
      console.error(err);
      setMessage(t('notes.saveError'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fade-up">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 24, color: T.text }}>{t('notes.title')}</h1>
          <p style={{ color: T.muted }}>{t('notes.subtitle')}</p>
        </div>
        {classeId && (
          <button onClick={() => downloadExcel(`/notes/export?classeId=${classeId}&semestre=${semestre}&anneeScolaire=${currentYear}`, 'notes.xlsx')} style={{ display: 'flex', alignItems: 'center', gap: 6, background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 14px', color: T.muted, cursor: 'pointer', fontSize: 12 }}>
            <Download size={14} /> Excel
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 24, background: T.card, padding: 20, borderRadius: 14 }}>
        <div>
          <label style={{ fontSize: 11, color: T.muted }}>{t('notes.classe')}</label>
          <select value={classeId} onChange={e => setClasseId(e.target.value)} style={{ width: '100%', background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, padding: 8, color: T.text }}>
            <option value="">{t('notes.selectClasse')}</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize: 11, color: T.muted }}>{t('notes.matiere')}</label>
          <select value={matiereId} onChange={e => setMatiereId(e.target.value)} style={{ width: '100%', background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, padding: 8, color: T.text }}>
            <option value="">{t('notes.selectMatiere')}</option>
            {matieres.map(m => <option key={m.id} value={m.id}>{m.libelle}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize: 11, color: T.muted }}>{t('notes.semestre')}</label>
          <select value={semestre} onChange={e => setSemestre(parseInt(e.target.value))} style={{ width: '100%', background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, padding: 8, color: T.text }}>
            <option value={1}>{t('notes.semestre1')}</option><option value={2}>{t('notes.semestre2')}</option>
          </select>
        </div>
      </div>

      {message && <div style={{ background: T.green + '20', padding: 8, borderRadius: 8, marginBottom: 16, color: T.green }}>{message}</div>}

      {classeId && matiereId && (
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, overflow: 'auto' }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: T.muted }}>{t('common.loading')}</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#0a1624' }}>
                  <th style={{ padding: 12, textAlign: 'left' }}>{t('notes.headers.eleve')}</th>
                  <th style={{ padding: 12, textAlign: 'center' }}>{t('notes.headers.devoir')}</th>
                  <th style={{ padding: 12, textAlign: 'center' }}>{t('notes.headers.composition')}</th>
                  <th style={{ padding: 12, textAlign: 'center' }}>{t('notes.headers.moyenne')}</th>
                  <th style={{ padding: 12, textAlign: 'center' }}>{t('notes.headers.appreciation')}</th>
                  <th style={{ padding: 12, textAlign: 'center' }}>{t('notes.headers.action')}</th>
                </tr>
              </thead>
              <tbody>
                {eleves.length === 0 ? (
                  <tr><td colSpan="6" style={{ padding: 40, textAlign: 'center', color: T.muted }}>{t('notes.noEleveInClass')}</td></tr>
                ) : (
                  eleves.map(eleve => {
                    const note = eleve.notes?.[0] || {};
                    const moyenne = note.moyenne ? note.moyenne.toFixed(2) : '—';
                    return (
                      <tr key={eleve.id} style={{ borderBottom: `1px solid ${T.border}30` }}>
                        <td style={{ padding: 12, color: T.text }}>{eleve.nom} {eleve.prenom}</td>
                        <td style={{ padding: 12, textAlign: 'center' }}>
                          <input type="number" step="0.25" value={note.devoir1 || ''} onChange={e => handleNoteChange(eleve.id, 'devoir1', e.target.value)} style={{ width: 80, background: T.bg, border: `1px solid ${T.border}`, borderRadius: 6, padding: 6, color: T.text, textAlign: 'center' }} />
                        </td>
                        <td style={{ padding: 12, textAlign: 'center' }}>
                          <input type="number" step="0.25" value={note.composition || ''} onChange={e => handleNoteChange(eleve.id, 'composition', e.target.value)} style={{ width: 80, background: T.bg, border: `1px solid ${T.border}`, borderRadius: 6, padding: 6, color: T.text, textAlign: 'center' }} />
                        </td>
                        <td style={{ padding: 12, textAlign: 'center', color: T.accent }}>{moyenne}</td>
                        <td style={{ padding: 12, textAlign: 'center' }}>
                          <input type="text" value={note.appreciation || ''} onChange={e => handleNoteChange(eleve.id, 'appreciation', e.target.value)} style={{ width: 120, background: T.bg, border: `1px solid ${T.border}`, borderRadius: 6, padding: 6, color: T.text }} />
                        </td>
                        <td style={{ padding: 12, textAlign: 'center' }}>
                          <button onClick={() => saveNotes(eleve.id, note.devoir1, note.composition, note.appreciation)} disabled={saving} style={{ background: T.accent, border: 'none', borderRadius: 6, padding: '6px 12px', color: '#fff', cursor: 'pointer' }}>
                            <Save size={14} /> {t('notes.save')}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
