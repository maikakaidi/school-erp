import { useState, useEffect, useMemo } from 'react';
import { Search, Plus, Edit2, Trash2, X, Check, Download, UserX, CalendarX, CheckCircle2, Clock } from 'lucide-react';
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
  orange: '#d4921a',
  purple: '#7848c8',
  text: '#ddd0b8',
  muted: '#486070',
  bg: '#06101a',
};

const emptyForm = {
  eleveId: '',
  classeId: '',
  matiereId: '',
  date: new Date().toISOString().slice(0, 10),
  type: 'absence',
  motif: '',
  justifie: false,
  statutJustificatif: 'non_justifie',
};

const bulkEmpty = {
  classeId: '',
  matiereId: '',
  date: new Date().toISOString().slice(0, 10),
  type: 'absence',
  motif: '',
  eleveIds: [],
};

export default function Absences() {
  const { t } = useTranslation();
  const [absences, setAbsences] = useState([]);
  const [stats, setStats] = useState({ totalAbsences: 0, totalRetards: 0, justifies: 0, enAttente: 0 });
  const [classes, setClasses] = useState([]);
  const [matieres, setMatieres] = useState([]);
  const [eleves, setEleves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [classeFilter, setClasseFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('tous');
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [bulkForm, setBulkForm] = useState(bulkEmpty);
  const [bulkEleves, setBulkEleves] = useState([]);
  const [bulkAll, setBulkAll] = useState(false);
  const [eleveSearch, setEleveSearch] = useState('');

  const loadReferences = async () => {
    try {
      const [cls, mat, elv] = await Promise.all([
        fetchWithAuth('/classes?limit=100'),
        fetchWithAuth('/matieres'),
        fetchWithAuth('/eleves?page=1&limit=10000'),
      ]);
      setClasses(cls.classes || []);
      setMatieres(Array.isArray(mat) ? mat : []);
      setEleves(elv.eleves || []);
    } catch (err) {
      console.error('Erreur chargement référentiels', err);
    }
  };

  const loadAbsences = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 15 });
      if (search) params.set('search', search);
      if (classeFilter) params.set('classeId', classeFilter);
      if (typeFilter && typeFilter !== 'tous') params.set('type', typeFilter);
      if (dateDebut) params.set('dateDebut', dateDebut);
      if (dateFin) params.set('dateFin', dateFin);
      const data = await fetchWithAuth(`/absences?${params}`);
      setAbsences(data.absences || []);
      setStats(data.stats || stats);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      console.error('Erreur chargement absences', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReferences();
  }, []);

  useEffect(() => {
    loadAbsences();
  }, [page, search, classeFilter, typeFilter, dateDebut, dateFin]);

  useEffect(() => {
    const handler = () => loadAbsences();
    window.addEventListener('sync-complete', handler);
    return () => window.removeEventListener('sync-complete', handler);
  }, [page, search, classeFilter, typeFilter, dateDebut, dateFin]);

  const classeEleves = useMemo(
    () => (form.classeId ? eleves.filter((e) => e.classe?.id === form.classeId || e.inscriptions?.[0]?.classeId === form.classeId) : eleves),
    [eleves, form.classeId]
  );

  const filteredEleves = useMemo(() => {
    if (!eleveSearch) return classeEleves;
    const q = eleveSearch.toLowerCase();
    return classeEleves.filter((e) =>
      (e.nom || '').toLowerCase().includes(q) ||
      (e.prenom || '').toLowerCase().includes(q) ||
      (e.matricule || '').toLowerCase().includes(q)
    );
  }, [classeEleves, eleveSearch]);

  const loadBulkEleves = async (classeId) => {
    if (!classeId) { setBulkEleves([]); return; }
    try {
      const data = await fetchWithAuth(`/eleves?page=1&limit=10000&classeId=${classeId}`);
      setBulkEleves(data.eleves || []);
    } catch (err) {
      console.error('Erreur chargement élèves de la classe', err);
    }
  };

  const openAdd = () => {
    setForm(emptyForm);
    setEleveSearch('');
    setModal('add');
  };

  const openBulk = () => {
    setBulkForm(bulkEmpty);
    setBulkEleves([]);
    setBulkAll(false);
    setModal('bulk');
  };

  const openEdit = (a) => {
    setForm({
      eleveId: a.eleveId,
      classeId: a.classeId || '',
      matiereId: a.matiereId || '',
      date: new Date(a.date).toISOString().slice(0, 10),
      type: a.type,
      motif: a.motif || '',
      justifie: a.justifie,
      statutJustificatif: a.statutJustificatif || 'non_justifie',
    });
    setEleveSearch('');
    setModal({ id: a.id });
  };

  const closeModal = () => {
    setModal(null);
    setEleveSearch('');
    setBulkAll(false);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const save = async () => {
    if (!form.eleveId || !form.date) return;
    try {
      const payload = { ...form, matiereId: form.matiereId || undefined, motif: form.motif || undefined };
      if (modal === 'add') {
        const result = await fetchWithAuth('/absences', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (result?._pending) {
          const tempItem = { id: result.tempId, ...payload, _pending: true, justifie: false, statutJustificatif: 'non_justifie', eleve: { nom: '?', prenom: 'Hors ligne', matricule: '—' }, classe: { nom: '' }, matiere: null };
          setAbsences(prev => [tempItem, ...prev]);
          setStats(prev => ({ ...prev, totalAbsences: prev.totalAbsences + 1, enAttente: prev.enAttente + 1 }));
          closeModal();
          return;
        }
      } else {
        await fetchWithAuth(`/absences/${modal.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }
      closeModal();
      loadAbsences();
    } catch (err) {
      console.error('Erreur sauvegarde absence', err);
      alert('Erreur : ' + err.message);
    }
  };

  const saveBulk = async () => {
    if (!bulkForm.classeId || !bulkForm.date || bulkForm.eleveIds.length === 0) {
      alert(t('absences.bulkNeedSelection'));
      return;
    }
    try {
      const result = await fetchWithAuth('/absences/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...bulkForm, matiereId: bulkForm.matiereId || undefined, motif: bulkForm.motif || undefined }),
      });
      if (result?._pending) {
        const temps = bulkForm.eleveIds.map((eid, i) => ({ id: `${result.tempId}-${i}`, eleveId: eid, classeId: bulkForm.classeId, date: bulkForm.date, type: bulkForm.type, motif: bulkForm.motif, _pending: true, justifie: false, statutJustificatif: 'non_justifie', eleve: { nom: '?', prenom: 'Hors ligne', matricule: '—' }, classe: { nom: '' }, matiere: null }));
        setAbsences(prev => [...temps, ...prev]);
        setStats(prev => ({ ...prev, totalAbsences: prev.totalAbsences + temps.length, enAttente: prev.enAttente + temps.length }));
        closeModal();
        return;
      }
      closeModal();
      loadAbsences();
    } catch (err) {
      console.error('Erreur absence multiple', err);
      alert('Erreur : ' + err.message);
    }
  };

  const remove = async (id) => {
    if (!confirm(t('absences.deleteConfirm'))) return;
    try {
      await fetchWithAuth(`/absences/${id}`, { method: 'DELETE' });
      loadAbsences();
    } catch (err) {
      console.error('Erreur suppression absence', err);
      alert('Erreur : ' + err.message);
    }
  };

  const toggleBulkEleve = (id) => {
    setBulkForm(prev => ({
      ...prev,
      eleveIds: prev.eleveIds.includes(id)
        ? prev.eleveIds.filter(x => x !== id)
        : [...prev.eleveIds, id],
    }));
  };

  const statCards = [
    { label: t('absences.statAbsences'), value: stats.totalAbsences, color: T.red, icon: UserX },
    { label: t('absences.statRetards'), value: stats.totalRetards, color: T.orange, icon: Clock },
    { label: t('absences.statJustifies'), value: stats.justifies, color: T.green, icon: CheckCircle2 },
    { label: t('absences.statEnAttente'), value: stats.enAttente, color: T.purple, icon: CalendarX },
  ];

  return (
    <div className="fade-up">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 style={{ fontFamily: "'Fraunces', serif", fontWeight: 900, fontSize: 24, color: T.text }}>{t('absences.title')}</h1>
          <p style={{ fontSize: 13, color: T.muted, marginTop: 2 }}>{t('absences.subtitle', { count: total })}</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button onClick={() => downloadExcel('/absences/export', 'absences.xlsx')} style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '10px 14px',
            background: T.card, border: `1px solid ${T.border}`, borderRadius: 10,
            color: T.muted, cursor: 'pointer', fontSize: 12,
          }}>
            <Download size={14} /> Excel
          </button>
          <button onClick={openBulk} style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px',
            background: T.card, border: `1px solid ${T.blue}60`, borderRadius: 10, color: T.blue,
            cursor: 'pointer', fontSize: 13, fontWeight: 600,
          }}>
            <UserX size={15} /> {t('absences.bulkButton')}
          </button>
          <button onClick={openAdd} style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px',
            background: T.accent, border: 'none', borderRadius: 10, color: '#fff',
            cursor: 'pointer', fontSize: 13, fontWeight: 600,
          }}>
            <Plus size={15} /> {t('absences.newAbsence')}
          </button>
        </div>
      </div>

      {/* Statistiques */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
        {statCards.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: 16, flex: '1 1 160px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: s.color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={14} color={s.color} />
                </div>
                <div style={{ fontSize: 11, color: T.muted }}>{s.label}</div>
              </div>
              <div style={{ fontFamily: "'Fraunces', serif", fontSize: 24, fontWeight: 900, color: s.color }}>{s.value}</div>
            </div>
          );
        })}
      </div>

      {/* Filtres */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '8px 14px', flex: '2 1 220px' }}>
          <Search size={14} color={T.muted} />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder={t('absences.searchPlaceholder')}
            style={{ background: 'transparent', border: 'none', outline: 'none', color: T.text, fontSize: 13, width: '100%' }}
          />
        </div>
        <select value={classeFilter} onChange={e => { setClasseFilter(e.target.value); setPage(1); }} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '8px 12px', color: T.text, fontSize: 13, outline: 'none', cursor: 'pointer' }}>
          <option value="">{t('absences.allClasses')}</option>
          {classes.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
        </select>
        <select value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1); }} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '8px 12px', color: T.text, fontSize: 13, outline: 'none', cursor: 'pointer' }}>
          <option value="tous">{t('absences.allTypes')}</option>
          <option value="absence">{t('absences.typeAbsence')}</option>
          <option value="retard">{t('absences.typeRetard')}</option>
        </select>
        <input type="date" value={dateDebut} onChange={e => { setDateDebut(e.target.value); setPage(1); }} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '8px 12px', color: T.text, fontSize: 13, outline: 'none' }} />
        <input type="date" value={dateFin} onChange={e => { setDateFin(e.target.value); setPage(1); }} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '8px 12px', color: T.text, fontSize: 13, outline: 'none' }} />
      </div>

      {/* Tableau */}
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: T.muted }}>{t('common.loading')}</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#0a1624' }}>
                {[t('absences.headers.date'), t('absences.headers.eleve'), t('absences.headers.classe'), t('absences.headers.matiere'), t('absences.headers.type'), t('absences.headers.statut'), t('absences.headers.actions')].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '13px 16px', fontSize: 10, color: T.muted, fontWeight: 700, letterSpacing: '0.08em', borderBottom: `1px solid ${T.border}` }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {absences.length === 0 ? (
                <tr><td colSpan="7" style={{ padding: 40, textAlign: 'center', color: T.muted }}>{t('absences.noAbsenceFound')}</td></tr>
              ) : (
                absences.map((a, idx) => (
                  <tr key={a.id} style={{ borderBottom: `1px solid ${T.border}20`, background: idx % 2 ? '#0a1624' : 'transparent' }}>
                    <td style={{ padding: '12px 16px', fontSize: 12, color: T.muted }}>
                      {new Date(a.date).toLocaleDateString('fr-FR')}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: T.text, fontWeight: 500 }}>
                      {a.eleve?.prenom} {a.eleve?.nom}
                      <div style={{ fontSize: 10, color: T.muted }}>{a.eleve?.matricule}</div>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 12, color: T.muted }}>{a.classe?.nom || '—'}</td>
                    <td style={{ padding: '12px 16px', fontSize: 12, color: T.muted }}>{a.matiere?.libelle || '—'}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        fontSize: 11, padding: '3px 8px', borderRadius: 6,
                        background: a.type === 'absence' ? T.red + '20' : T.orange + '20',
                        color: a.type === 'absence' ? T.red : T.orange,
                        border: `1px solid ${a.type === 'absence' ? T.red : T.orange}30`,
                      }}>
                        {a.type === 'absence' ? t('absences.typeAbsence') : t('absences.typeRetard')}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        fontSize: 11, padding: '3px 8px', borderRadius: 6,
                        background: a.justifie ? T.green + '20' : T.border,
                        color: a.justifie ? T.green : T.muted,
                        border: `1px solid ${a.justifie ? T.green : T.border}30`,
                      }}>
                        {a.justifie ? t('absences.justifie') : t('absences.nonJustifie')}
                      </span>
                      {a.statutJustificatif === 'en_attente' && (
                        <span style={{ fontSize: 10, color: T.orange, display: 'block', marginTop: 3 }}>{t('absences.enAttente')}</span>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        {a._pending && <PendingBadge />}
                        <button onClick={() => openEdit(a)} style={{ width: 30, height: 30, borderRadius: 7, background: T.accent + '15', border: `1px solid ${T.accent}30`, cursor: 'pointer' }}>
                          <Edit2 size={12} color={T.accent} />
                        </button>
                        <button onClick={() => remove(a.id)} style={{ width: 30, height: 30, borderRadius: 7, background: T.red + '15', border: `1px solid ${T.red}30`, cursor: 'pointer' }}>
                          <Trash2 size={12} color={T.red} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
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
      {modal && modal !== 'bulk' && (
        <div style={{ position: 'fixed', inset: 0, background: '#000000a0', display: 'flex', zIndex: 200, overflow: 'auto', padding: 20 }}>
          <div style={{ background: '#0c1c2c', border: `1px solid ${T.border}`, borderRadius: 16, padding: 28, width: 560, maxHeight: 'none', margin: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
              <h2 style={{ fontFamily: "'Fraunces', serif", fontWeight: 700, fontSize: 17, color: T.text }}>
                {modal === 'add' ? t('absences.newAbsence') : t('absences.editAbsence')}
              </h2>
              <button onClick={closeModal} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.muted }}><X size={18} /></button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ fontSize: 11, color: T.muted }}>{t('absences.eleve')} *</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, padding: '6px 10px', marginTop: 4 }}>
                  <Search size={12} color={T.muted} />
                  <input
                    value={eleveSearch}
                    onChange={e => setEleveSearch(e.target.value)}
                    placeholder={t('absences.searchEleve')}
                    style={{ background: 'transparent', border: 'none', outline: 'none', color: T.text, fontSize: 12, width: '100%' }}
                  />
                </div>
                <select name="eleveId" value={form.eleveId} onChange={handleFormChange} style={{ width: '100%', background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 12px', color: T.text, marginTop: 6 }}>
                  <option value="">{t('absences.selectEleve')}</option>
                  {filteredEleves.map(e => (
                    <option key={e.id} value={e.id}>{e.prenom} {e.nom} — {e.matricule}</option>
                  ))}
                </select>
              </div>
              <div><label style={{ fontSize: 11, color: T.muted }}>{t('absences.date')} *</label><input name="date" type="date" value={form.date} onChange={handleFormChange} style={{ width: '100%', background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 12px', color: T.text }} /></div>
              <div><label style={{ fontSize: 11, color: T.muted }}>{t('absences.type')} *</label><select name="type" value={form.type} onChange={handleFormChange} style={{ width: '100%', background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 12px', color: T.text }}><option value="absence">{t('absences.typeAbsence')}</option><option value="retard">{t('absences.typeRetard')}</option></select></div>
              <div><label style={{ fontSize: 11, color: T.muted }}>{t('absences.classe')}</label><select name="classeId" value={form.classeId} onChange={handleFormChange} style={{ width: '100%', background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 12px', color: T.text }}><option value="">{t('absences.auto')}</option>{classes.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}</select></div>
              <div><label style={{ fontSize: 11, color: T.muted }}>{t('absences.matiere')}</label><select name="matiereId" value={form.matiereId} onChange={handleFormChange} style={{ width: '100%', background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 12px', color: T.text }}><option value="">{t('absences.none')}</option>{matieres.map(m => <option key={m.id} value={m.id}>{m.libelle}</option>)}</select></div>
              <div><label style={{ fontSize: 11, color: T.muted }}>{t('absences.motif')}</label><input name="motif" value={form.motif} onChange={handleFormChange} style={{ width: '100%', background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 12px', color: T.text }} /></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 18 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: T.text, cursor: 'pointer' }}>
                  <input type="checkbox" checked={form.justifie} onChange={e => {
                    const justifie = e.target.checked;
                    setForm(prev => ({ ...prev, justifie, statutJustificatif: justifie ? 'justifie' : prev.statutJustificatif }));
                  }} style={{ accentColor: T.green }} />
                  {t('absences.justifie')}
                </label>
              </div>
              {modal !== 'add' && (
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: 11, color: T.muted }}>{t('absences.statutJustificatif')}</label>
                  <select name="statutJustificatif" value={form.statutJustificatif} onChange={handleFormChange} style={{ width: '100%', background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 12px', color: T.text, marginTop: 4 }}>
                    <option value="non_justifie">{t('absences.nonJustifie')}</option>
                    <option value="en_attente">{t('absences.enAttente')}</option>
                    <option value="justifie">{t('absences.justifie')}</option>
                  </select>
                </div>
              )}
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

      {/* Modal Bulk */}
      {modal === 'bulk' && (
        <div style={{ position: 'fixed', inset: 0, background: '#000000a0', display: 'flex', zIndex: 200, overflow: 'auto', padding: 20 }}>
          <div style={{ background: '#0c1c2c', border: `1px solid ${T.border}`, borderRadius: 16, padding: 28, width: 620, maxHeight: 'none', margin: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
              <h2 style={{ fontFamily: "'Fraunces', serif", fontWeight: 700, fontSize: 17, color: T.text }}>{t('absences.bulkTitle')}</h2>
              <button onClick={closeModal} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.muted }}><X size={18} /></button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div>
                <label style={{ fontSize: 11, color: T.muted }}>{t('absences.classe')} *</label>
                <select value={bulkForm.classeId} onChange={e => { const v = e.target.value; setBulkForm(prev => ({ ...prev, classeId: v, eleveIds: [] })); setBulkAll(false); loadBulkEleves(v); }} style={{ width: '100%', background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 12px', color: T.text, marginTop: 4 }}>
                  <option value="">{t('absences.selectClasse')}</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
                </select>
              </div>
              <div><label style={{ fontSize: 11, color: T.muted }}>{t('absences.date')} *</label><input type="date" value={bulkForm.date} onChange={e => setBulkForm(prev => ({ ...prev, date: e.target.value }))} style={{ width: '100%', background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 12px', color: T.text, marginTop: 4 }} /></div>
              <div><label style={{ fontSize: 11, color: T.muted }}>{t('absences.type')} *</label><select value={bulkForm.type} onChange={e => setBulkForm(prev => ({ ...prev, type: e.target.value }))} style={{ width: '100%', background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 12px', color: T.text, marginTop: 4 }}><option value="absence">{t('absences.typeAbsence')}</option><option value="retard">{t('absences.typeRetard')}</option></select></div>
              <div><label style={{ fontSize: 11, color: T.muted }}>{t('absences.matiere')}</label><select value={bulkForm.matiereId} onChange={e => setBulkForm(prev => ({ ...prev, matiereId: e.target.value }))} style={{ width: '100%', background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 12px', color: T.text, marginTop: 4 }}><option value="">{t('absences.none')}</option>{matieres.map(m => <option key={m.id} value={m.id}>{m.libelle}</option>)}</select></div>
              <div style={{ gridColumn: '1 / -1' }}><label style={{ fontSize: 11, color: T.muted }}>{t('absences.motif')}</label><input value={bulkForm.motif} onChange={e => setBulkForm(prev => ({ ...prev, motif: e.target.value }))} style={{ width: '100%', background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 12px', color: T.text, marginTop: 4 }} /></div>
            </div>

            {bulkForm.classeId && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div style={{ fontSize: 12, color: T.muted }}>{bulkEleves.length} {t('absences.elevesInClasse')}</div>
                  <button onClick={() => {
                    const all = bulkAll ? [] : bulkEleves.map(e => e.id);
                    setBulkAll(!bulkAll);
                    setBulkForm(prev => ({ ...prev, eleveIds: all }));
                  }} style={{ fontSize: 12, color: T.accent, background: 'transparent', border: 'none', cursor: 'pointer' }}>
                    {bulkAll ? t('absences.deselectAll') : t('absences.selectAll')}
                  </button>
                </div>
                <div style={{ maxHeight: 260, overflowY: 'auto', border: `1px solid ${T.border}`, borderRadius: 10, padding: 6, marginBottom: 8 }}>
                  {bulkEleves.map(e => {
                    const checked = bulkForm.eleveIds.includes(e.id);
                    return (
                      <label key={e.id} style={{
                        display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px', borderRadius: 8, cursor: 'pointer',
                        background: checked ? T.red + '12' : 'transparent',
                        border: checked ? `1px solid ${T.red}35` : '1px solid transparent',
                      }}>
                        <input type="checkbox" checked={checked} onChange={() => toggleBulkEleve(e.id)} style={{ accentColor: T.red }} />
                        <span style={{ fontSize: 13, color: T.text, flex: 1 }}>{e.prenom} {e.nom}</span>
                        <span style={{ fontSize: 11, color: T.muted }}>{e.matricule}</span>
                      </label>
                    );
                  })}
                </div>
                <div style={{ fontSize: 11, color: T.muted }}>{bulkForm.eleveIds.length} {t('absences.eleveSelectionne', { count: bulkForm.eleveIds.length })}</div>
              </>
            )}

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
              <button onClick={closeModal} style={{ padding: '9px 18px', borderRadius: 9, background: 'transparent', border: `1px solid ${T.border}`, color: T.muted, cursor: 'pointer' }}>{t('common.cancel')}</button>
              <button onClick={saveBulk} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px', borderRadius: 9, background: T.red, border: 'none', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>
                <Check size={14} /> {t('absences.bulkSave')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
