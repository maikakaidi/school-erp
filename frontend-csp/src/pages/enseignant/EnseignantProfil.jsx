import { useState, useEffect } from 'react';
import { useEnseignant } from '../../context/EnseignantContext';
import { fetchWithAuth } from '../../api/fetchWithAuth';
import { User, Loader, Briefcase, Phone, Mail, Clock } from 'lucide-react';

const T = {
  card: '#0c1c2c', border: '#1a3050', accent: '#d4921a',
  text: '#ddd0b8', muted: '#486070', bg: '#06101a',
};

function Field({ icon: Icon, label, value }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: `1px solid ${T.border}` }}>
      <span style={{ width: 34, height: 34, borderRadius: 9, background: T.accent + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={15} color={T.accent} />
      </span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 11, color: T.muted }}>{label}</div>
        <div style={{ fontSize: 14, fontWeight: 600 }}>{value || '—'}</div>
      </div>
    </div>
  );
}

export default function EnseignantProfil() {
  const { profile, affectations, classes, loading } = useEnseignant();
  const [me, setMe] = useState(null);

  useEffect(() => {
    fetchWithAuth('/prof/me').then(setMe).catch(() => {});
  }, []);

  if (loading) return <div style={{ color: T.muted, padding: 40, textAlign: 'center' }}><Loader size={18} /></div>;

  const e = me?.enseignant || profile?.enseignant;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: T.accent + '20', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <User size={18} color={T.accent} />
        </div>
        <div>
          <div style={{ fontFamily: "'Fraunces', serif", fontSize: 18, fontWeight: 900 }}>Mon profil</div>
          <div style={{ fontSize: 12, color: T.muted }}>{me?.school?.name || ''}</div>
        </div>
      </div>

      {!e ? (
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: 40, textAlign: 'center', color: T.muted }}>
          Profil indisponible
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: 20, flex: '1 1 300px' }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Informations personnelles</div>
            <Field icon={User} label="Nom" value={`${e.nom} ${e.prenom}`} />
            <Field icon={Phone} label="Téléphone" value={e.telephone} />
            <Field icon={Mail} label="Email" value={e.email} />
            <Field icon={Briefcase} label="Spécialité" value={e.specialite} />
            <Field icon={Briefcase} label="Type" value={e.estVacataire ? 'Vacataire' : 'Permanent'} />
            <Field icon={Clock} label="Compte créé le" value={e.createdAt ? new Date(e.createdAt).toLocaleDateString('fr-FR') : null} />
          </div>

          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: 20, flex: '1 1 300px' }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Mes affectations</div>
            {affectations.length === 0 && <div style={{ fontSize: 12, color: T.muted }}>Aucune affectation.</div>}
            {affectations.map((a) => (
              <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: `1px solid ${T.border}` }}>
                <span style={{ fontSize: 13 }}>{a.classe.nom}</span>
                <span style={{ fontSize: 12, color: T.muted }}>{a.matiere.libelle} · Coef {a.coefficient}</span>
              </div>
            ))}
            <div style={{ fontSize: 12, color: T.muted, marginTop: 12 }}>
              {classes.length} classe(s), {affectations.length} matière(s)
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
