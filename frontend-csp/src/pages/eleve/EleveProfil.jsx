import { useState, useEffect } from 'react';
import { fetchWithAuth } from '../../api/fetchWithAuth';
import { User } from 'lucide-react';

const T = {
  card: '#0c1c2c', border: '#1a3050', accent: '#d4921a',
  green: '#1d9468', red: '#b83838', blue: '#2878c8',
  text: '#ddd0b8', muted: '#486070', bg: '#06101a',
};

export default function EleveProfil() {
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchWithAuth('/eleve/me')
      .then((d) => { if (!cancelled) setMe(d); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  if (loading && !me) return <div style={{ color: T.muted, padding: 40, textAlign: 'center' }}>Chargement...</div>;

  const e = me?.eleve || {};

  const row = (label, value) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '10px 0', borderBottom: `1px solid ${T.border}` }}>
      <span style={{ fontSize: 13, color: T.muted }}>{label}</span>
      <span style={{ fontSize: 13, color: T.text, fontWeight: 600, textAlign: 'right' }}>{value || '—'}</span>
    </div>
  );

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

      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: 20, maxWidth: 560 }}>
        {e.photoUrl && (
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <img src={e.photoUrl} alt="photo" style={{ width: 90, height: 90, objectFit: 'cover', borderRadius: '50%', border: `2px solid ${T.border}` }} />
          </div>
        )}
        <div style={{ textAlign: 'center', marginBottom: 12 }}>
          <div style={{ fontFamily: "'Fraunces', serif", fontSize: 20, fontWeight: 900 }}>{e.prenom} {e.nom}</div>
          <div style={{ fontSize: 12, color: T.muted }}>{e.matricule}</div>
        </div>
        {row('Classe', e.classe?.nom)}
        {row('Année scolaire', e.anneeScolaire)}
        {row('Sexe', e.sexe === 'M' ? 'Masculin' : e.sexe === 'F' ? 'Féminin' : '—')}
        {row('Date de naissance', e.dateNaissance ? new Date(e.dateNaissance).toLocaleDateString('fr-FR') : null)}
        {row('Lieu de naissance', e.lieuNaissance)}
        {row('Nationalité', e.nationalite)}
        {row('Téléphone', e.telephone)}
      </div>
    </div>
  );
}
