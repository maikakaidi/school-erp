import { useState, useEffect } from 'react';
import { fetchWithAuth } from '../../api/fetchWithAuth';
import { GraduationCap, FileText, Wallet, CalendarX } from 'lucide-react';

const T = {
  card: '#0c1c2c', border: '#1a3050', accent: '#d4921a',
  green: '#1d9468', red: '#b83838', blue: '#2878c8',
  text: '#ddd0b8', muted: '#486070', bg: '#06101a',
};

const fmt = (n) => (n === null || n === undefined ? '—' : `${n.toLocaleString('fr-FR')} FCFA`);
const fmtMoy = (n) => (n === null || n === undefined ? '—' : n.toFixed(2));

export default function EleveDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchWithAuth('/eleve/dashboard')
      .then((d) => { if (!cancelled) setData(d); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  if (loading && !data) return <div style={{ color: T.muted, padding: 40, textAlign: 'center' }}>Chargement...</div>;

  const { eleve = {}, notes = {}, paiements = {}, absences = {} } = data || {};

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: T.accent + '20', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <GraduationCap size={18} color={T.accent} />
        </div>
        <div>
          <div style={{ fontFamily: "'Fraunces', serif", fontSize: 18, fontWeight: 900 }}>Bienvenue {eleve.prenom} {eleve.nom}</div>
          <div style={{ fontSize: 12, color: T.muted }}>
            {eleve.matricule} · {eleve.classe ? `Classe ${eleve.classe}` : 'Aucune classe'} · Année {eleve.anneeScolaire || ''}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 18 }}>
        <Card icon={<FileText size={16} />} label="Moyenne générale" value={fmtMoy(notes.moyenneGenerale)} color={T.blue} />
        <Card icon={<CalendarX size={16} />} label="Absences" value={`${absences.totalAbsences || 0}`} color={T.red} />
        <Card icon={<CalendarX size={16} />} label="Retards" value={`${absences.totalRetards || 0}`} color={T.accent} />
        <Card icon={<Wallet size={16} />} label="Reste à payer" value={fmt(paiements.resteAPayer)} color={(paiements.resteAPayer || 0) > 0 ? T.red : T.green} />
      </div>

      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: 18 }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Moyennes par semestre</div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 180px', background: T.bg, borderRadius: 10, border: `1px solid ${T.border}`, padding: 14 }}>
            <div style={{ fontSize: 12, color: T.muted }}>Semestre 1</div>
            <div style={{ fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 900, color: T.blue }}>{fmtMoy(notes.moyenneSemestre1)}</div>
          </div>
          <div style={{ flex: '1 1 180px', background: T.bg, borderRadius: 10, border: `1px solid ${T.border}`, padding: 14 }}>
            <div style={{ fontSize: 12, color: T.muted }}>Semestre 2</div>
            <div style={{ fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 900, color: T.blue }}>{fmtMoy(notes.moyenneSemestre2)}</div>
          </div>
          <div style={{ flex: '1 1 180px', background: T.bg, borderRadius: 10, border: `1px solid ${T.border}`, padding: 14 }}>
            <div style={{ fontSize: 12, color: T.muted }}>Moyenne générale</div>
            <div style={{ fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 900, color: T.accent }}>{fmtMoy(notes.moyenneGenerale)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Card({ icon, label, value, color }) {
  return (
    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: 18, flex: '1 1 180px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: T.muted, marginBottom: 6 }}>
        {icon} {label}
      </div>
      <div style={{ fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 900, color }}>{value}</div>
    </div>
  );
}
