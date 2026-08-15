import { useState, useEffect } from 'react';
import { useEnseignant } from '../../context/EnseignantContext';
import { fetchWithAuth } from '../../api/fetchWithAuth';
import { FileText, Save, Loader, RefreshCw } from 'lucide-react';

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

export default function EnseignantNotes() {
  const { affectations, classes, anneeScolaire, loading } = useEnseignant();
  const [classeId, setClasseId] = useState('');
  const [matiereId, setMatiereId] = useState('');
  const [semestre, setSemestre] = useState(1);
  const [rows, setRows] = useState([]);
  const [coef, setCoef] = useState(1);
  const [fetching, setFetching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  const matieres = affectations.filter((a) => a.classe.id === classeId);

  useEffect(() => {
    setMatiereId('');
  }, [classeId]);

  const loadNotes = async () => {
    if (!classeId || !matiereId) return;
    setFetching(true);
    setMsg(null);
    try {
      const d = await fetchWithAuth(`/prof/notes?classeId=${classeId}&matiereId=${matiereId}&semestre=${semestre}`);
      setRows(d.notes || []);
      setCoef(d.coefficient || 1);
    } catch (err) {
      setMsg({ type: 'error', text: err.message });
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    loadNotes();
  }, [classeId, matiereId, semestre]);

  const updateRow = (eleveId, field, value) => {
    setRows(prev => prev.map(r => {
      if (r.eleveId !== eleveId) return r;
      const updated = { ...r, [field]: value === '' ? null : parseFloat(value) };
      if (field === 'devoir1' || field === 'composition') {
        const d = field === 'devoir1' ? updated.devoir1 : r.devoir1;
        const c = field === 'composition' ? updated.composition : r.composition;
        updated.moyenne = d !== null && c !== null ? Math.round(((d + c) / 2) * 100) / 100 : (d ?? c);
      }
      return updated;
    }));
  };

  const save = async () => {
    if (!classeId || !matiereId) return;
    setSaving(true);
    setMsg(null);
    try {
      const notes = rows
        .filter((r) => r.devoir1 !== null || r.composition !== null || (r.appreciation || '').trim())
        .map((r) => ({
          eleveId: r.eleveId,
          devoir: r.devoir1 ?? null,
          composition: r.composition ?? null,
          appreciation: (r.appreciation || '').trim() || null,
        }));
      if (notes.length === 0) { setMsg({ type: 'error', text: 'Aucune note à enregistrer' }); return; }
      const d = await fetchWithAuth('/prof/notes', {
        method: 'PUT',
        body: JSON.stringify({ classeId, matiereId, semestre, anneeScolaire, notes }),
      });
      setMsg({ type: 'ok', text: d.message || 'Notes enregistrées' });
      loadNotes();
    } catch (err) {
      setMsg({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ color: T.muted, padding: 40, textAlign: 'center' }}>Chargement...</div>;

  if (affectations.length === 0) {
    return (
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: 30, textAlign: 'center', color: T.muted }}>
        Aucune affectation à vos classes. Contactez l'administration de l'établissement.
      </div>
    );
  }

  const saisies = rows.filter((r) => r.devoir1 !== null || r.composition !== null).length;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: T.accent + '20', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <FileText size={18} color={T.accent} />
        </div>
        <div>
          <div style={{ fontFamily: "'Fraunces', serif", fontSize: 18, fontWeight: 900 }}>Saisie des notes</div>
          <div style={{ fontSize: 12, color: T.muted }}>Année {anneeScolaire || '—'} · Coef {coef}</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 18 }}>
        <select value={classeId} onChange={(e) => setClasseId(e.target.value)} style={{ ...selectStyle, flex: '1 1 180px' }}>
          <option value="">Classe…</option>
          {classes.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
        </select>
        <select value={matiereId} onChange={(e) => setMatiereId(e.target.value)} style={{ ...selectStyle, flex: '1 1 180px' }}>
          <option value="">Matière…</option>
          {matieres.map((a) => <option key={a.matiere.id} value={a.matiere.id}>{a.matiere.libelle}</option>)}
        </select>
        <select value={semestre} onChange={(e) => setSemestre(parseInt(e.target.value))} style={{ ...selectStyle, flex: '0 1 140px' }}>
          <option value={1}>Semestre 1</option>
          <option value={2}>Semestre 2</option>
        </select>
        <button onClick={loadNotes} disabled={!classeId || !matiereId} style={{
          display: 'flex', alignItems: 'center', gap: 6, background: T.card, border: `1px solid ${T.border}`,
          borderRadius: 8, padding: '9px 14px', color: T.muted, cursor: 'pointer', fontSize: 12,
        }}>
          <RefreshCw size={13} /> Recharger
        </button>
      </div>

      {msg && (
        <div style={{
          padding: '10px 14px', borderRadius: 8, marginBottom: 14, fontSize: 13,
          background: msg.type === 'ok' ? T.green + '15' : T.red + '15',
          color: msg.type === 'ok' ? T.green : T.red,
          border: `1px solid ${msg.type === 'ok' ? T.green : T.red}40`,
        }}>
          {msg.text}
        </div>
      )}

      {!classeId || !matiereId ? (
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: 30, textAlign: 'center', color: T.muted }}>
          Sélectionnez une classe et une matière pour saisir les notes.
        </div>
      ) : (
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: '#0a1624' }}>
            <span style={{ fontSize: 13, color: T.muted }}>{saisies} / {rows.length} élèves notés</span>
            <button onClick={save} disabled={saving} style={{
              display: 'flex', alignItems: 'center', gap: 6, background: T.accent, border: 'none',
              borderRadius: 8, padding: '9px 16px', color: '#fff', cursor: 'pointer', fontWeight: 600,
            }}>
              {saving ? <Loader size={14} /> : <Save size={14} />} Enregistrer les notes
            </button>
          </div>
          {fetching ? (
            <div style={{ padding: 40, textAlign: 'center', color: T.muted }}>Chargement...</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#0a1624' }}>
                    <th style={{ padding: 12, textAlign: 'left' }}>Élève</th>
                    <th style={{ padding: 12, textAlign: 'center' }}>Devoir (sur 20)</th>
                    <th style={{ padding: 12, textAlign: 'center' }}>Composition (sur 20)</th>
                    <th style={{ padding: 12, textAlign: 'center' }}>Moyenne</th>
                    <th style={{ padding: 12, textAlign: 'left' }}>Appréciation</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, idx) => (
                    <tr key={r.eleveId} style={{ borderBottom: `1px solid ${T.border}30`, background: idx % 2 ? '#0a1624' : 'transparent' }}>
                      <td style={{ padding: 10 }}>
                        <div style={{ fontSize: 13 }}>{r.nom} {r.prenom}</div>
                        <div style={{ fontSize: 10, color: T.muted }}>{r.matricule}</div>
                      </td>
                      <td style={{ padding: 10, width: 130 }}>
                        <input type="number" min="0" max="20" step="0.25" value={r.devoir1 ?? ''}
                          onChange={(e) => updateRow(r.eleveId, 'devoir1', e.target.value)} style={inputStyle} />
                      </td>
                      <td style={{ padding: 10, width: 150 }}>
                        <input type="number" min="0" max="20" step="0.25" value={r.composition ?? ''}
                          onChange={(e) => updateRow(r.eleveId, 'composition', e.target.value)} style={inputStyle} />
                      </td>
                      <td style={{ padding: 10, textAlign: 'center' }}>
                        <span style={{ fontWeight: 700, color: r.moyenne != null ? (r.moyenne >= 10 ? T.green : T.red) : T.muted }}>
                          {r.moyenne != null ? `${r.moyenne}/20` : '—'}
                        </span>
                      </td>
                      <td style={{ padding: 10, width: 220 }}>
                        <input value={r.appreciation || ''} placeholder="Appréciation…"
                          onChange={(e) => updateRow(r.eleveId, 'appreciation', e.target.value)} style={inputStyle} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
