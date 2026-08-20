import { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, X, Check, Download } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { fetchWithAuth } from '../api/fetchWithAuth';
import PendingBadge from '../components/PendingBadge';
import { downloadExcel } from '../api/downloadExcel';

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
  prenom: '',
  sexe: 'M',
  dateNaissance: '',
  lieuNaissance: '',
  nationalite: 'Nigérienne',
  telephone: '',
  nomParent: '',
  adresseParent: '',
  telParent: '',
  classeId: '',
  langueChoisie: '',
  password: '',
};

export default function Eleves() {
  const { t } = useTranslation();
  const [eleves, setEleves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [classeFilter, setClasseFilter] = useState('Toutes');
  const [classes, setClasses] = useState([]);
  const [groupes, setGroupes] = useState([]);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Charger les classes
  useEffect(() => {
    const loadClasses = async () => {
      try {
        const data = await fetchWithAuth('/classes?limit=100');
        setClasses(data.classes || []);
      } catch (err) {
        console.error('Erreur chargement classes', err);
      }
    };
    const loadGroupes = async () => {
      try {
        const data = await fetchWithAuth('/matieres/groupes/all');
        setGroupes(data || []);
      } catch (err) { console.error(err); }
    };
    loadClasses();
    loadGroupes();
  }, []);

  const loadEleves = async () => {
    setLoading(true);
    try {
      let url = `/eleves?page=${page}&limit=15&search=${encodeURIComponent(search)}`;
      if (classeFilter !== 'Toutes') {
        url += `&classeId=${classeFilter}`;
      }
      const data = await fetchWithAuth(url);
      setEleves(data.eleves || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      console.error('Erreur chargement élèves', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEleves();
  }, [page, search, classeFilter]);

  useEffect(() => {
    const handler = () => loadEleves();
    window.addEventListener('sync-complete', handler);
    return () => window.removeEventListener('sync-complete', handler);
  }, [page, search, classeFilter]);

  const openAdd = () => {
    setForm(emptyForm);
    setModal('add');
  };

  const openEdit = (eleve) => {
    const classeId = eleve.inscriptions?.[0]?.classeId || '';
    const langueChoisie = eleve.inscriptions?.[0]?.langueChoisie || '';
    setForm({
      id: eleve.id,
      nom: eleve.nom,
      prenom: eleve.prenom || '',
      sexe: eleve.sexe,
      dateNaissance: eleve.dateNaissance?.split('T')[0] || '',
      lieuNaissance: eleve.lieuNaissance || '',
      nationalite: eleve.nationalite || '',
      telephone: eleve.telephone || '',
      nomParent: eleve.nomParent || '',
      adresseParent: eleve.adresseParent || '',
      telParent: eleve.telParent || '',
      classeId,
      langueChoisie,
      password: '',
    });
    setModal({ id: eleve.id });
  };

  const closeModal = () => setModal(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const save = async () => {
    if (!form.nom) return;

    try {
      const payload = {
        nom: form.nom,
        prenom: form.prenom,
        sexe: form.sexe,
        dateNaissance: form.dateNaissance ? new Date(form.dateNaissance).toISOString() : null,
        lieuNaissance: form.lieuNaissance,
        nationalite: form.nationalite,
        telephone: form.telephone,
        nomParent: form.nomParent,
        adresseParent: form.adresseParent,
        telParent: form.telParent,
        classeId: form.classeId || undefined,
        langueChoisie: form.langueChoisie || undefined,
        password: form.password || undefined,
      };

      let url = '/eleves';
      let method = 'POST';

      if (modal !== 'add') {
        url = `/eleves/${modal.id}`;
        method = 'PUT';
      }

      const result = await fetchWithAuth(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (result?._pending && modal === 'add') {
        const tempItem = { id: result.tempId, ...payload, _pending: true, matricule: '—', classe: { nom: classes.find(c => c.id === payload.classeId)?.nom || '...' } };
        setEleves(prev => [tempItem, ...prev]);
        setTotal(prev => prev + 1);
        closeModal();
        return;
      }

      closeModal();
      loadEleves();
    } catch (err) {
      console.error('Erreur sauvegarde', err);
      alert('Erreur : ' + err.message);
    }
  };

  const remove = async (id) => {
    if (!confirm(t('eleves.deleteConfirm'))) return;
    try {
      await fetchWithAuth(`/eleves/${id}`, { method: 'DELETE' });
      loadEleves();
    } catch (err) {
      console.error('Erreur suppression', err);
      alert('Erreur : ' + err.message);
    }
  };

  return (
    <div className="fade-up">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: "'Fraunces', serif", fontWeight: 900, fontSize: 24, color: T.text }}>{t('eleves.title')}</h1>
          <p style={{ fontSize: 13, color: T.muted, marginTop: 2 }}>{t('eleves.subtitle', { count: total })}</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => downloadExcel('/eleves/export', 'eleves.xlsx')} style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '10px 14px',
            background: T.card, border: `1px solid ${T.border}`, borderRadius: 10,
            color: T.muted, cursor: 'pointer', fontSize: 12,
          }}>
            <Download size={14} /> Excel
          </button>
          <button onClick={openAdd} style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px',
            background: T.accent, border: 'none', borderRadius: 10, color: '#fff',
            cursor: 'pointer', fontSize: 13, fontWeight: 600,
          }}>
            <Plus size={15} /> {t('eleves.newStudent')}
          </button>
        </div>
      </div>

      {/* Filtres */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '8px 14px', flex: 1 }}>
          <Search size={14} color={T.muted} />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder={t('eleves.searchPlaceholder')}
            style={{ background: 'transparent', border: 'none', outline: 'none', color: T.text, fontSize: 13, width: '100%' }}
          />
        </div>
        <select
          value={classeFilter}
          onChange={e => { setClasseFilter(e.target.value); setPage(1); }}
          style={{
            background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '8px 14px',
            color: T.text, fontSize: 13, outline: 'none', cursor: 'pointer',
          }}
        >
          <option value="Toutes">{t('eleves.allClasses')}</option>
          {classes.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
        </select>
      </div>

      {/* Tableau */}
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: T.muted }}>{t('common.loading')}</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
           <thead>
  <tr style={{ background: '#0a1624' }}>
    {[t('eleves.headers.matricule'), t('eleves.headers.nomPrenom'), t('eleves.headers.classe'), t('eleves.headers.sexe'), t('eleves.headers.telephone'), t('eleves.headers.parent'), t('eleves.headers.actions')].map(h => (
      <th key={h} style={{ textAlign: 'left', padding: '13px 16px', fontSize: 10, color: T.muted, fontWeight: 700, letterSpacing: '0.08em', borderBottom: `1px solid ${T.border}` }}>
        {h}
      </th>
    ))}
  </tr>
