import { useState, useEffect } from 'react';
import { useParent } from '../../context/ParentContext';
import { fetchWithAuth } from '../../api/fetchWithAuth';
import { User, Building2, Users } from 'lucide-react';

const T = {
  card: '#0c1c2c', border: '#1a3050', accent: '#d4921a',
  text: '#ddd0b8', muted: '#486070',
};

export default function ParentProfil() {
  const { children } = useParent();
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    fetchWithAuth('/parent/me').then(setProfile).catch(() => {});
  }, []);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: T.accent + '20', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <User size={18} color={T.accent} />
        </div>
        <div>
          <div style={{ fontFamily: "'Fraunces', serif", fontSize: 18, fontWeight: 900 }}>Mon profil</div>
          <div style={{ fontSize: 12, color: T.muted }}>Vos informations et vos enfants</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: 20, flex: '1 1 300px' }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <User size={14} color={T.accent} /> Informations
          </div>
          <Row label="Nom" value={profile?.parent?.nom || '—'} />
          <Row label="Téléphone" value={profile?.parent?.telephone || '—'} />
          <Row label="Email" value={profile?.parent?.email || '—'} />
          <Row label="Adresse" value={profile?.parent?.adresse || '—'} />
        </div>

        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: 20, flex: '1 1 300px' }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Building2 size={14} color={T.accent} /> Établissement
          </div>
          <Row label="Nom" value={profile?.school?.name || '—'} />
        </div>
      </div>

      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: 20, marginTop: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Users size={14} color={T.accent} /> Mes enfants ({children.length})
        </div>
        {children.length === 0 && <div style={{ fontSize: 12, color: T.muted }}>Aucun enfant rattaché.</div>}
        {children.map((c) => (
          <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: `1px solid ${T.border}` }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{c.prenom} {c.nom}</div>
              <div style={{ fontSize: 11, color: T.muted }}>{c.matricule}</div>
            </div>
            <div style={{ textAlign: 'right', fontSize: 13 }}>{c.classe || '—'}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${T.border}` }}>
      <span style={{ fontSize: 12, color: T.muted }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 600 }}>{value}</span>
    </div>
  );
}
