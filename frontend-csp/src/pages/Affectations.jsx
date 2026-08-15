import { useState, useEffect } from 'react';
import { Plus, Trash2, X, Check, Users } from 'lucide-react';
import { fetchWithAuth } from '../api/fetchWithAuth';

const T = {
  card: '#0c1c2c', border: '#1a3050', accent: '#d4921a',
  green: '#1d9468', red: '#b83838', blue: '#2878c8',
  text: '#ddd0b8', muted: '#486070', bg: '#06101a',
};

const selectStyle = {
  background: T.bg, color: T.text, border: `1px solid ${T.border}`,
  borderRadius: 8, padding: '8px', fontSize: 13, marginBottom: 12, width: '100%', boxSizing: 'border-box',
};

export default function Affectations() {
  const [affectations, setAffectations] = useState([]);
  const [enseignants, setEnseignants] = useState([]);
  const [classes, setClasses] = useState([]);
  const [matieres, setMatieres] = useState([]);
  const [enseignantFilter, setEnseignantFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ enseignantId: '', classeId: '', matiereId: '' });
  const [msg, setMsg] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const q = enseignantFilter ? `?enseignantId=${enseignantFilter}` : '';
      const data = await fetchWithAuth(`/affectations${q}`);
      setAffectations(data.affectations || []);
    } catch (err) { setMsg({ type: 'error', text: err.message }); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [enseignantFilter]);

  useEffect(() => {
    fetchWithAuth('/enseignants?page=1&limit=200').then(d => setEnseignants(d.enseignants || [])).catch(() => {});
    fetchWithAuth('/classes').then(d => setClasses(Array.isArray(d) ? d : d.classes || d.data || [])).catch(() => {});
    fetchWithAuth('/matieres').then(d => setMatieres(Array.isArray(d) ? d : d.matieres || d.data || [])).catch(() => {});
  }, []);

  const save = async () => {
    if (!form.enseignantId || !form.classeId || !form.matiereId) return;
    setMsg(null);
    try {
      await fetchWithAuth('/affectations', { method: 'POST', body: JSON.stringify(form) });
      setModal(false);
      setForm({ enseignantId: '', classeId: '', matiereId: '' });
      setMsg({ type: 'ok', text: 'Affectation créée' });
      load();
    } catch (err) { setMsg({ type: 'error', text: err.message }); }
  };

  const remove = async (id) => {
    if (!confirm('Supprimer cette affectation ?')) return;
    try {
      await fetchWithAuth(`/affectations/${id}`, { method: 'DELETE' });
      load();
    } catch (err) { setMsg({ type: 'error', text: err.message }); }
  };

  const nameOf = (id, list) => list.find(i => i.id === id);

  return (
    <div className="fade-up" style={{ paddingTop: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 10 }}>
        <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 24, color: T.text, marginTop: 0 }}>
          Affectations des enseignants
        </h1>
        <button onClick={() => setModal(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: T.accent, border: 'none', borderRadius: 8, padding: '8px 18px', color: '#fff', cursor: 'pointer' }}>
          <Plus size={15} /> Nouvelle affectation
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

      <div style={{ marginBottom: 20 }}>
        <select value={enseignantFilter} onChange={e => setEnseignantFilter(e.target.value)} style={{ ...selectStyle, width: 320 }}>
          <option value="">Tous les enseignants</option>
          {enseignants.map(e => <option key={e.id} value={e.id}>{e.nom} {e.prenom}</option>)}
        </select>
      </div>

      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: T.muted }}>Chargement...</div>
        ) : affectations.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: T.muted }}>
            <Users size={24} style={{ marginBottom: 8 }} />
            <div>Aucune affectation. Assignez un enseignant à une classe et une matière.</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#0a1624' }}>
                  <th style={{ padding: 12, textAlign: 'left' }}>Enseignant</th>
                  <th style={{ padding: 12, textAlign: 'left' }}>Classe</th>
                  <th style={{ padding: 12, textAlign: 'left' }}>Matière</th>
                  <th style={{ padding: 12, textAlign: 'left' }}>Statut</th>
                  <th style={{ padding: 12 }}></th>
                </tr>
              </thead>
              <tbody>
                {affectations.map((a, idx) => (
                  <tr key={a.id} style={{ borderBottom: `1px solid ${T.border}30`, background: idx % 2 ? '#0a1624' : 'transparent' }}>
                    <td style={{ padding: 12 }}>{a.enseignant.nom} {a.enseignant.prenom}</td>
                    <td style={{ padding: 12 }}>{a.classe.nom}</td>
                    <td style={{ padding: 12 }}>{a.matiere.libelle}</td>
                    <td style={{ padding: 12 }}>
                      <span style={{
                        fontSize: 11, padding: '2px 8px', borderRadius: 6,
                        background: (a.isActive ? T.green : T.red) + '20',
                        color: a.isActive ? T.green : T.red,
                      }}>{a.isActive ? 'Active' : 'Inactive'}</span>
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

      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: '#000000a0', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 9999, overflowY: 'auto', paddingTop: 80, paddingBottom: 40 }}>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, padding: 24, width: 420, maxWidth: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ margin: 0, color: T.text, fontSize: 17 }}>Nouvelle affectation</h2>
              <button onClick={() => setModal(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: T.text }}><X size={20} /></button>
            </div>

            <select value={form.enseignantId} onChange={e => setForm({ ...form, enseignantId: e.target.value })} style={selectStyle}>
              <option value="">Enseignant…</option>
              {enseignants.map(e => <option key={e.id} value={e.id}>{e.nom} {e.prenom}</option>)}
            </select>
            <select value={form.classeId} onChange={e => setForm({ ...form, classeId: e.target.value })} style={selectStyle}>
              <option value="">Classe…</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
            </select>
            <select value={form.matiereId} onChange={e => setForm({ ...form, matiereId: e.target.value })} style={selectStyle}>
              <option value="">Matière…</option>
              {matieres.map(m => <option key={m.id} value={m.id}>{m.libelle}</option>)}
            </select>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setModal(false)} style={{ padding: '8px 16px', background: 'transparent', border: `1px solid ${T.border}`, borderRadius: 8, color: T.muted, cursor: 'pointer' }}>Annuler</button>
              <button onClick={save} style={{ padding: '8px 16px', background: T.accent, border: 'none', borderRadius: 8, color: '#fff', cursor: 'pointer' }}>
                <Check size={14} style={{ marginRight: 6 }} /> Créer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
