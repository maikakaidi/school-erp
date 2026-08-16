import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit, Filter, CreditCard } from 'lucide-react';
import { fetchWithAuth } from '../api/fetchWithAuth';
import PendingBadge from '../components/PendingBadge';
import { useTranslation } from 'react-i18next';

const T = {
  bg: '#06101a', card: '#0c1c2c', border: '#1a3050', accent: '#d4921a',
  blue: '#2878c8', green: '#1d9468', red: '#b83838', text: '#ddd0b8', muted: '#486070',
};

const RUBRIQUES = ['Salaires', 'Loyer', 'Eau/Electricite', 'Fournitures', 'Entretien', 'Transport', 'Divers'];

export default function Depenses() {
  const { t } = useTranslation();
  const [depenses, setDepenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [filter, setFilter] = useState({ rubrique: '', startDate: '', endDate: '' });
  const [form, setForm] = useState({ libelle: '', montant: '', rubrique: 'Divers', dateDepense: new Date().toISOString().split('T')[0] });

  useEffect(() => { load(); }, [filter]);

  useEffect(() => {
    const handler = () => load();
    window.addEventListener('sync-complete', handler);
    return () => window.removeEventListener('sync-complete', handler);
  }, [filter]);

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter.rubrique) params.set('rubrique', filter.rubrique);
      if (filter.startDate) params.set('startDate', filter.startDate);
      if (filter.endDate) params.set('endDate', filter.endDate);
      const data = await fetchWithAuth(`/depenses?${params}`);
      setDepenses(data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const body = { ...form, montant: parseFloat(form.montant) };
      if (editing) {
        await fetchWithAuth(`/depenses/${editing.id}`, { method: 'PUT', body: JSON.stringify(body) });
      } else {
        const result = await fetchWithAuth('/depenses', { method: 'POST', body: JSON.stringify(body) });
        if (result?._pending) {
          const tempItem = { id: result.tempId, ...body, _pending: true };
          setDepenses(prev => [tempItem, ...prev]);
          setShowForm(false); setEditing(null);
          setForm({ libelle: '', montant: '', rubrique: 'Divers', dateDepense: new Date().toISOString().split('T')[0] });
          return;
        }
      }
      setShowForm(false); setEditing(null);
      setForm({ libelle: '', montant: '', rubrique: 'Divers', dateDepense: new Date().toISOString().split('T')[0] });
      load();
    } catch (e) { alert(e.message); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Supprimer cette depense ?')) return;
    try { await fetchWithAuth(`/depenses/${id}`, { method: 'DELETE' }); load(); } catch (e) { alert(e.message); }
  };

  const total = depenses.reduce((s, d) => s + d.montant, 0);

  const rubriqueTotals = {};
  depenses.forEach(d => { rubriqueTotals[d.rubrique] = (rubriqueTotals[d.rubrique] || 0) + d.montant; });

  return (
    <div style={{ padding: '32px 0', color: T.text }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 24, fontWeight: 900 }}>{t('menu.depenses')}</h1>
          <p style={{ fontSize: 12, color: T.muted, marginTop: 4 }}>Suivi des depenses de l'etablissement</p>
        </div>
        <button onClick={() => { setShowForm(true); setEditing(null); setForm({ libelle: '', montant: '', rubrique: 'Divers', dateDepense: new Date().toISOString().split('T')[0] }); }}
          style={{ background: T.green, border: 'none', borderRadius: 8, padding: '8px 16px', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Plus size={14} /> Nouvelle depense
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 24 }}>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 16 }}>
          <div style={{ fontSize: 22, fontFamily: "'Fraunces', serif", fontWeight: 900, color: T.red }}>{total.toLocaleString()} FCFA</div>
          <div style={{ fontSize: 11, color: T.muted }}>Total depenses</div>
        </div>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 16 }}>
          <div style={{ fontSize: 22, fontFamily: "'Fraunces', serif", fontWeight: 900, color: T.text }}>{depenses.length}</div>
          <div style={{ fontSize: 11, color: T.muted }}>Nombre de depenses</div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <select value={filter.rubrique} onChange={e => setFilter({ ...filter, rubrique: e.target.value })}
          style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '7px 12px', color: T.text, fontSize: 12 }}>
          <option value="">Toutes les rubriques</option>
          {RUBRIQUES.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <input type="date" value={filter.startDate} onChange={e => setFilter({ ...filter, startDate: e.target.value })}
          style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '7px 12px', color: T.text, fontSize: 12 }} />
        <input type="date" value={filter.endDate} onChange={e => setFilter({ ...filter, endDate: e.target.value })}
          style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '7px 12px', color: T.text, fontSize: 12 }} />
      </div>

      {/* Rubrique summary */}
      {Object.keys(rubriqueTotals).length > 0 && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
          {Object.entries(rubriqueTotals).sort((a, b) => b[1] - a[1]).map(([r, m]) => (
            <div key={r} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '6px 12px', fontSize: 11 }}>
              <span style={{ color: T.muted }}>{r}:</span> <span style={{ color: T.accent, fontWeight: 600 }}>{m.toLocaleString()} FCFA</span>
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, overflow: 'hidden' }}>
        <table width="100%" style={{ borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${T.border}` }}>
              {['Date', 'Libelle', 'Rubrique', 'Montant', 'Actions'].map(h => (
                <th key={h} style={{ padding: '10px 16px', fontSize: 10, color: T.muted, fontWeight: 700, letterSpacing: '0.07em', textAlign: 'left' }}>{h.toUpperCase()}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {depenses.map(d => (
              <tr key={d.id} style={{ borderBottom: `1px solid ${T.border}20` }}>
                <td style={{ padding: '10px 16px', fontSize: 12, color: T.muted }}>{new Date(d.dateDepense).toLocaleDateString('fr-FR')}</td>
                <td style={{ padding: '10px 16px', fontSize: 13, fontWeight: 500 }}>{d.libelle}</td>
                <td style={{ padding: '10px 16px' }}>
                  <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 12, background: T.accent + '20', color: T.accent }}>{d.rubrique}</span>
                </td>
                <td style={{ padding: '10px 16px', fontSize: 13, color: T.red, fontWeight: 600 }}>{d.montant.toLocaleString()} FCFA</td>
                <td style={{ padding: '10px 16px' }}>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    {d._pending && <PendingBadge />}
                    <button onClick={() => { setEditing(d); setForm({ libelle: d.libelle, montant: d.montant, rubrique: d.rubrique, dateDepense: d.dateDepense?.split('T')[0] || '' }); setShowForm(true); }}
                      style={{ background: T.blue + '20', border: `1px solid ${T.blue}40`, borderRadius: 6, padding: '4px 8px', cursor: 'pointer', color: T.blue }}><Edit size={13} /></button>
                    <button onClick={() => handleDelete(d.id)}
                      style={{ background: T.red + '20', border: `1px solid ${T.red}40`, borderRadius: 6, padding: '4px 8px', cursor: 'pointer', color: T.red }}><Trash2 size={13} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {depenses.length === 0 && <div style={{ padding: 40, textAlign: 'center', color: T.muted, fontSize: 13 }}>Aucune depense enregistree</div>}
      </div>

      {/* Modal form */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: '#000a', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, padding: 28, width: 420 }}>
            <h3 style={{ fontFamily: "'Fraunces', serif", fontSize: 17, color: T.text, marginBottom: 20 }}>{editing ? 'Modifier' : 'Nouvelle depense'}</h3>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, color: T.muted }}>Libelle</label>
                <input value={form.libelle} onChange={e => setForm({ ...form, libelle: e.target.value })} required
                  style={{ width: '100%', background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, padding: 10, color: T.text, marginTop: 4 }} />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, color: T.muted }}>Montant (FCFA)</label>
                <input type="number" value={form.montant} onChange={e => setForm({ ...form, montant: e.target.value })} required min="1"
                  style={{ width: '100%', background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, padding: 10, color: T.text, marginTop: 4 }} />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, color: T.muted }}>Rubrique</label>
                <select value={form.rubrique} onChange={e => setForm({ ...form, rubrique: e.target.value })}
                  style={{ width: '100%', background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, padding: 10, color: T.text, marginTop: 4 }}>
                  {RUBRIQUES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 12, color: T.muted }}>Date</label>
                <input type="date" value={form.dateDepense} onChange={e => setForm({ ...form, dateDepense: e.target.value })}
                  style={{ width: '100%', background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, padding: 10, color: T.text, marginTop: 4 }} />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="submit" style={{ flex: 1, background: T.green, border: 'none', borderRadius: 8, padding: 10, color: '#fff', fontWeight: 600, cursor: 'pointer' }}>
                  {editing ? 'Mettre a jour' : 'Enregistrer'}
                </button>
                <button type="button" onClick={() => { setShowForm(false); setEditing(null); }}
                  style={{ flex: 1, background: T.border, border: 'none', borderRadius: 8, padding: 10, color: T.text, cursor: 'pointer' }}>Annuler</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
