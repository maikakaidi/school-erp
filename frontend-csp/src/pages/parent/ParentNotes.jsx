import { useState, useEffect } from 'react';
import { useParent } from '../../context/ParentContext';
import { fetchWithAuth } from '../../api/fetchWithAuth';
import { FileText, Loader } from 'lucide-react';

const T = {
  card: '#0c1c2c', border: '#1a3050', accent: '#d4921a',
  blue: '#2878c8', green: '#1d9468', purple: '#7848c8',
  text: '#ddd0b8', muted: '#486070',
};

const fmt = (n) => (n === null || n === undefined ? '—' : `${n}/20`);

export default function ParentNotes() {
  const { children, selectedChildId } = useParent();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selectedChildId) return;
    let cancelled = false;
    setLoading(true);
    fetchWithAuth(`/parent/notes?childId=${selectedChildId}`)
      .then((d) => { if (!cancelled) setData(d); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [selectedChildId]);

  if (children.length === 0) {
    return <div style={{ color: T.muted, padding: 40, textAlign: 'center' }}>Aucun enfant rattaché à votre compte.</div>;
  }

  if (loading && !data) return <div style={{ color: T.muted, padding: 40, textAlign: 'center' }}>Chargement...</div>;

  const matieres = data?.matieres || [];

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: T.accent + '20', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <FileText size={18} color={T.accent} />
        </div>
        <div>
          <div style={{ fontFamily: "'Fraunces', serif", fontSize: 18, fontWeight: 900 }}>Notes et moyennes</div>
          <div style={{ fontSize: 12, color: T.muted }}>
            {data?.classe ? `Classe ${data.classe}` : ''} · Année {data?.anneeScolaire || ''}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 18 }}>
        <Card title="Moyenne générale" value={data?.moyenneGenerale != null ? `${data.moyenneGenerale}/20` : '—'} color={T.accent} />
        <Card title="Semestre 1" value={data?.moyenneSemestre1 != null ? `${data.moyenneSemestre1}/20` : '—'} color={T.blue} />
        <Card title="Semestre 2" value={data?.moyenneSemestre2 != null ? `${data.moyenneSemestre2}/20` : '—'} color={T.purple} />
      </div>

      {matieres.length === 0 && <div style={{ color: T.muted, padding: 30, textAlign: 'center' }}>Aucune note enregistrée.</div>}

      {/* Desktop : tableau */}
      <div style={{ display: 'none', flexDirection: 'column' }}>
        <Table matieres={matieres} />
      </div>
      {/* Mobile : cartes */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {matieres.map((m) => (
          <div key={m.matiereId} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{m.libelle}</div>
              <div style={{ fontSize: 11, color: T.muted }}>Coef {m.coefficient}</div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <SemCard label="S1" m={m.semestre1} />
              <SemCard label="S2" m={m.semestre2} />
            </div>
          </div>
        ))}
      </div>

      <style>{`
        @media (min-width: 720px) {
          .parent-notes-table { display: flex; flex-direction: column; }
          .parent-notes-cards { display: none; }
        }
        @media (max-width: 719px) {
          .parent-notes-table { display: none; }
          .parent-notes-cards { display: flex; }
        }
      `}</style>
    </div>
  );
}

function Card({ title, value, color }) {
  return (
    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: 18, flex: '1 1 160px' }}>
      <div style={{ fontSize: 12, color: T.muted, marginBottom: 6 }}>{title}</div>
      <div style={{ fontFamily: "'Fraunces', serif", fontSize: 24, fontWeight: 900, color }}>{value}</div>
    </div>
  );
}

function SemCard({ label, m }) {
  const moyenne = m?.moyenne;
  return (
    <div style={{ flex: 1, background: '#081320', border: `1px solid ${T.border}`, borderRadius: 10, padding: 10 }}>
      <div style={{ fontSize: 10, color: T.muted, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: 700, color: moyenne != null ? T.green : T.muted }}>{fmt(moyenne)}</div>
      <div style={{ fontSize: 10, color: T.muted, marginTop: 4 }}>Devoir : {m?.devoir1 ?? '—'} · Compo : {m?.composition ?? '—'}</div>
      {m?.appreciation && <div style={{ fontSize: 10, color: T.text, marginTop: 4 }}>{m.appreciation}</div>}
    </div>
  );
}

function Table({ matieres }) {
  return (
    <div className="parent-notes-table" style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, overflow: 'hidden' }}>
      <div style={{ display: 'flex', padding: '12px 16px', fontSize: 11, color: T.muted, fontWeight: 700, borderBottom: `1px solid ${T.border}` }}>
        <div style={{ flex: 2 }}>Matière</div>
        <div style={{ flex: 1, textAlign: 'center' }}>Coef</div>
        <div style={{ flex: 1, textAlign: 'center' }}>S1 moyenne</div>
        <div style={{ flex: 1, textAlign: 'center' }}>S2 moyenne</div>
        <div style={{ flex: 2, textAlign: 'center' }}>Appréciation</div>
      </div>
      {matieres.map((m) => (
        <div key={m.matiereId} style={{ display: 'flex', padding: '12px 16px', fontSize: 13, borderBottom: `1px solid ${T.border}` }}>
          <div style={{ flex: 2 }}>{m.libelle}</div>
          <div style={{ flex: 1, textAlign: 'center', color: T.muted }}>{m.coefficient}</div>
          <div style={{ flex: 1, textAlign: 'center', color: m.semestre1?.moyenne != null ? T.green : T.muted }}>{fmt(m.semestre1?.moyenne)}</div>
          <div style={{ flex: 1, textAlign: 'center', color: m.semestre2?.moyenne != null ? T.green : T.muted }}>{fmt(m.semestre2?.moyenne)}</div>
          <div style={{ flex: 2, textAlign: 'center', color: T.text, fontSize: 11 }}>{m.semestre2?.appreciation || m.semestre1?.appreciation || ''}</div>
        </div>
      ))}
    </div>
  );
}
