import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Check, Search, Megaphone } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { fetchWithAuth } from '../api/fetchWithAuth';

const T = {
  card: '#0c1c2c',
  border: '#1a3050',
  accent: '#d4921a',
  green: '#1d9468',
  red: '#b83838',
  blue: '#2878c8',
  purple: '#7848c8',
  text: '#ddd0b8',
  muted: '#486070',
  bg: '#06101a',
};

const emptyForm = {
  titre: '',
  message: '',
  type: 'info',
  cible: 'ecole',
  classeId: '',
  date: new Date().toISOString().slice(0, 10),
};

const typeColors = { info: T.blue, urgence: T.red, evenement: T.purple, resultat: T.green };
const cibleColors = { ecole: T.green, parents: T.purple, classe: T.blue };

export default function Annonces() {
  const { t } = useTranslation();
  const [annonces, setAnnonces] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [cibleFilter, setCibleFilter] = useState('');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const loadAnnonces = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: 1, limit: 100 });
      if (search) params.set('search', search);
      if (cibleFilter) params.set('cible', cibleFilter);
      const data = await fetchWithAuth(`/annonces?${params}`);
      setAnnonces(data.annonces || []);
    } catch (err) {
      console.error('Erreur chargement annonces', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWithAuth('/classes?limit=100')
      .then((d) => setClasses(d.classes || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    loadAnnonces();
  }, [search, cibleFilter]);

  const openAdd = () => {
    setForm(emptyForm);
    setModal('add');
  };

  const openEdit = (a) => {
    setForm({
      titre: a.titre,
      message: a.message,
      type: a.type,
      cible: a.cible,
      classeId: a.classeId || '',
      date: new Date(a.date).toISOString().slice(0, 10),
    });
    setModal({ id: a.id });
  };

  const closeModal = () => setModal(null);

  const save = async () => {
    if (!form.titre || !form.message) return;
    if (form.cible === 'classe' && !form.classeId) {
      alert(t('annonces.selectClasse') + ' *');
      return;
    }
    try {
      const payload = { ...form, classeId: form.cible === 'classe' ? form.classeId : undefined };
      if (modal === 'add') {
        await fetchWithAuth('/annonces', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        await fetchWithAuth(`/annonces/${modal.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }
      closeModal();
      loadAnnonces();
    } catch (err) {
      console.error('Erreur sauvegarde annonce', err);
      alert('Erreur : ' + err.message);
    }
  };

  const remove = async (id) => {
    if (!confirm(t('annonces.deleteConfirm'))) return;
    try {
      await fetchWithAuth(`/annonces/${id}`, { method: 'DELETE' });
      loadAnnonces();
    } catch (err) {
      console.error('Erreur suppression annonce', err);
      alert('Erreur : ' + err.message);
    }
  };

  const toggleActive = async (a) => {
    try {
      await fetchWithAuth(`/annonces/${a.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !a.isActive }),
      });
      loadAnnonces();
    } catch (err) {
      console.error('Erreur bascule annonce', err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="fade-up">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 style={{ fontFamily: "'Fraunces', serif", fontWeight: 900, fontSize: 24, color: T.text }}>{t('annonces.title')}</h1>
          <p style={{ fontSize: 13, color: T.muted, marginTop: 2 }}>{t('annonces.subtitle', { count: annonces.length })}</p>
        </div>
        <button onClick={openAdd} style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px',
          background: T.accent, border: 'none', borderRadius: 10, color: '#fff',
          cursor: 'pointer', fontSize: 13, fontWeight: 600,
        }}>
          <Plus size={15} /> {t('annonces.newAnnonce')}
        </button>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '8px 14px', flex: '2 1 220px' }}>
          <Search size={14} color={T.muted} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t('annonces.searchPlaceholder')}
            style={{ background: 'transparent', border: 'none', outline: 'none', color: T.text, fontSize: 13, width: '100%' }}
          />
        </div>
        <select value={cibleFilter} onChange={e => setCibleFilter(e.target.value)} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '8px 12px', color: T.text, fontSize: 13, outline: 'none', cursor: 'pointer' }}>
          <option value="">{t('annonces.cible')} — {t('common.all') || 'Tous'}</option>
          <option value="ecole">{t('annonces.cibles.ecole')}</option>
          <option value="parents">{t('annonces.cibles.parents')}</option>
          <option value="classe">{t('annonces.cibles.classe')}</option>
        </select>
      </div>

      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: T.muted }}>{t('common.loading')}</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#0a1624' }}>
                {[t('annonces.titre'), t('annonces.type'), t('annonces.cible'), t('annonces.classe'), t('annonces.date'), 'Statut', 'Actions'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '13px 16px', fontSize: 10, color: T.muted, fontWeight: 700, letterSpacing: '0.08em', borderBottom: `1px solid ${T.border}` }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {annonces.length === 0 ? (
                <tr><td colSpan="7" style={{ padding: 40, textAlign: 'center', color: T.muted }}>{t('annonces.noAnnonceFound')}</td></tr>
              ) : (
                annonces.map((a, idx) => {
                  const tc = typeColors[a.type] || T.blue;
                  const cc = cibleColors[a.cible] || T.green;
                  return (
                    <tr key={a.id} style={{ borderBottom: `1px solid ${T.border}20`, background: idx % 2 ? '#0a1624' : 'transparent' }}>
                      <td style={{ padding: '12px 16px', fontSize: 13, color: T.text, fontWeight: 500, maxWidth: 280 }}>
                        {a.titre}
                        <div style={{ fontSize: 11, color: T.muted, fontWeight: 400, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 280 }}>
                          {a.message}
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, background: tc + '20', color: tc, border: `1px solid ${tc}30` }}>
                          {t(`annonces.types.${a.type}`)}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, background: cc + '20', color: cc, border: `1px solid ${cc}30` }}>
                          {t(`annonces.cibles.${a.cible}`)}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 12, color: T.muted }}>{a.classe?.nom || '—'}</td>
                      <td style={{ padding: '12px 16px', fontSize: 12, color: T.muted }}>{new Date(a.date).toLocaleDateString('fr-FR')}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <button onClick={() => toggleActive(a)} style={{
                          fontSize: 11, padding: '3px 10px', borderRadius: 6, cursor: 'pointer',
                          background: a.isActive ? T.green + '20' : T.border,
                          color: a.isActive ? T.green : T.muted,
                          border: `1px solid ${a.isActive ? T.green : T.border}30`,
                        }}>
                          {a.isActive ? 'Actif' : 'Inactif'}
                        </button>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button onClick={() => openEdit(a)} style={{ width: 30, height: 30, borderRadius: 7, background: T.accent + '15', border: `1px solid ${T.accent}30`, cursor: 'pointer' }}>
                            <Edit2 size={12} color={T.accent} />
                          </button>
                          <button onClick={() => remove(a.id)} style={{ width: 30, height: 30, borderRadius: 7, background: T.red + '15', border: `1px solid ${T.red}30`, cursor: 'pointer' }}>
                            <Trash2 size={12} color={T.red} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}
      </div>

      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: '#000000a0', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, overflow: 'auto', padding: 20 }}>
          <div style={{ background: '#0c1c2c', border: `1px solid ${T.border}`, borderRadius: 16, padding: 28, width: 560, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
              <h2 style={{ fontFamily: "'Fraunces', serif", fontWeight: 700, fontSize: 17, color: T.text }}>
                {modal === 'add' ? t('annonces.newAnnonce') : t('annonces.editAnnonce')}
              </h2>
              <button onClick={closeModal} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.muted }}><X size={18} /></button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ fontSize: 11, color: T.muted }}>{t('annonces.titre')} *</label>
                <input name="titre" value={form.titre} onChange={handleChange} style={{ width: '100%', background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 12px', color: T.text, marginTop: 4 }} />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ fontSize: 11, color: T.muted }}>{t('annonces.message')} *</label>
                <textarea name="message" value={form.message} onChange={handleChange} rows="4" style={{ width: '100%', background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 12px', color: T.text, marginTop: 4, resize: 'vertical', fontFamily: 'inherit' }} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: T.muted }}>{t('annonces.type')}</label>
                <select name="type" value={form.type} onChange={handleChange} style={{ width: '100%', background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 12px', color: T.text, marginTop: 4 }}>
                  {['info', 'urgence', 'evenement', 'resultat'].map(tp => (
                    <option key={tp} value={tp}>{t(`annonces.types.${tp}`)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11, color: T.muted }}>{t('annonces.cible')}</label>
                <select name="cible" value={form.cible} onChange={handleChange} style={{ width: '100%', background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 12px', color: T.text, marginTop: 4 }}>
                  {['ecole', 'parents', 'classe'].map(cb => (
                    <option key={cb} value={cb}>{t(`annonces.cibles.${cb}`)}</option>
                  ))}
                </select>
              </div>
              {form.cible === 'classe' && (
                <div>
                  <label style={{ fontSize: 11, color: T.muted }}>{t('annonces.classe')} *</label>
                  <select name="classeId" value={form.classeId} onChange={handleChange} style={{ width: '100%', background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 12px', color: T.text, marginTop: 4 }}>
                    <option value="">{t('annonces.selectClasse')}</option>
                    {classes.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label style={{ fontSize: 11, color: T.muted }}>{t('annonces.date')}</label>
                <input name="date" type="date" value={form.date} onChange={handleChange} style={{ width: '100%', background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 12px', color: T.text, marginTop: 4 }} />
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
