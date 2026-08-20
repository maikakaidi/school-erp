import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { fetchWithAuth } from '../api/fetchWithAuth';
import { useAcademicYear } from '../context/AcademicYearContext';

const T = {
  card: '#0c1c2c', border: '#1a3050', accent: '#d4921a',
  green: '#1d9468', text: '#ddd0b8', muted: '#486070', bg: '#06101a',
};

export default function FraisScolaires() {
  const { t } = useTranslation();
  const { years, currentYear } = useAcademicYear();
  const [classes, setClasses] = useState([]);
  const [fraisList, setFraisList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [formValues, setFormValues] = useState({});

  useEffect(() => {
    loadClasses();
  }, []);

  useEffect(() => {
    loadFrais();
  }, [currentYear]);

  const loadClasses = async () => {
    try {
      const data = await fetchWithAuth('/classes?limit=100');
      setClasses(data.classes || []);
    } catch (err) {
      console.error('Erreur chargement classes', err);
    }
  };

  const loadFrais = async () => {
    setLoading(true);
    try {
      const data = await fetchWithAuth(`/frais?currentYearScolaire=${currentYear}`);
      setFraisList(data);
      // Initialiser les valeurs du formulaire pour chaque classe
      const initial = {};
      data.forEach(f => {
        initial[f.classeId] = { v1: f.versement1, v2: f.versement2, v3: f.versement3 };
      });
      setFormValues(initial);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getFraisForClass = (classeId) => {
    return fraisList.find(f => f.classeId === classeId);
  };

  const handleEdit = (classeId, existing) => {
    setEditing(classeId);
    setFormValues(prev => ({
      ...prev,
      [classeId]: existing ? { v1: existing.versement1, v2: existing.versement2, v3: existing.versement3 } : { v1: 0, v2: 0, v3: 0 }
    }));
  };

  const handleChange = (classeId, field, value) => {
    setFormValues(prev => ({
      ...prev,
      [classeId]: { ...prev[classeId], [field]: value }
    }));
  };

  const handleSave = async (classeId) => {
    const values = formValues[classeId];
    if (!values) return;
    try {
      await fetchWithAuth('/frais', {
        method: 'POST',
        body: JSON.stringify({
          classeId,
          currentYearScolaire: currentYear,
          versement1: parseFloat(values.v1) || 0,
          versement2: parseFloat(values.v2) || 0,
          versement3: parseFloat(values.v3) || 0,
        }),
      });
      setEditing(null);
      loadFrais();
    } catch (err) {
      alert('Erreur : ' + err.message);
    }
  };

  return (
    <div className="fade-up">
      <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 24, color: T.text }}>{t('frais.title')}</h1>
      <p style={{ marginBottom: 20, color: T.muted }}>{t('frais.subtitle')} — {currentYear}</p>

      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: T.muted }}>{t('common.loading')}</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#0a1624' }}>
                <th style={{ padding: '12px', textAlign: 'left' }}>{t('frais.classe')}</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>{t('versements.tranche1')} (FCFA)</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>{t('versements.tranche2')} (FCFA)</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>{t('versements.tranche3')} (FCFA)</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>{t('frais.total')}</th>
                <th style={{ padding: '12px' }}>{t('eleves.headers.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {classes.map(classe => {
                const existing = getFraisForClass(classe.id);
                const isEditing = editing === classe.id;
                const values = formValues[classe.id] || { v1: 0, v2: 0, v3: 0 };
                const total = (values.v1 || 0) + (values.v2 || 0) + (values.v3 || 0);
                return (
                  <tr key={classe.id} style={{ borderBottom: `1px solid ${T.border}` }}>
                    <td style={{ padding: '12px', color: T.text }}>{classe.nom}</td>
                    {isEditing ? (
                      <>
                        <td style={{ padding: '12px' }}>
                          <input type="number" value={values.v1} onChange={e => handleChange(classe.id, 'v1', e.target.value)} style={{ width: 100, background: T.bg, border: `1px solid ${T.border}`, borderRadius: 6, padding: '4px', color: T.text }} />
                        </td>
                        <td style={{ padding: '12px' }}>
                          <input type="number" value={values.v2} onChange={e => handleChange(classe.id, 'v2', e.target.value)} style={{ width: 100, background: T.bg, border: `1px solid ${T.border}`, borderRadius: 6, padding: '4px', color: T.text }} />
                        </td>
                        <td style={{ padding: '12px' }}>
                          <input type="number" value={values.v3} onChange={e => handleChange(classe.id, 'v3', e.target.value)} style={{ width: 100, background: T.bg, border: `1px solid ${T.border}`, borderRadius: 6, padding: '4px', color: T.text }} />
                        </td>
                        <td style={{ padding: '12px', color: T.accent }}>{total.toLocaleString()} FCFA</td>
                        <td style={{ textAlign: 'center' }}>
                          <button onClick={() => handleSave(classe.id)} style={{ background: T.green, border: 'none', borderRadius: 6, padding: '4px 12px', color: '#fff', cursor: 'pointer', marginRight: 8 }}>{t('common.save')}</button>
                          <button onClick={() => setEditing(null)} style={{ background: 'transparent', border: `1px solid ${T.border}`, borderRadius: 6, padding: '4px 12px', color: T.muted, cursor: 'pointer' }}>{t('common.cancel')}</button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td style={{ padding: '12px' }}>{existing?.versement1 || '—'}</td>
                        <td style={{ padding: '12px' }}>{existing?.versement2 || '—'}</td>
                        <td style={{ padding: '12px' }}>{existing?.versement3 || '—'}</td>
                        <td style={{ padding: '12px', color: T.accent }}>{existing?.total || '—'} FCFA</td>
                        <td style={{ textAlign: 'center' }}>
                          <button onClick={() => handleEdit(classe.id, existing)} style={{ background: T.accent, border: 'none', borderRadius: 6, padding: '4px 12px', color: '#fff', cursor: 'pointer' }}>{t('common.edit')}</button>
                        </td>
                      </>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}