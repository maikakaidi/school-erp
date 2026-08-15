import { useState, useEffect } from 'react';
import { fetchWithAuth } from '../../api/fetchWithAuth';
import { FileText } from 'lucide-react';

const T = {
  card: '#0c1c2c', border: '#1a3050', accent: '#d4921a',
  green: '#1d9468', red: '#b83838', blue: '#2878c8',
  text: '#ddd0b8', muted: '#486070', bg: '#06101a',
};

const fmt = (n) => (n === null || n === undefined ? '—' : n.toFixed(2));

export default function EleveNotes() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchWithAuth('/eleve/notes')
      .then((d) => { if (!cancelled) setData(d); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  if (loading && !data) return <div style={{ color: T.muted, padding: 40, textAlign: 'center' }}>Chargement...</div>;

  const { matieres = [], moyenneSemestre1 = null, moyenneSemestre2 = null, moyenneGenerale = null, classe } = data || {};

  const showSemester = (matiere, sem) => {
    const detail = matiere[`semestre${sem}`];
    if (!detail) return null;
    return (
      <div style={{ fontSize: 11, color: T.muted }}>
        D1 {detail.devoir1 ?? '—'} · D2 {detail.devoir2 ?? '—'} · Comp {detail.composition ?? '—'} · Moy <b style={{ color: T.text }}>{detail.moyenne ?? '—'}</b>
        {detail.appreciation ? ` — ${detail.appreciation}` : ''}
      </div>
    );
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: T.accent + '20', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <FileText size={18} color={T.accent} />
        </div>
        <div>
          <div style={{ fontFamily: "'Fraunces', serif", fontSize: 18, fontWeight: 900 }}>Mes notes</div>
          <div style={{ fontSize: 12, color: T.muted }}>{classe ? `Classe ${classe}` : ''} · Année {data?.anneeScolaire || ''}</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 18 }}>
        <MoyCard label="Semestre 1" value={fmt(moyenneSemestre1)} />
        <MoyCard label="Semestre 2" value={fmt(moyenneSemestre2)} />
        <MoyCard label="Moyenne générale" value={fmt(moyenneGenerale)} highlight />
      </div>

      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#0a1624' }}>
              <th style={{ padding: 12, textAlign: 'left' }}>Matière</th>
              <th style={{ padding: 12, textAlign: 'left' }}>Coefficient</th>
              <th style={{ padding: 12, textAlign: 'left' }}>Semestre 1</th>
              <th style={{ padding: 12, textAlign: 'left' }}>Semestre 2</th>
            </tr>
          </thead>
          <tbody>
            {matieres.length === 0 && (
              <tr><td colSpan={4} style={{ padding: 24, textAlign: 'center', color: T.muted }}>Aucune note enregistrée.</td></tr>
            )}
            {matieres.map((m, idx) => (
              <tr key={m.matiereId} style={{ borderBottom: `1px solid ${T.border}30`, background: idx % 2 ? '#0a1624' : 'transparent' }}>
                <td style={{ padding: 12, fontWeight: 600 }}>{m.libelle}</td>
                <td style={{ padding: 12 }}>{m.coefficient}</td>
                <td style={{ padding: 12 }}>{showSemester(m, 1)}</td>
                <td style={{ padding: 12 }}>{showSemester(m, 2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MoyCard({ label, value, highlight }) {
  return (
    <div style={{ flex: '1 1 180px', background: T.card, border: `1px solid ${highlight ? T.accent + '60' : T.border}`, borderRadius: 14, padding: 18 }}>
      <div style={{ fontSize: 12, color: T.muted, marginBottom: 6 }}>{label}</div>
      <div style={{ fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 900, color: highlight ? T.accent : T.blue }}>{value}</div>
    </div>
  );
}
