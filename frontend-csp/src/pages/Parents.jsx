import { useState, useEffect, useMemo } from 'react';
import { Search, Plus, Edit2, Trash2, X, Check, KeyRound, Eye, EyeOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { fetchWithAuth } from '../api/fetchWithAuth';

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
  nom: '',
  telephone: '',
  password: '',
  email: '',
  adresse: '',
  isActive: true,
  eleveIds: [],
};

export default function Parents() {
  const { t } = useTranslation();
  const [parents, setParents] = useState([]);
  const [eleves, setEleves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [eleveSearch, setEleveSearch] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const loadParents = async () => {
    setLoading(true);
    try {
      const url = `/parents?search=${encodeURIComponent(search)}`;
      const data = await fetchWithAuth(url);
      setParents(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Erreur chargement parents', err);
    } finally {
      setLoading(false);
    }
  };

  const loadEleves = async () => {
    try {
      const data = await fetchWithAuth('/eleves?page=1&limit=10000');
      setEleves(data.eleves || []);
    } catch (err) {
      console.error('Erreur chargement élèves', err);
    }
  };

  useEffect(() => {
    loadParents();
  }, [search]);

  useEffect(() => {
    loadEleves();
  }, []);

  const filteredEleves = useMemo(() => {
    if (!eleveSearch) return eleves;
    const q = eleveSearch.toLowerCase();
    return eleves.filter(e =>
      (e.nom || '').toLowerCase().includes(q) ||
      (e.prenom || '').toLowerCase().includes(q) ||
      (e.matricule || '').toLowerCase().includes(q)
    );
  }, [eleves, eleveSearch]);

  const openAdd = () => {
    setForm(emptyForm);
    setShowPassword(false);
    setModal('add');
  };

  const openEdit = (parent) => {
    setForm({
      nom: parent.nom,
      telephone: parent.telephone,
      password: '',
      email: parent.email || '',
      adresse: parent.adresse || '',
      isActive: parent.isActive,
      eleveIds: (parent.eleves || []).map(l => l.eleve.id),
    });
    setShowPassword(false);
    setModal({ id: parent.id });
  };

  const closeModal = () => {
    setModal(null);
    setEleveSearch('');
    setShowPassword(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const toggleEleve = (id) => {
    setForm(prev => ({
      ...prev,
      eleveIds: prev.eleveIds.includes(id)
        ? prev.eleveIds.filter(x => x !== id)
        : [...prev.eleveIds, id],
    }));
  };

  const save = async () => {
    if (!form.nom || !form.telephone) return;

    try {
      const payload = {
        nom: form.nom,
        telephone: form.telephone,
        email: form.email || '',
        adresse: form.adresse || '',
        eleveIds: form.eleveIds,
      };
      if (form.password) payload.password = form.password;
      if (modal !== 'add') payload.isActive = form.isActive;

      const url = modal === 'add' ? '/parents' : `/parents/${modal.id}`;
      await fetchWithAuth(url, {
        method: modal === 'add' ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      closeModal();
      loadParents();
    } catch (err) {
      console.error('Erreur sauvegarde parent', err);
      alert('Erreur : ' + err.message);
    }
  };

  const remove = async (id) => {
    if (!confirm(t('parents.deleteConfirm'))) return;
    try {
      await fetchWithAuth(`/parents/${id}`, { method: 'DELETE' });
      loadParents();
    } catch (err) {
      console.error('Erreur suppression parent', err);
      alert('Erreur : ' + err.message);
    }
  };

  return (
    <div className="fade-up">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: "'Fraunces', serif", fontWeight: 900, fontSize: 24, color: T.text }}>{t('parents.title')}</h1>
          <p style={{ fontSize: 13, color: T.muted, marginTop: 2 }}>{t('parents.subtitle', { count: parents.length })}</p>
        </div>
        <button onClick={openAdd} style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px',
          background: T.accent, border: 'none', borderRadius: 10, color: '#fff',
          cursor: 'pointer', fontSize: 13, fontWeight: 600,
        }}>
          <Plus size={15} /> {t('parents.newParent')}
        </button>
      </div>

      {/* Recherche */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '8px 14px', flex: 1 }}>
          <Search size={14} color={T.muted} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t('parents.searchPlaceholder')}
            style={{ background: 'transparent', border: 'none', outline: 'none', color: T.text, fontSize: 13, width: '100%' }}
          />
        </div>
      </div>

      {/* Tableau */}
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: T.muted }}>{t('common.loading')}</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#0a1624' }}>
                {[t('parents.headers.nom'), t('parents.headers.telephone'), t('parents.headers.enfants'), t('parents.headers.statut'), t('parents.headers.actions')].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '13px 16px', fontSize: 10, color: T.muted, fontWeight: 700, letterSpacing: '0.08em', borderBottom: `1px solid ${T.border}` }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {parents.length === 0 ? (
                <tr><td colSpan="5" style={{ padding: 40, textAlign: 'center', color: T.muted }}>{t('parents.noParentFound')}</td></tr>
              ) : (
                parents.map((p, idx) => {
                  const enfants = p.eleves || [];
                  return (
                    <tr key={p.id} style={{ borderBottom: `1px solid ${T.border}20`, background: idx % 2 ? '#0a1624' : 'transparent' }}>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{
                            width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                            background: T.accent + '20', color: T.accent,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 13, fontWeight: 700,
                          }}>
                            {(p.nom || '?').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontSize: 13, color: T.text, fontWeight: 500 }}>{p.nom}</div>
                            {p.email && <div style={{ fontSize: 11, color: T.muted }}>{p.email}</div>}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 12, color: T.muted }}>{p.telephone}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                          {enfants.length === 0 && <span style={{ fontSize: 11, color: T.muted }}>—</span>}
                          {enfants.slice(0, 3).map(l => (
                            <span key={l.eleve.id} style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, background: T.blue + '20', color: T.blue, border: `1px solid ${T.blue}30` }}>
                              {l.eleve.prenom} {l.eleve.nom}
                            </span>
                          ))}
                          {enfants.length > 3 && (
                            <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, background: T.card, color: T.muted, border: `1px solid ${T.border}` }}>
                              +{enfants.length - 3}
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          fontSize: 11, padding: '3px 10px', borderRadius: 6,
                          background: p.isActive ? T.green + '20' : T.red + '20',
                          color: p.isActive ? T.green : T.red,
                          border: `1px solid ${p.isActive ? T.green : T.red}30`,
                        }}>
                          {p.isActive ? t('parents.actif') : t('parents.inactif')}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button onClick={() => openEdit(p)} style={{ width: 30, height: 30, borderRadius: 7, background: T.accent + '15', border: `1px solid ${T.accent}30`, cursor: 'pointer' }}>
                            <Edit2 size={12} color={T.accent} />
                          </button>
                          <button onClick={() => remove(p.id)} style={{ width: 30, height: 30, borderRadius: 7, background: T.red + '15', border: `1px solid ${T.red}30`, cursor: 'pointer' }}>
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

      {/* Modal Ajout / Édition */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: '#000000a0', display: 'flex', zIndex: 200, overflow: 'auto', padding: 20 }}>
          <div style={{ background: '#0c1c2c', border: `1px solid ${T.border}`, borderRadius: 16, padding: 28, width: 640, maxHeight: 'none', margin: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
              <h2 style={{ fontFamily: "'Fraunces', serif", fontWeight: 700, fontSize: 17, color: T.text }}>
                {modal === 'add' ? t('parents.newParent') : t('parents.editParent')}
              </h2>
              <button onClick={closeModal} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.muted }}><X size={18} /></button>
            </div>

            {/* Compte */}
            <div style={{ fontSize: 11, color: T.accent, fontWeight: 700, letterSpacing: '0.1em', marginBottom: 12 }}>{t('parents.sectionCompte')}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div><label style={{ fontSize: 11, color: T.muted }}>{t('parents.nom')} *</label><input name="nom" value={form.nom} onChange={handleInputChange} style={{ width: '100%', background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 12px', color: T.text }} /></div>
              <div><label style={{ fontSize: 11, color: T.muted }}>{t('parents.telephone')} *</label><input name="telephone" type="tel" value={form.telephone} onChange={handleInputChange} style={{ width: '100%', background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 12px', color: T.text }} /></div>
              <div><label style={{ fontSize: 11, color: T.muted }}>{t('parents.email')}</label><input name="email" type="email" value={form.email} onChange={handleInputChange} style={{ width: '100%', background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 12px', color: T.text }} /></div>
              <div><label style={{ fontSize: 11, color: T.muted }}>{t('parents.adresse')}</label><input name="adresse" value={form.adresse} onChange={handleInputChange} style={{ width: '100%', background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 12px', color: T.text }} /></div>
              <div>
                <label style={{ fontSize: 11, color: T.muted }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <KeyRound size={11} /> {modal === 'add' ? t('parents.password') : t('parents.resetPassword')}
                  </span>
                </label>
                <div style={{ position: 'relative', marginTop: 4 }}>
                  <input name="password" type={showPassword ? 'text' : 'password'} value={form.password} onChange={handleInputChange} placeholder={modal === 'add' ? '' : '••••••••'} style={{ width: '100%', background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 12px', paddingRight: 36, color: T.text, boxSizing: 'border-box' }} />
                  <button
                    type="button"
                    onClick={() => setShowPassword(s => !s)}
                    title={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                    style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer', color: T.muted, display: 'flex', alignItems: 'center', padding: 4 }}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
              {modal !== 'add' && (
                <div>
                  <label style={{ fontSize: 11, color: T.muted }}>{t('parents.statut')}</label>
                  <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                    {[true, false].map(active => (
                      <button
                        key={String(active)}
                        type="button"
                        onClick={() => setForm(prev => ({ ...prev, isActive: active }))}
                        style={{
                          flex: 1, padding: '8px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 12,
                          background: form.isActive === active ? (active ? T.green + '20' : T.red + '20') : 'transparent',
                          border: form.isActive === active ? `1px solid ${active ? T.green : T.red}50` : `1px solid ${T.border}`,
                          color: form.isActive === active ? (active ? T.green : T.red) : T.muted,
                        }}
                      >
                        {active ? t('parents.actif') : t('parents.inactif')}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Enfants */}
            <div style={{ fontSize: 11, color: T.accent, fontWeight: 700, letterSpacing: '0.1em', marginBottom: 12 }}>{t('parents.sectionEnfants')}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 12px', marginBottom: 10 }}>
              <Search size={13} color={T.muted} />
              <input
                value={eleveSearch}
                onChange={e => setEleveSearch(e.target.value)}
                placeholder={t('parents.searchEleve')}
                style={{ background: 'transparent', border: 'none', outline: 'none', color: T.text, fontSize: 12, width: '100%' }}
              />
            </div>
            <div style={{ maxHeight: 220, overflowY: 'auto', border: `1px solid ${T.border}`, borderRadius: 10, padding: 6 }}>
              {filteredEleves.length === 0 && (
                <div style={{ padding: 20, textAlign: 'center', color: T.muted, fontSize: 12 }}>{t('parents.noEleveFound')}</div>
              )}
              {filteredEleves.map(e => {
                const checked = form.eleveIds.includes(e.id);
                const classe = e.classe?.nom || e.inscriptions?.[0]?.classe?.nom || '';
                return (
                  <label
                    key={e.id}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px', borderRadius: 8,
                      cursor: 'pointer', background: checked ? T.blue + '12' : 'transparent',
                      border: checked ? `1px solid ${T.blue}35` : '1px solid transparent',
                    }}
                  >
                    <input type="checkbox" checked={checked} onChange={() => toggleEleve(e.id)} style={{ accentColor: T.blue }} />
                    <span style={{ fontSize: 13, color: T.text, flex: 1 }}>
                      {e.prenom} {e.nom}
                      <span style={{ fontSize: 11, color: T.muted, marginLeft: 8 }}>{e.matricule}</span>
                    </span>
                    {classe && <span style={{ fontSize: 10, color: T.muted }}>{classe}</span>}
                  </label>
                );
              })}
            </div>
            <div style={{ fontSize: 11, color: T.muted, marginTop: 8 }}>
              {form.eleveIds.length} {t('parents.enfantSelectionne', { count: form.eleveIds.length })}
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
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
