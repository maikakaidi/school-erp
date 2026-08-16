import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Check, Download, Eye, EyeOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { fetchWithAuth } from '../api/fetchWithAuth';
import PendingBadge from '../components/PendingBadge';
import { downloadExcel } from '../api/downloadExcel';

const T = {
  card: '#0c1c2c', border: '#1a3050', accent: '#d4921a',
  green: '#1d9468', red: '#b83838', blue: '#2878c8',
  text: '#ddd0b8', muted: '#486070', bg: '#06101a',
};

const emptyForm = {
  nom: '',
  prenom: '',
  telephone: '',
  email: '',
  specialite: '',
  estVacataire: false,
  tauxHoraire: '',
  salaireFixe: '',
  anciennete: '',
  dateEmbauche: '',
  password: '',
};

export default function Enseignants() {
  const { t } = useTranslation();
  const [enseignants, setEnseignants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [showPassword, setShowPassword] = useState(false);

  const loadEnseignants = async () => {
    setLoading(true);
    try {
      const data = await fetchWithAuth(`/enseignants?page=${page}&limit=15&search=${encodeURIComponent(search)}`);
      setEnseignants(data.enseignants || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEnseignants();
  }, [page, search]);

  useEffect(() => {
    const handler = () => loadEnseignants();
    window.addEventListener('sync-complete', handler);
    return () => window.removeEventListener('sync-complete', handler);
  }, [page, search]);

  const openAdd = () => {
    setForm(emptyForm);
    setModal('add');
  };

  const openEdit = (ens) => {
    setForm({
      id: ens.id,
      nom: ens.nom,
      prenom: ens.prenom,
      telephone: ens.telephone,
      email: ens.email || '',
      specialite: ens.specialite || '',
      estVacataire: ens.estVacataire || false,
      tauxHoraire: ens.tauxHoraire || '',
      salaireFixe: ens.salaireFixe || '',
      anciennete: ens.anciennete || '',
      dateEmbauche: ens.dateEmbauche?.split('T')[0] || '',
      password: '',
    });
    setModal({ id: ens.id });
  };

  const closeModal = () => setModal(null);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const save = async () => {
  if (!form.nom) return;
  try {
    const payload = {
      nom: form.nom,
      prenom: form.prenom,
      telephone: form.telephone,
      email: form.email || undefined,
      specialite: form.specialite || undefined,
      estVacataire: form.estVacataire,
      tauxHoraire: form.estVacataire && form.tauxHoraire ? parseFloat(form.tauxHoraire) : undefined,
      salaireFixe: !form.estVacataire && form.salaireFixe ? parseFloat(form.salaireFixe) : undefined,
      anciennete: form.anciennete ? parseInt(form.anciennete) : undefined,
      dateEmbauche: form.dateEmbauche || undefined,
    };
      if (form.password) payload.password = form.password;
      let url = '/enseignants';
      let method = 'POST';
      if (modal !== 'add') {
        url = `/enseignants/${modal.id}`;
        method = 'PUT';
      }
      const result = await fetchWithAuth(url, { method, body: JSON.stringify(payload) });
      if (result?._pending && modal === 'add') {
        const tempItem = { id: result.tempId, ...payload, _pending: true };
        setEnseignants(prev => [tempItem, ...prev]);
        setTotal(prev => prev + 1);
        closeModal();
        return;
      }
      closeModal();
      loadEnseignants();
    } catch (err) {
      alert('Erreur : ' + err.message);
    }
  };

  const remove = async (id) => {
    if (!confirm(t('enseignants.deleteConfirm'))) return;
    try {
      await fetchWithAuth(`/enseignants/${id}`, { method: 'DELETE' });
      loadEnseignants();
    } catch (err) {
      alert(err.message);
    }
  };

return (
  <div className="fade-up" style={{ paddingTop: 20 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
      <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 24, color: T.text, marginTop: 0 }}>{t('enseignants.title')}</h1>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={() => downloadExcel('/enseignants/export', 'enseignants.xlsx')} style={{ display: 'flex', alignItems: 'center', gap: 6, background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 14px', color: T.muted, cursor: 'pointer', fontSize: 12 }}>
          <Download size={14} /> Excel
        </button>
        <button onClick={openAdd} style={{ background: T.accent, border: 'none', borderRadius: 8, padding: '8px 18px', color: '#fff', cursor: 'pointer' }}>
          <Plus size={15} /> {t('enseignants.newEnseignant')}
        </button>
      </div>
    </div>

    <div style={{ marginBottom: 20 }}>
      <input
        value={search}
        onChange={e => { setSearch(e.target.value); setPage(1); }}
        placeholder={t('enseignants.searchPlaceholder')}
        style={{ width: '100%', background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px', color: T.text }}
      />
    </div>

    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, overflow: 'hidden' }}>
      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: T.muted }}>{t('common.loading')}</div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#0a1624' }}>
              <th style={{ padding: 12, textAlign: 'left' }}>{t('enseignants.headers.nom')}</th>
              <th style={{ padding: 12, textAlign: 'left' }}>{t('enseignants.headers.prenom')}</th>
              <th style={{ padding: 12, textAlign: 'left' }}>{t('enseignants.headers.telephone')}</th>
              <th style={{ padding: 12, textAlign: 'left' }}>{t('enseignants.headers.type')}</th>
              <th style={{ padding: 12, textAlign: 'left' }}>{t('enseignants.headers.tauxSalaire')}</th>
              <th style={{ padding: 12 }}>{t('enseignants.headers.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {enseignants.map((e, idx) => (
              <tr key={e.id} style={{ borderBottom: `1px solid ${T.border}30`, background: idx % 2 ? '#0a1624' : 'transparent' }}>
                <td style={{ padding: 12 }}>{e.nom}</td>
                <td style={{ padding: 12 }}>{e.prenom}</td>
                <td style={{ padding: 12 }}>{e.telephone}</td>
                <td style={{ padding: 12 }}>{e.estVacataire ? t('enseignants.vacataire') : t('enseignants.permanent')}</td>
                <td style={{ padding: 12 }}>{e.estVacataire ? `${e.tauxHoraire} FCFA/h` : `${e.salaireFixe} FCFA/mois`}</td>
                <td style={{ padding: 12, textAlign: 'center' }}>
                  {e._pending && <PendingBadge />}
                  <button onClick={() => openEdit(e)} style={{ background: T.accent + '20', border: 'none', borderRadius: 6, padding: '4px 8px', marginRight: 6, cursor: 'pointer' }}>
                    <Edit2 size={12} color={T.accent} />
                  </button>
                  <button onClick={() => remove(e.id)} style={{ background: T.red + '20', border: 'none', borderRadius: 6, padding: '4px 8px', cursor: 'pointer' }}>
                    <Trash2 size={12} color={T.red} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>

    {/* Pagination */}
    {totalPages > 1 && (
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}>
        <button disabled={page === 1} onClick={() => setPage(p => p - 1)} style={{ padding: '6px 12px', borderRadius: 6, background: T.card, border: `1px solid ${T.border}`, cursor: 'pointer' }}>{t('common.previous')}</button>
        <span style={{ padding: '6px 12px', color: T.muted }}>{t('common.pageOf', { current: page, total: totalPages })}</span>
        <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} style={{ padding: '6px 12px', borderRadius: 6, background: T.card, border: `1px solid ${T.border}`, cursor: 'pointer' }}>{t('common.next')}</button>
      </div>
    )}

    {/* Modal */}
    {modal && (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: '#000000a0',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          zIndex: 9999,
          overflowY: 'auto',
          paddingTop: 60,
          paddingBottom: 40,
        }}
      >
        <div
          style={{
            background: T.card,
            border: `1px solid ${T.border}`,
            borderRadius: 16,
            padding: 24,
            width: 500,
            maxHeight: 'calc(100vh - 100px)',
            overflowY: 'auto',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ margin: 0, color: T.text }}>{modal === 'add' ? t('enseignants.newEnseignant') : t('enseignants.editEnseignant')}</h2>
            <button onClick={closeModal} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: T.text }}>
              <X size={20} />
            </button>
          </div>

          <input name="nom" value={form.nom} onChange={handleChange} placeholder={t('enseignants.form.nom')} style={{ width: '100%', marginBottom: 12, padding: 8, background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text }} />
          <input name="prenom" value={form.prenom} onChange={handleChange} placeholder={t('enseignants.form.prenom')} style={{ width: '100%', marginBottom: 12, padding: 8, background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text }} />
          <input name="telephone" value={form.telephone} onChange={handleChange} placeholder={t('enseignants.form.telephone')} style={{ width: '100%', marginBottom: 12, padding: 8, background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text }} />
          <input name="email" value={form.email} onChange={handleChange} placeholder={t('enseignants.form.email')} style={{ width: '100%', marginBottom: 12, padding: 8, background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text }} />
          <input name="specialite" value={form.specialite} onChange={handleChange} placeholder={t('enseignants.form.specialite')} style={{ width: '100%', marginBottom: 12, padding: 8, background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text }} />

          <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="checkbox" name="estVacataire" checked={form.estVacataire} onChange={handleChange} />
            <label style={{ color: T.text }}>{t('enseignants.form.vacataireLabel')}</label>
          </div>

          {form.estVacataire ? (
            <input name="tauxHoraire" type="number" step="100" value={form.tauxHoraire} onChange={handleChange} placeholder={t('enseignants.form.tauxHoraire')} style={{ width: '100%', marginBottom: 12, padding: 8, background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text }} />
          ) : (
            <input name="salaireFixe" type="number" step="1000" value={form.salaireFixe} onChange={handleChange} placeholder={t('enseignants.form.salaireFixe')} style={{ width: '100%', marginBottom: 12, padding: 8, background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text }} />
          )}

          <input name="anciennete" type="number" value={form.anciennete} onChange={handleChange} placeholder={t('enseignants.form.anciennete')} style={{ width: '100%', marginBottom: 12, padding: 8, background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text }} />
          <input name="dateEmbauche" type="date" value={form.dateEmbauche} onChange={handleChange} style={{ width: '100%', marginBottom: 12, padding: 8, background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text }} />

          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 12, color: T.muted, marginBottom: 4, display: 'block' }}>
              {modal === 'add' ? 'Mot de passe (espace enseignant)' : 'Nouveau mot de passe (laisser vide pour ne pas changer)'}
            </label>
            <div style={{ position: 'relative' }}>
              <input
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={handleChange}
                minLength={6}
                placeholder="Min. 6 caractères"
                style={{ width: '100%', padding: 8, paddingRight: 36, background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text, boxSizing: 'border-box' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(s => !s)}
                title={showPassword ? 'Masquer' : 'Afficher'}
                style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer', color: T.muted, display: 'flex', alignItems: 'center', padding: 4 }}
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            <div style={{ fontSize: 11, color: T.muted, marginTop: 4 }}>
              Connexion : téléphone de l'école + téléphone de l'enseignant + ce mot de passe.
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button onClick={closeModal} style={{ padding: '8px 16px', background: 'transparent', border: `1px solid ${T.border}`, borderRadius: 8, color: T.muted, cursor: 'pointer' }}>{t('common.cancel')}</button>
            <button onClick={save} style={{ padding: '8px 16px', background: T.accent, border: 'none', borderRadius: 8, color: '#fff', cursor: 'pointer' }}>
              <Check size={14} style={{ marginRight: 6 }} /> {t('common.validate')}
            </button>
          </div>
        </div>
      </div>
    )}
  </div>
);
}