</thead>
            <tbody>
              {eleves.length === 0 ? (
                <tr><td colSpan="7" style={{ padding: 40, textAlign: 'center', color: T.muted }}>{t('eleves.noStudentFound')}</td></tr>
              ) : (
                eleves.map((e, idx) => {
                  // Récupère la classe (soit depuis e.classe si le backend l'ajoute, soit depuis la première inscription)
                  const className = e.classe?.nom || e.inscriptions?.[0]?.classe?.nom || 'N/A';
                  return (
                    <tr key={e.id} style={{ borderBottom: `1px solid ${T.border}20`, background: idx % 2 ? '#0a1624' : 'transparent' }}>
                      <td style={{ padding: '12px 16px', fontSize: 11, color: T.muted }}>{e.matricule || '—'}</td>
                      <td style={{ padding: '12px 16px', fontSize: 13, color: T.text, fontWeight: 500 }}>{e.nom} {e.prenom}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, background: T.blue + '20', color: T.blue, border: `1px solid ${T.blue}30` }}>
                          {className}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 12, color: T.muted }}>{e.sexe === 'F' ? '♀ F' : '♂ M'}</td>
                      <td style={{ padding: '12px 16px', fontSize: 12, color: T.muted }}>{e.telephone || '—'}</td>
                      <td style={{ padding: '12px 16px', fontSize: 12, color: T.muted }}>{e.nomParent || '—'}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                          {e._pending && <PendingBadge />}
                          <button onClick={() => openEdit(e)} style={{ width: 30, height: 30, borderRadius: 7, background: T.accent + '15', border: `1px solid ${T.accent}30`, cursor: 'pointer' }}>
                            <Edit2 size={12} color={T.accent} />
                          </button>
                          <button onClick={() => remove(e.id)} style={{ width: 30, height: 30, borderRadius: 7, background: T.red + '15', border: `1px solid ${T.red}30`, cursor: 'pointer' }}>
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}>
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)} style={{ padding: '6px 12px', borderRadius: 6, background: T.card, border: `1px solid ${T.border}`, cursor: page === 1 ? 'not-allowed' : 'pointer', color: T.text }}>{t('common.previous')}</button>
          <span style={{ padding: '6px 12px', color: T.muted }}>{t('common.pageOf', { current: page, total: totalPages })}</span>
          <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} style={{ padding: '6px 12px', borderRadius: 6, background: T.card, border: `1px solid ${T.border}`, cursor: page === totalPages ? 'not-allowed' : 'pointer', color: T.text }}>{t('common.next')}</button>
        </div>
      )}

      {/* Modal Ajout / Édition */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: '#000000a0', display: 'flex', zIndex: 200, overflow: 'auto', padding: 20 }}>
          <div style={{ background: '#0c1c2c', border: `1px solid ${T.border}`, borderRadius: 16, padding: 28, width: 640, maxWidth: '100%', maxHeight: 'none', margin: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
              <h2 style={{ fontFamily: "'Fraunces', serif", fontWeight: 700, fontSize: 17, color: T.text }}>
                {modal === 'add' ? t('eleves.newStudent') : t('eleves.editStudent')}
              </h2>
              <button onClick={closeModal} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.muted }}><X size={18} /></button>
            </div>

            {/* Détail élève */}
            <div style={{ fontSize: 11, color: T.accent, fontWeight: 700, letterSpacing: '0.1em', marginBottom: 12 }}>{t('eleves.studentDetail')}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div><label style={{ fontSize: 11, color: T.muted }}>{t('eleves.nom')}</label><input name="nom" value={form.nom} onChange={handleInputChange} style={{ width: '100%', background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 12px', color: T.text }} /></div>
              <div><label style={{ fontSize: 11, color: T.muted }}>{t('eleves.prenom')}</label><input name="prenom" value={form.prenom} onChange={handleInputChange} style={{ width: '100%', background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 12px', color: T.text }} /></div>
              <div><label style={{ fontSize: 11, color: T.muted }}>{t('eleves.sexe')}</label><select name="sexe" value={form.sexe} onChange={handleInputChange} style={{ width: '100%', background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 12px', color: T.text }}><option value="M">{t('eleves.masculin')}</option><option value="F">{t('eleves.feminin')}</option></select></div>
              <div><label style={{ fontSize: 11, color: T.muted }}>{t('eleves.dateNaissance')}</label><input name="dateNaissance" type="date" value={form.dateNaissance} onChange={handleInputChange} style={{ width: '100%', background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 12px', color: T.text }} /></div>
              <div><label style={{ fontSize: 11, color: T.muted }}>{t('eleves.lieuNaissance')}</label><input name="lieuNaissance" value={form.lieuNaissance} onChange={handleInputChange} style={{ width: '100%', background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 12px', color: T.text }} /></div>
              <div><label style={{ fontSize: 11, color: T.muted }}>{t('eleves.nationalite')}</label><input name="nationalite" value={form.nationalite} onChange={handleInputChange} style={{ width: '100%', background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 12px', color: T.text }} /></div>
              <div><label style={{ fontSize: 11, color: T.muted }}>{t('eleves.telephoneEleve')}</label><input name="telephone" value={form.telephone} onChange={handleInputChange} style={{ width: '100%', background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 12px', color: T.text }} /></div>
            </div>

            {/* Parent */}
            <div style={{ fontSize: 11, color: T.accent, fontWeight: 700, letterSpacing: '0.1em', marginBottom: 12 }}>{t('eleves.parentDetail')}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
              <div><label style={{ fontSize: 11, color: T.muted }}>{t('eleves.nomParent')}</label><input name="nomParent" value={form.nomParent} onChange={handleInputChange} style={{ width: '100%', background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 12px', color: T.text }} /></div>
              <div><label style={{ fontSize: 11, color: T.muted }}>{t('eleves.adresseParent')}</label><input name="adresseParent" value={form.adresseParent} onChange={handleInputChange} style={{ width: '100%', background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 12px', color: T.text }} /></div>
              <div><label style={{ fontSize: 11, color: T.muted }}>{t('eleves.telParent')}</label><input name="telParent" value={form.telParent} onChange={handleInputChange} style={{ width: '100%', background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 12px', color: T.text }} /></div>
            </div>

            {/* Classe */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 11, color: T.muted }}>{t('eleves.classe')}</label>
              <select
                name="classeId"
                value={form.classeId}
                onChange={handleInputChange}
                required
                style={{ width: '100%', background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 12px', color: T.text }}
              >
                <option value="">{t('eleves.selectClasse')}</option>
                {classes.map(c => (
                  <option key={c.id} value={c.id}>{c.nom}</option>
                ))}
              </select>
            </div>

            {/* Choix de langue (si la classe a un groupe de choix) */}
            {(() => {
              const hasChoiceGroup = groupes.some(g =>
                g.matieres?.some(m => m.groupeId === g.id)
              );
              if (!hasChoiceGroup || !form.classeId) return null;
              const options = [];
              for (const g of groupes) {
                if (g.matieres) {
                  for (const m of g.matieres) {
                    if (m.groupeId === g.id && !options.includes(m.libelle)) {
                      options.push(m.libelle);
                    }
                  }
                }
              }
              if (options.length === 0) return null;
              return (
                <div style={{ marginBottom: 20 }}>
                  <label style={{ fontSize: 11, color: T.muted, display: 'block', marginBottom: 8 }}>Choix de langue</label>
                  <div style={{ display: 'flex', gap: 16 }}>
                    {options.map(opt => (
                      <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: 6, color: T.text, fontSize: 13, cursor: 'pointer' }}>
                        <input
                          type="radio"
                          name="langueChoisie"
                          value={opt}
                          checked={form.langueChoisie === opt}
                          onChange={handleInputChange}
                          style={{ accentColor: T.accent }}
                        />
                        {opt}
                      </label>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Accès espace élève */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 11, color: T.muted }}>Mot de passe (espace élève)</label>
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={handleInputChange}
                placeholder="Laisser vide pour ne pas changer"
                style={{ width: '100%', background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 12px', color: T.text }}
              />
              <div style={{ fontSize: 10, color: T.muted, marginTop: 4 }}>
                Le matricule (affiche dans la liste) + ce mot de passe permettront à l'élève de se connecter.
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
