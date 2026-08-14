import { useState, useEffect } from 'react';
import { useParent } from '../../context/ParentContext';
import { fetchWithAuth } from '../../api/fetchWithAuth';
import { GraduationCap, TrendingUp, Wallet, Loader } from 'lucide-react';

const T = {
  card: '#0c1c2c', border: '#1a3050', accent: '#d4921a',
  blue: '#2878c8', green: '#1d9468', red: '#b83838', purple: '#7848c8',
  text: '#ddd0b8', muted: '#486070', bg: '#06101a',
};

function Stat({ label, value, sub, color, icon: Icon }) {
  return (
    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: 18, flex: '1 1 200px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <div style={{ width: 34, height: 34, borderRadius: 9, background: color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={16} color={color} />
        </div>
        <div style={{ fontSize: 12, color: T.muted }}>{label}</div>
      </div>
      <div style={{ fontFamily: "'Fraunces', serif", fontSize: 26, fontWeight: 900, color }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: T.muted, marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

export default function ParentDashboard() {
  const { children, selectedChild, selectedChildId, loading: childrenLoading } = useParent();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selectedChildId) return;
    let cancelled = false;
    setLoading(true);
    fetchWithAuth(`/parent/dashboard?childId=${selectedChildId}`)
      .then((d) => { if (!cancelled) setData(d); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [selectedChildId]);

  if (childrenLoading) return <div style={{ color: T.muted, padding: 40, textAlign: 'center' }}>Chargement...</div>;

  if (children.length === 0) {
    return (
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: 30, textAlign: 'center', color: T.muted }}>
        Aucun enfant n'est rattaché à votre compte. Contactez l'administration de l'établissement.
      </div>
    );
  }

  const eleve = data?.eleve;
  const notes = data?.notes;
  const paiements = data?.paiements;
  const fmt = (n) => (n === null || n === undefined ? '—' : `${n.toLocaleString('fr-FR')} FCFA`);

  const dernieresNotes = (notes?.matieres || [])
    .filter((m) => m.semestre1?.moyenne !== null || m.semestre2?.moyenne !== null)
    .map((m) => ({
      libelle: m.libelle,
      moyenne: m.semestre2?.moyenne ?? m.semestre1?.moyenne,
    }))
    .sort((a, b) => b.moyenne - a.moyenne)
    .slice(0, 4);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18, flexWrap: 'wrap' }}>
        <div style={{
          width: 46, height: 46, borderRadius: 12,
          background: T.accent + '20', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <GraduationCap size={22} color={T.accent} />
        </div>
        <div>
          <div style={{ fontFamily: "'Fraunces', serif", fontSize: 20, fontWeight: 900 }}>
            {selectedChild ? `${selectedChild.prenom} ${selectedChild.nom}` : 'Votre enfant'}
          </div>
          <div style={{ fontSize: 12, color: T.muted }}>
            {eleve?.classe || selectedChild?.classe || 'Classe'} · {eleve?.matricule || ''} · Année {eleve?.anneeScolaire || ''}
          </div>
        </div>
        {loading && <div style={{ marginLeft: 'auto', color: T.muted, fontSize: 12 }}><Loader size={14} /> </div>}
      </div>

      {data ? (
        <>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 18 }}>
            <Stat label="Moyenne générale" value={notes?.moyenneGenerale != null ? `${notes.moyenneGenerale}/20` : '—'} sub="Toutes matières" color={T.accent} icon={TrendingUp} />
            <Stat label="Semestre 1" value={notes?.moyenneSemestre1 != null ? `${notes.moyenneSemestre1}/20` : '—'} sub="Moyenne pondérée" color={T.blue} icon={TrendingUp} />
            <Stat label="Semestre 2" value={notes?.moyenneSemestre2 != null ? `${notes.moyenneSemestre2}/20` : '—'} sub="Moyenne pondérée" color={T.purple} icon={TrendingUp} />
            <Stat label="Reste à payer" value={fmt(paiements?.resteAPayer)} sub={`Sur ${fmt(paiements?.fraisTotal)} de frais`} color={paiements?.resteAPayer > 0 ? T.red : T.green} icon={Wallet} />
          </div>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: 18, flex: '2 1 320px' }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Dernières notes</div>
              {dernieresNotes.length === 0 && <div style={{ fontSize: 12, color: T.muted }}>Aucune note disponible.</div>}
              {dernieresNotes.map((n) => (
                <div key={n.libelle} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: `1px solid ${T.border}` }}>
                  <span style={{ fontSize: 13 }}>{n.libelle}</span>
                  <span style={{ fontWeight: 700, color: T.green }}>{n.moyenne != null ? `${n.moyenne}/20` : '—'}</span>
                </div>
              ))}
              <div style={{ marginTop: 14 }}>
                <button onClick={() => window.location.href = '/parent/notes'} style={{
                  background: 'transparent', border: `1px solid ${T.accent}60`, color: T.accent,
                  borderRadius: 8, padding: '9px 16px', cursor: 'pointer', fontSize: 13, width: '100%',
                }}>Voir toutes les notes</button>
              </div>
            </div>

            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: 18, flex: '1 1 260px' }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Paiements</div>
              <Row label="Frais scolaires" value={fmt(paiements?.fraisTotal)} />
              <Row label="Déjà payé" value={fmt(paiements?.totalPaye)} color={T.green} />
              <Row label="Reste" value={fmt(paiements?.resteAPayer)} color={paiements?.resteAPayer > 0 ? T.red : T.green} />
              {paiements?.fraisTotal > 0 && (
                <div style={{ height: 8, borderRadius: 5, background: T.border, overflow: 'hidden', marginTop: 10 }}>
                  <div style={{ width: `${Math.min(100, (paiements.totalPaye / paiements.fraisTotal) * 100)}%`, height: '100%', background: T.green }} />
                </div>
              )}
              <div style={{ marginTop: 14 }}>
                <button onClick={() => window.location.href = '/parent/paiements'} style={{
                  background: 'transparent', border: `1px solid ${T.accent}60`, color: T.accent,
                  borderRadius: 8, padding: '9px 16px', cursor: 'pointer', fontSize: 13, width: '100%',
                }}>Historique des paiements</button>
              </div>
            </div>

            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: 18, flex: '1 1 260px' }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Assiduité</div>
              <Row label="Absences" value={data?.absences?.totalAbsences ?? 0} />
              <Row label="Retards" value={data?.absences?.totalRetards ?? 0} />
              <Row label="Justifiés" value={data?.absences?.justifies ?? 0} color={T.green} />
              <Row label="Non justifiés" value={data?.absences?.nonJustifies ?? 0} color={(data?.absences?.nonJustifies ?? 0) > 0 ? T.red : T.text} />
              <div style={{ marginTop: 14 }}>
                <button onClick={() => window.location.href = '/parent/absences'} style={{
                  background: 'transparent', border: `1px solid ${T.accent}60`, color: T.accent,
                  borderRadius: 8, padding: '9px 16px', cursor: 'pointer', fontSize: 13, width: '100%',
                }}>Voir l'historique</button>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div style={{ color: T.muted, padding: 40, textAlign: 'center' }}>{loading ? 'Chargement...' : 'Aucune donnée'}</div>
      )}
    </div>
  );
}

function Row({ label, value, color = '#ddd0b8' }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${T.border}` }}>
      <span style={{ fontSize: 12, color: T.muted }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 700, color }}>{value}</span>
    </div>
  );
}
