import { useState, useEffect } from 'react';
import { useEnseignant } from '../../context/EnseignantContext';
import { fetchWithAuth } from '../../api/fetchWithAuth';
import { GraduationCap, BookOpen, Users, CalendarDays, Loader } from 'lucide-react';

const T = {
  card: '#0c1c2c', border: '#1a3050', accent: '#d4921a',
  blue: '#2878c8', green: '#1d9468', red: '#b83838', purple: '#7848c8',
  text: '#ddd0b8', muted: '#486070', bg: '#06101a',
};

function Stat({ label, value, sub, color, icon: Icon }) {
  return (
    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: 18, flex: '1 1 180px' }}>
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

const fmtDate = (d) => new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });

export default function EnseignantDashboard() {
  const { profile, classes, affectations, loading } = useEnseignant();
  const [data, setData] = useState(null);
  const [load, setLoad] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoad(true);
    fetchWithAuth('/prof/dashboard')
      .then((d) => { if (!cancelled) setData(d); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoad(false); });
    return () => { cancelled = true; };
  }, []);

  if (loading) return <div style={{ color: T.muted, padding: 40, textAlign: 'center' }}>Chargement...</div>;

  const stats = data?.stats;
  const nom = profile?.enseignant?.nom;
  const prenom = profile?.enseignant?.prenom;

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
            {prenom || 'Bienvenue'} {nom || ''}
          </div>
          <div style={{ fontSize: 12, color: T.muted }}>
            {profile?.enseignant?.specialite || 'Enseignant'} · Année {data?.anneeScolaire || ''}
          </div>
        </div>
        {load && <div style={{ marginLeft: 'auto', color: T.muted, fontSize: 12 }}><Loader size={14} /></div>}
      </div>

      {stats && (
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 18 }}>
          <Stat label="Classes" value={stats.nbClasses ?? '—'} sub="Que vous enseignez" color={T.blue} icon={BookOpen} />
          <Stat label="Matières" value={stats.nbAffectations ?? '—'} sub="Assignations actives" color={T.purple} icon={BookOpen} />
          <Stat label="Élèves" value={stats.nbEleves ?? '—'} sub="Dans vos classes" color={T.green} icon={Users} />
          <Stat label="Séances ce mois" value={stats.seancesDuMois ?? '—'} sub="Emploi du temps" color={T.accent} icon={CalendarDays} />
        </div>
      )}

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: 18, flex: '1 1 320px' }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Mes classes & matières</div>
          {affectations.length === 0 && <div style={{ fontSize: 12, color: T.muted }}>Aucune affectation. Contactez l'administration.</div>}
          {affectations.map((a) => (
            <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: `1px solid ${T.border}` }}>
              <span style={{ fontSize: 13 }}>{a.classe.nom}</span>
              <span style={{ fontSize: 12, color: T.muted }}>{a.matiere.libelle} · Coef {a.coefficient}</span>
            </div>
          ))}
        </div>

        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: 18, flex: '1 1 320px' }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Dernières absences signalées</div>
          {(data?.recentAbsences || []).length === 0 && <div style={{ fontSize: 12, color: T.muted }}>Aucune absence récente.</div>}
          {(data?.recentAbsences || []).map((a) => (
            <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: `1px solid ${T.border}` }}>
              <div>
                <div style={{ fontSize: 13 }}>{a.eleve.nom} {a.eleve.prenom}</div>
                <div style={{ fontSize: 11, color: T.muted }}>{a.classe.nom}{a.matiere ? ` · ${a.matiere.libelle}` : ''}</div>
              </div>
              <span style={{ fontSize: 11, color: T.red }}>{fmtDate(a.date)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
