// src/pages/Inscriptions.jsx
import { useState, useEffect, useCallback } from 'react';
import { Plus, Edit2, Trash2, X, Check, Search } from 'lucide-react';
import { fetchWithAuth } from '../api/fetchWithAuth';
import PendingBadge from '../components/PendingBadge';
import { useTranslation } from 'react-i18next';
import { useAcademicYear } from '../context/AcademicYearContext';

const T = {
  card: '#0c1c2c',
  border: '#1a3050',
  accent: '#d4921a',
  green: '#1d9468',
  red: '#b83838',
  blue: '#2878c8',
  text: '#ddd0b8',
  muted: '#486070',
  bg: '#06101a',
};

const emptyForm = {
  eleveId: '',
  classeId: '',
  anneeScolaire: '',
  type: 'Ordinaire',
  reduction: 0,
};

export default function Inscriptions() {
  const { t } = useTranslation();
  const { years, currentYear } = useAcademicYear();
  const [inscriptions, setInscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [eleves, setEleves] = useState([]);
  const [classes, setClasses] = useState([]);
  const [modal, setModal] = useState(null); // null | 'add' | { id }
  const [form, setForm] = useState({ ...emptyForm, anneeScolaire: currentYear });
  const [searchEleve, setSearchEleve] = useState('');

  // Charger les listes nécessaires
  useEffect(() => {
    const loadData = async () => {
      try {
        const [elevesData, classesData] = await Promise.all([
          fetchWithAuth('/eleves?limit=500'),
          fetchWithAuth('/classes?limit=100'),
        ]);
        setEleves(elevesData.eleves || []);
        setClasses(classesData.classes || []);
      } catch (err) {
        console.error('Erreur chargement données', err);
      }
    };
    loadData();
  }, []);

  // Charger les inscriptions
  const loadInscriptions = async () => {
    setLoading(true);
    try {
      const data = await fetchWithAuth(`/inscriptions?anneeScolaire=${currentYear}`);
      setInscriptions(data || []);
    } catch (err) {
      console.error('Erreur chargement inscriptions', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInscriptions();
  }, [currentYear]);

  useEffect(() => {
    const handler = () => loadInscriptions();
    window.addEventListener('sync-complete', handler);
    return () => window.removeEventListener('sync-complete', handler);
  }, [currentYear]);

  const openAdd = () => {
    setForm(emptyForm);
    setModal('add');
  };

  const openEdit = (insc) => {
    setForm({
      id: insc.id,
      eleveId: insc.eleveId,
      classeId: insc.classeId,
      anneeScolaire: insc.anneeScolaire,
      type: insc.type,
      reduction: insc.reduction || 0,
    });
    setModal({ id: insc.id });
  };

  const closeModal = () => setModal(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const save = async () => {
    if (!form.eleveId || !form.classeId) return;
    try {
      const payload = {
        eleveId: form.eleveId,
        classeId: form.classeId,
        anneeScolaire: form.anneeScolaire,
        type: form.type,
        reduction: parseFloat(form.reduction) || 0,
      };
      let url = '/inscriptions';
      let method = 'POST';
      if (modal !== 'add') {
        url = `/inscriptions/${modal.id}`;
        method = 'PUT';
      }
      const result = await fetchWithAuth(url, { method, body: JSON.stringify(payload) });
      if (result?._pending && modal === 'add') {
        const tempItem = { id: result.tempId, ...payload, _pending: true, dateInscription: new Date().toISOString(), eleve: { nom: '?', prenom: 'Hors ligne' }, classe: { nom: '...' } };
        setInscriptions(prev => [tempItem, ...prev]);
        closeModal();
        return;
      }
      closeModal();
      loadInscriptions();
    } catch (err) {
      console.error('Erreur sauvegarde', err);
      alert('Erreur : ' + err.message);
    }
  };

  const remove = async (id) => {
    if (!confirm(t('inscriptions.deleteConfirm'))) return;
    try {
      await fetchWithAuth(`/inscriptions/${id}`, { method: 'DELETE' });
      loadInscriptions();
    } catch (err) {
      console.error('Erreur suppression', err);
      alert('Erreur : ' + err.message);
    }
  };

  // Filtrage local des élèves pour la recherche
  const filteredEleves = eleves.filter(e =>
    `${e.nom} ${e.prenom}`.toLowerCase().includes(searchEleve.toLowerCase())
  );

  return (
    <div className="fade-up">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: "'Fraunces', serif", fontWeight: 900, fontSize: 24, color: T.text }}>{t('inscriptions.title')}</h1>
          <p style={{ fontSize: 13, color: T.muted, marginTop: 2 }}>{t('inscriptions.subtitle')}</p>
        </div>
        <button onClick={openAdd} style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px',
          background: T.accent, border: 'none', borderRadius: 10, color: '#fff',
          cursor: 'pointer', fontSize: 13, fontWeight: 600,
        }}>
          <Plus size={15} /> {t('inscriptions.newInscription')}
        </button>
      </div>

      {/* Tableau des inscriptions */}
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, overflow: 'auto' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: T.muted }}>{t('common.loading')}</div>
        ) : inscriptions.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: T.muted }}>{t('inscriptions.noInscription')}</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#0a1624' }}>
                {[t('inscriptions.headers.eleve'), t('inscriptions.headers.classe'), t('inscriptions.headers.annee'), t('inscriptions.headers.type'), t('inscriptions.headers.reduction'), t('inscriptions.headers.date'), t('inscriptions.headers.actions')].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '13px 16px', fontSize: 10, color: T.muted, fontWeight: 700, letterSpacing: '0.08em', borderBottom: `1px solid ${T.border}` }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {inscriptions.map((insc, idx) => (
                <tr key={insc.id} style={{ borderBottom: `1px solid ${T.border}20`, background: idx % 2 ? '#0a1624' : 'transparent' }}>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: T.text }}>{insc.eleve?.nom} {insc.eleve?.prenom}</td>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: T.text }}>{insc.classe?.nom}</td>
                  <td style={{ padding: '12px 16px', fontSize: 12, color: T.muted }}>{insc.anneeScolaire}</td>
                  <td style={{ padding: '12px 16px', fontSize: 12, color: T.muted }}>{insc.type}</td>
                  <td style={{ padding: '12px 16px', fontSize: 12, color: T.muted }}>{insc.reduction}%</td>
                  <td style={{ padding: '12px 16px', fontSize: 12, color: T.muted }}>{new Date(insc.dateInscription).toLocaleDateString()}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      {insc._pending && <PendingBadge />}
                      <button onClick={() => openEdit(insc)} style={{ width: 30, height: 30, borderRadius: 7, background: T.accent + '15', border: `1px solid ${T.accent}30`, cursor: 'pointer' }}>
                        <Edit2 size={12} color={T.accent} />
                      </button>
                      <button onClick={() => remove(insc.id)} style={{ width: 30, height: 30, borderRadius: 7, background: T.red + '15', border: `1px solid ${T.red}30`, cursor: 'pointer' }}>
                        <Trash2 size={12} color={T.red} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal Ajout / Édition */}
      {modal && (
        <div
  style={{
    position: 'fixed',
    inset: 0,
    background: '#000000a0',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    zIndex: 200,
    overflowY: 'auto',
    padding: '40px 20px',
  }}
>
          <div
  style={{
    background: '#0c1c2c',
    border: `1px solid ${T.border}`,
    borderRadius: 16,
    padding: 28,
    width: '100%',
    maxWidth: 560,
    marginTop: 20,
    marginBottom: 20,
    maxHeight: 'calc(100vh - 40px)',
    overflowY: 'auto',
  }}
>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
              <h2 style={{ fontFamily: "'Fraunces', serif", fontWeight: 700, fontSize: 17, color: T.text }}>
                {modal === 'add' ? t('inscriptions.newInscription') : t('inscriptions.editInscription')}
              </h2>
              <button onClick={closeModal} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.muted }}><X size={18} /></button>
            </div>

            {/* Élève avec recherche */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 11, color: T.muted }}>{t('inscriptions.eleveLabel')}</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  placeholder={t('inscriptions.searchEleve')}
                  value={searchEleve}
                  onChange={(e) => setSearchEleve(e.target.value)}
                  style={{ width: '100%', background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 12px', color: T.text, marginBottom: 8 }}
                />
                <select
                  name="eleveId"
                  value={form.eleveId}
                  onChange={handleChange}
                  required
                  style={{ width: '100%', background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 12px', color: T.text }}
                >
                  <option value="">{t('inscriptions.selectEleve')}</option>
                  {filteredEleves.map(e => (
                    <option key={e.id} value={e.id}>{e.nom} {e.prenom} ({e.matricule})</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Classe */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 11, color: T.muted }}>{t('inscriptions.classeLabel')}</label>
              <select
                name="classeId"
                value={form.classeId}
                onChange={handleChange}
                required
                style={{ width: '100%', background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 12px', color: T.text }}
              >
                <option value="">{t('inscriptions.selectClasse')}</option>
                {classes.map(c => (
                  <option key={c.id} value={c.id}>{c.nom}</option>
                ))}
              </select>
            </div>

            {/* Année scolaire */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 11, color: T.muted }}>{t('inscriptions.anneeScolaire')}</label>
              <select
                name="anneeScolaire"
                value={form.anneeScolaire}
                onChange={handleChange}
                style={{ width: '100%', background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 12px', color: T.text }}
              >
                {years.map(y => <option key={y.name} value={y.name}>{y.name}</option>)}
              </select>
            </div>

            {/* Type et réduction */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
              <div>
                <label style={{ fontSize: 11, color: T.muted }}>{t('inscriptions.type')}</label>
                <select
                  name="type"
                  value={form.type}
                  onChange={handleChange}
                  style={{ width: '100%', background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 12px', color: T.text }}
                >
                  <option>{t('inscriptions.ordinaire')}</option>
                  <option>{t('inscriptions.redoublant')}</option>
                  <option>{t('inscriptions.transfert')}</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11, color: T.muted }}>{t('inscriptions.reduction')}</label>
                <input
                  type="number"
                  name="reduction"
                  value={form.reduction}
                  onChange={handleChange}
                  step="1"
                  min="0"
                  max="100"
                  style={{ width: '100%', background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 12px', color: T.text }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={closeModal} style={{ padding: '9px 18px', borderRadius: 9, background: 'transparent', border: `1px solid ${T.border}`, color: T.muted, cursor: 'pointer' }}>{t('common.cancel')}</button>
              <button onClick={save} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px', borderRadius: 9, background: T.accent, border: 'none', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>
                <Check size={14} /> {t('common.validate')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}