import { useState, useEffect } from 'react';
import { fetchWithAuth } from '../../api/fetchWithAuth';
import { CalendarX } from 'lucide-react';

const T = {
  card: '#0c1c2c', border: '#1a3050', accent: '#d4921a',
  green: '#1d9468', red: '#b83838', blue: '#2878c8',
  text: '#ddd0b8', muted: '#486070', bg: '#06101a',
};

export default function EleveAbsences() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchWithAuth('/eleve/absences')
      .then((d) => { if (!cancelled) setData(d); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  if (loading && !data) return <div style={{ color: T.muted, padding: 40, textAlign: 'center' }}>Chargement...</div>;

  const { totalAbsences = 0, totalRetards = 0, justifies = 0, nonJustifies = 0, absences = [] } = data || {};

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: T.accent + '20', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CalendarX size={18} color={T.accent} />
        </div>
        <div>
          <div style={{ fontFamily: "'Fraunces', serif", fontSize: 18, fontWeight: 900 }}>Absences & retards</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 18 }}>
        <Card label="Absences" value={`${totalAbsences}`} color={T.red} />
        <Card label="Retards" value={`${totalRetards}`} color={T.accent} />
        <Card label="Justifiées" value={`${justifies}`} color={T.green} />
        <Card label="Non justifiées" value={`${nonJustifies}`} color={T.red} />
      </div>

      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#0a1624' }}>
              <th style={{ padding: 12, textAlign: 'left' }}>Date</th>
              <th style={{ padding: 12, textAlign: 'left' }}>Type</th>
              <th style={{ padding: 12, textAlign: 'left' }}>Matière</th>
              <th style={{ padding: 12, textAlign: 'left' }}>Motif</th>
              <th style={{ padding: 12, textAlign: 'left' }}>Justifiée</th>
            </tr>
          </thead>
          <tbody>
            {absences.length === 0 && (
              <tr><td colSpan={5} style={{ padding: 24, textAlign: 'center', color: T.muted }}>Aucune absence enregistrée.</td></tr>
            )}
            {absences.map((a, idx) => (
              <tr key={a.id} style={{ borderBottom: `1px solid ${T.border}30`, background: idx % 2 ? '#0a1624' : 'transparent' }}>
                <td style={{ padding: 12 }}>{new Date(a.date).toLocaleDateString('fr-FR')}</td>
                <td style={{ padding: 12, textTransform: 'capitalize' }}>{a.type}</td>
                <td style={{ padding: 12 }}>{a.matiere?.libelle || '—'}</td>
                <td style={{ padding: 12 }}>{a.motif || '—'}</td>
                <td style={{ padding: 12, color: a.justifie ? T.green : T.red }}>{a.justifie ? 'Oui' : 'Non'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Card({ label, value, color }) {
  return (
    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: 18, flex: '1 1 180px' }}>
      <div style={{ fontSize: 12, color: T.muted, marginBottom: 6 }}>{label}</div>
      <div style={{ fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 900, color }}>{value}</div>
    </div>
  );
}
