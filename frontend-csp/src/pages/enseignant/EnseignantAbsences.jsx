import { useState, useEffect } from 'react';
import { useEnseignant } from '../../context/EnseignantContext';
import { fetchWithAuth } from '../../api/fetchWithAuth';
import { useAcademicYear } from '../../context/AcademicYearContext';
import { CalendarX, Plus, Trash2, Loader, X } from 'lucide-react';

const T = {
  card: '#0c1c2c', border: '#1a3050', accent: '#d4921a',
  green: '#1d9468', red: '#b83838', blue: '#2878c8',
  text: '#ddd0b8', muted: '#486070', bg: '#06101a',
};

const selectStyle = {
  background: T.card, color: T.text, border: `1px solid ${T.border}`,
  borderRadius: 8, padding: '9px 10px', fontSize: 13, cursor: 'pointer',
};

const inputStyle = {
  width: '100%', background: T.bg, border: `1px solid ${T.border}`,
  borderRadius: 8, padding: '7px 8px', color: T.text, boxSizing: 'border-box',
};

const fmtDate = (d) => new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });

export default function EnseignantAbsences() {
  const { classes, affectations } = useEnseignant();
  const { currentYear } = useAcademicYear();
  const [classeId, setClasseId] = useState('');
  const [type, setType] = useState('tous');
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [absences, setAbsences] = useState([]);
  const [stats, setStats] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ classeId: '', eleveId: '', date: new Date().toISOString().split('T')[0], type: 'absence', matiereId: '', motif: '' });
  const [eleves, setEleves] = useState([]);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  const load = async (p = page) => {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (currentYear?.name) q.set('anneeScolaire', currentYear.name);
      if (classeId) q.set('classeId', classeId);
      if (type && type !== 'tous') q.set('type', type);
      if (dateDebut) q.set('dateDebut', dateDebut);
      if (dateFin) q.set('dateFin', dateFin);
      q.set('page', p);
      q.set('limit', '15');
      const d = await fetchWithAuth(`/prof/absences?${q.toString()}`);
      setAbsences(d.absences || []);
      setStats(d.stats);
      setTotalPages(d.totalPages || 1);
    } catch (err) { setMsg({ type: 'error', text: err.message }); }
    setLoading(false);
  };

  useEffect(() => { load(1); setPage(1); }, [classeId, type, dateDebut, dateFin, currentYear]);

  useEffect(() => { if (!form.classeId) return; fetchWithAuth(`/prof/eleves?classeId=${form.classeId}`).then(d => setEleves(d.eleves || [])).catch(() => {}); }, [form.classeId]);

  const createAbsence = async () => {
    if (!form.eleveId || !form.date) return;
    setSaving(true);
    setMsg(null);
    try {
      await fetchWithAuth('/prof/absences', {
        method: 'POST',
        body: JSON.stringify({
          eleveId: form.eleveId,
          classeId: form.classeId || undefined,
          matiereId: form.matiereId || undefined,
          date: form.date,
          type: form.type,
          motif: form.motif || undefined,
        }),
      });
      setMsg({ type: 'ok', text: `${form.type === 'absence' ? 'Absence' : 'Retard'} signalé(e) — les parents ont été notifiés` });
      setShowForm(false);
      setForm({ classeId: '', eleveId: '', date: new Date().toISOString().split('T')[0], type: 'absence', matiereId: '', motif: '' });
      setEleves([]);
      load(page);
    } catch (err) { setMsg({ type: 'error', text: err.message }); }
    setSaving(false);
  };

  const remove = async (id) => {
    if (!confirm('Supprimer cet enregistrement ?')) return;
    try {
      await fetchWithAuth(`/prof/absences/${id}`, { method: 'DELETE' });
      load(page);
    } catch (err) { setMsg({ type: 'error', text: err.message }); }
  };

  const matieresForForm = affectations.filter((a) => a.classe.id === form.classeId);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18, justifyContent: 'space-between', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: T.accent + '20', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CalendarX size={18} color={T.accent} />
          </div>
          <div>
            <div style={{ fontFamily: "'Fraunces', serif", fontSize: 18, fontWeight: 900 }}>Absences & retards</div>
            {stats && (
              <div style={{ fontSize: 12, color: T.muted }}>
                {stats.totalAbsences} absences · {stats.totalRetards} retards · {stats.justifies} justifiés
              </div>
            )}
          </div>
        </div>
        <button onClick={() => setShowForm(s => !s)} style={{
          display: 'flex', alignItems: 'center', gap: 6, background: T.accent, border: 'none',
          borderRadius: 8, padding: '9px 14px', color: '#fff', cursor: 'pointer', fontWeight: 600,
        }}>
          {showForm ? <X size={14} /> : <Plus size={14} />} {showForm ? 'Fermer' : 'Signaler'}
        </button>
      </div>

      {msg && (
        <div style={{
          padding: '10px 14px', borderRadius: 8, marginBottom: 14, fontSize: 13,
          background: msg.type === 'ok' ? T.green + '15' : T.red + '15',
          color: msg.type === 'ok' ? T.green : T.red,
          border: `1px solid ${msg.type === 'ok' ? T.green : T.red}40`,
        }}>{msg.text}</div>
      )}

      {showForm && (
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: 18, marginBottom: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Signaler une absence ou un retard</div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <select value={form.classeId} onChange={(e) => setForm({ ...form, classeId: e.target.value, eleveId: '', matiereId: '' })} style={{ ...selectStyle, flex: '1 1 160px' }}>
              <option value="">Classe…</option>
              {classes.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
            </select>
            <select value={form.eleveId} onChange={(e) => setForm({ ...form, eleveId: e.target.value })} style={{ ...selectStyle, flex: '1 1 180px' }}>
              <option value="">Élève…</option>
              {eleves.map((e) => <option key={e.id} value={e.id}>{e.nom} {e.prenom}</option>)}
            </select>
            <select value={form.matiereId} onChange={(e) => setForm({ ...form, matiereId: e.target.value })} style={{ ...selectStyle, flex: '1 1 150px' }}>
              <option value="">Matière…</option>
              {matieresForForm.map((a) => <option key={a.matiere.id} value={a.matiere.id}>{a.matiere.libelle}</option>)}
            </select>
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} style={{ ...selectStyle, flex: '0 1 120px' }}>
              <option value="absence">Absence</option>
              <option value="retard">Retard</option>
            </select>
            <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} style={{ ...inputStyle, flex: '0 1 150px' }} />
            <input value={form.motif} placeholder="Motif (optionnel)" onChange={(e) => setForm({ ...form, motif: e.target.value })} style={{ ...inputStyle, flex: '2 1 200px' }} />
            <button onClick={createAbsence} disabled={saving || !form.eleveId || !form.date} style={{
              display: 'flex', alignItems: 'center', gap: 6, background: T.accent, border: 'none',
              borderRadius: 8, padding: '9px 16px', color: '#fff', cursor: 'pointer', fontWeight: 600,
            }}>
              {saving ? <Loader size={14} /> : <Plus size={14} />} Enregistrer
            </button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 18 }}>
        <select value={classeId} onChange={(e) => setClasseId(e.target.value)} style={{ ...selectStyle, flex: '1 1 160px' }}>
          <option value="">Toutes mes classes</option>
          {classes.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
        </select>
        <select value={type} onChange={(e) => setType(e.target.value)} style={{ ...selectStyle, flex: '0 1 140px' }}>
          <option value="tous">Tous les types</option>
          <option value="absence">Absences</option>
          <option value="retard">Retards</option>
        </select>
        <input type="date" value={dateDebut} onChange={(e) => setDateDebut(e.target.value)} style={{ ...inputStyle, flex: '0 1 150px' }} />
        <input type="date" value={dateFin} onChange={(e) => setDateFin(e.target.value)} style={{ ...inputStyle, flex: '0 1 150px' }} />
      </div>

      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, overflow: 'hidden' }}>
        {loading && absences.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: T.muted }}>Chargement...</div>
        ) : absences.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: T.muted }}>Aucun enregistrement.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#0a1624' }}>
                  <th style={{ padding: 12, textAlign: 'left' }}>Date</th>
                  <th style={{ padding: 12, textAlign: 'left' }}>Élève</th>
                  <th style={{ padding: 12, textAlign: 'left' }}>Classe</th>
                  <th style={{ padding: 12, textAlign: 'left' }}>Matière</th>
                  <th style={{ padding: 12, textAlign: 'left' }}>Type</th>
                  <th style={{ padding: 12, textAlign: 'left' }}>Statut</th>
                  <th style={{ padding: 12 }}></th>
                </tr>
              </thead>
              <tbody>
                {absences.map((a, idx) => (
                  <tr key={a.id} style={{ borderBottom: `1px solid ${T.border}30`, background: idx % 2 ? '#0a1624' : 'transparent' }}>
                    <td style={{ padding: 12, fontSize: 13 }}>{fmtDate(a.date)}</td>
                    <td style={{ padding: 12, fontSize: 13 }}>{a.eleve.nom} {a.eleve.prenom}</td>
                    <td style={{ padding: 12, fontSize: 13 }}>{a.classe?.nom || '—'}</td>
                    <td style={{ padding: 12, fontSize: 13 }}>{a.matiere?.libelle || '—'}</td>
                    <td style={{ padding: 12 }}>
                      <span style={{
                        fontSize: 11, padding: '2px 8px', borderRadius: 6,
                        background: (a.type === 'absence' ? T.red : T.blue) + '20',
                        color: a.type === 'absence' ? T.red : T.blue,
                      }}>{a.type === 'absence' ? 'Absence' : 'Retard'}</span>
                    </td>
                    <td style={{ padding: 12, fontSize: 12, color: a.justifie ? T.green : T.muted }}>
                      {a.justifie ? 'Justifié' : a.statutJustificatif === 'en_attente' ? 'En attente' : 'Non justifié'}
                    </td>
                    <td style={{ padding: 12, textAlign: 'center' }}>
                      <button onClick={() => remove(a.id)} style={{ background: T.red + '20', border: 'none', borderRadius: 6, padding: '4px 8px', cursor: 'pointer' }}>
                        <Trash2 size={12} color={T.red} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
          <button disabled={page === 1} onClick={() => { const p = page - 1; setPage(p); load(p); }} style={{ padding: '6px 12px', borderRadius: 6, background: T.card, border: `1px solid ${T.border}`, cursor: 'pointer', color: T.text }}>Précédent</button>
          <span style={{ padding: '6px 12px', color: T.muted }}>Page {page} / {totalPages}</span>
          <button disabled={page === totalPages} onClick={() => { const p = page + 1; setPage(p); load(p); }} style={{ padding: '6px 12px', borderRadius: 6, background: T.card, border: `1px solid ${T.border}`, cursor: 'pointer', color: T.text }}>Suivant</button>
        </div>
      )}
    </div>
  );
}
