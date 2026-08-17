import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { fetchWithAuth } from '../api/fetchWithAuth';

const T = {
  card: '#0c1c2c', border: '#1a3050', accent: '#d4921a',
  green: '#1d9468', red: '#b83838', blue: '#2878c8',
  text: '#ddd0b8', muted: '#486070', bg: '#06101a',
};

const emptyForm = { libelle: '', code: '', type: '' };

export default function Matieres() {
  const { t } = useTranslation();
  const [matieres, setMatieres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const loadMatieres = async () => {
    setLoading(true);
    try {
      const data = await fetchWithAuth('/matieres');
      setMatieres(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadMatieres(); }, []);

  const openAdd = () => { setForm(emptyForm); setModal('add'); };
  const openEdit = (m) => { setForm(m); setModal({ id: m.id }); };
  const closeModal = () => setModal(null);
  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const save = async () => {
    if (!form.libelle) return;
    try {
      let url = '/matieres', method = 'POST';
      if (modal !== 'add') { url = `/matieres/${modal.id}`; method = 'PUT'; }
      await fetchWithAuth(url, { method, body: JSON.stringify(form) });
      closeModal();
      loadMatieres();
    } catch (err) { alert(err.message); }
  };

  const remove = async (id) => {
    if (!confirm(t('matieres.deleteConfirm'))) return;
    try {
      await fetchWithAuth(`/matieres/${id}`, { method: 'DELETE' });
      loadMatieres();
    } catch (err) { alert(err.message); }
  };

  return (
    <div className="fade-up">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 24, color: T.text }}>{t('matieres.title')}</h1>
        <button onClick={openAdd} style={{ background: T.accent, border: 'none', borderRadius: 10, padding: '8px 18px', color: '#fff', cursor: 'pointer' }}>
          <Plus size={15} style={{ marginRight: 6 }} /> {t('matieres.newMatiere')}
        </button>
      </div>

      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, overflow: 'hidden' }}>
        {loading ? <div style={{ padding: 40, textAlign: 'center', color: T.muted }}>{t('common.loading')}</div> : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#0a1624' }}>
                <th style={{ padding: '12px', textAlign: 'left' }}>{t('matieres.headers.libelle')}</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>{t('matieres.headers.code')}</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>{t('matieres.headers.type')}</th>
                <th style={{ padding: '12px' }}>{t('matieres.headers.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {matieres.map((m, idx) => (
                <tr key={m.id} style={{ borderBottom: `1px solid ${T.border}20`, background: idx % 2 ? '#0a1624' : 'transparent' }}>
                  <td style={{ padding: '12px', color: T.text }}>{m.libelle}</td>
                  <td style={{ padding: '12px', color: T.muted }}>{m.code || '—'}</td>
                  <td style={{ padding: '12px', color: T.muted }}>{m.type || '—'}</td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <button onClick={() => openEdit(m)} style={{ background: T.accent + '20', border: 'none', borderRadius: 6, padding: '4px 8px', marginRight: 6, cursor: 'pointer' }}><Edit2 size={12} color={T.accent} /></button>
                    <button onClick={() => remove(m.id)} style={{ background: T.red + '20', border: 'none', borderRadius: 6, padding: '4px 8px', cursor: 'pointer' }}><Trash2 size={12} color={T.red} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: '#000000a0', display: 'flex', zIndex: 200, overflow: 'auto', padding: 20 }}>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, padding: 24, width: 400, margin: 'auto' }}>
            <h2 style={{ marginBottom: 16, color: T.text }}>{modal === 'add' ? t('matieres.newMatiere') : t('matieres.editMatiere')}</h2>
            <input name="libelle" value={form.libelle} onChange={handleChange} placeholder={t('matieres.libelle')} style={{ width: '100%', marginBottom: 12, padding: 8, background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text }} />
            <input name="code" value={form.code} onChange={handleChange} placeholder={t('matieres.code')} style={{ width: '100%', marginBottom: 12, padding: 8, background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text }} />
            <input name="type" value={form.type} onChange={handleChange} placeholder={t('matieres.type')} style={{ width: '100%', marginBottom: 20, padding: 8, background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text }} />
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={closeModal} style={{ padding: '8px 16px', background: 'transparent', border: `1px solid ${T.border}`, borderRadius: 8, color: T.muted, cursor: 'pointer' }}>{t('common.cancel')}</button>
              <button onClick={save} style={{ padding: '8px 16px', background: T.accent, border: 'none', borderRadius: 8, color: '#fff', cursor: 'pointer' }}><Check size={14} style={{ marginRight: 6 }} /> {t('common.validate')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}