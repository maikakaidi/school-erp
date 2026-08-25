import { useState, useEffect } from 'react';
import { useParent } from '../../context/ParentContext';
import { fetchWithAuth } from '../../api/fetchWithAuth';
import { useAcademicYear } from '../../context/AcademicYearContext';
import { CalendarX, Clock, CheckCircle2, AlertCircle } from 'lucide-react';

const T = {
  card: '#0c1c2c', border: '#1a3050', accent: '#d4921a',
  green: '#1d9468', red: '#b83838', orange: '#d4921a', purple: '#7848c8',
  text: '#ddd0b8', muted: '#486070',
};

const fmtDate = (d) => new Date(d).toLocaleDateString('fr-FR');

export default function ParentAbsences() {
  const { children, selectedChildId } = useParent();
  const { currentYear } = useAcademicYear();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selectedChildId) return;
    let cancelled = false;
    setLoading(true);
    const params = `childId=${selectedChildId}${currentYear ? `&anneeScolaire=${currentYear}` : ''}`;
    fetchWithAuth(`/parent/absences?${params}`)
      .then((d) => { if (!cancelled) setData(d); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [selectedChildId, currentYear]);

  if (children.length === 0) {
    return <div style={{ color: T.muted, padding: 40, textAlign: 'center' }}>Aucun enfant rattaché à votre compte.</div>;
  }

  if (loading && !data) return <div style={{ color: T.muted, padding: 40, textAlign: 'center' }}>Chargement...</div>;

  const absences = data?.absences || [];
  const cards = [
    { label: 'Absences', value: data?.totalAbsences ?? 0, color: T.red, icon: CalendarX },
    { label: 'Retards', value: data?.totalRetards ?? 0, color: T.orange, icon: Clock },
    { label: 'Justifiés', value: data?.justifies ?? 0, color: T.green, icon: CheckCircle2 },
    { label: 'Non justifiés', value: data?.nonJustifies ?? 0, color: T.purple, icon: AlertCircle },
  ];

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: T.accent + '20', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CalendarX size={18} color={T.accent} />
        </div>
        <div>
          <div style={{ fontFamily: "'Fraunces', serif", fontSize: 18, fontWeight: 900 }}>Absences & retards</div>
          <div style={{ fontSize: 12, color: T.muted }}>Suivi de l'assiduité de votre enfant</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 18 }}>
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.label} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: 16, flex: '1 1 140px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: c.color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={14} color={c.color} />
                </div>
                <div style={{ fontSize: 11, color: T.muted }}>{c.label}</div>
              </div>
              <div style={{ fontFamily: "'Fraunces', serif", fontSize: 24, fontWeight: 900, color: c.color }}>{c.value}</div>
            </div>
          );
        })}
      </div>

      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: 18 }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Historique récent</div>
        {absences.length === 0 && <div style={{ fontSize: 12, color: T.muted }}>Aucune absence ou retard enregistré.</div>}
        {absences.map((a) => (
          <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, padding: '12px 0', borderBottom: `1px solid ${T.border}`, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{
                width: 34, height: 34, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: a.type === 'absence' ? T.red + '20' : T.orange + '20',
              }}>
                {a.type === 'absence' ? <CalendarX size={15} color={T.red} /> : <Clock size={15} color={T.orange} />}
              </span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>
                  {a.type === 'absence' ? 'Absence' : 'Retard'}
                  <span style={{ fontSize: 11, color: T.muted, fontWeight: 400, marginLeft: 8 }}>{fmtDate(a.date)}</span>
                </div>
                <div style={{ fontSize: 11, color: T.muted }}>
                  {a.matiere ? `Matière : ${a.matiere.libelle}` : 'Pas de matière'}
                  {a.motif ? ` · ${a.motif}` : ''}
                </div>
              </div>
            </div>
            <span style={{
              fontSize: 11, padding: '3px 10px', borderRadius: 6,
              background: a.justifie ? T.green + '20' : T.red + '20',
              color: a.justifie ? T.green : T.red,
              border: `1px solid ${a.justifie ? T.green : T.red}30`,
            }}>
              {a.justifie ? 'Justifié' : 'Non justifié'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
