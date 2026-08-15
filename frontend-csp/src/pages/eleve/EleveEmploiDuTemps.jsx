import { useState, useEffect } from 'react';
import { fetchWithAuth } from '../../api/fetchWithAuth';
import { CalendarDays, Loader } from 'lucide-react';

const T = {
  card: '#0c1c2c', border: '#1a3050', accent: '#d4921a',
  blue: '#2878c8', text: '#ddd0b8', muted: '#486070', bg: '#06101a',
};

const JOURS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

const now = new Date();
const monthNames = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

export default function EleveEmploiDuTemps() {
  const [mois, setMois] = useState(now.getMonth() + 1);
  const [annee, setAnnee] = useState(now.getFullYear());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = async (m = mois, y = annee) => {
    setLoading(true);
    try {
      const d = await fetchWithAuth(`/eleve/emploi-du-temps?mois=${m}&annee=${y}`);
      setData(d);
    } catch (err) { /* silent */ }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const prev = () => {
    const m = mois - 1;
    setMois(m === 0 ? 12 : m); setAnnee(m === 0 ? annee - 1 : annee); load(m === 0 ? 12 : m, m === 0 ? annee - 1 : annee);
  };
  const next = () => {
    const m = mois + 1;
    setMois(m === 13 ? 1 : m); setAnnee(m === 13 ? annee + 1 : annee); load(m === 13 ? 1 : m, m === 13 ? annee + 1 : annee);
  };

  const horaires = data?.horaires || [];
  const count = horaires.length;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18, justifyContent: 'space-between', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: T.accent + '20', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CalendarDays size={18} color={T.accent} />
          </div>
          <div>
            <div style={{ fontFamily: "'Fraunces', serif", fontSize: 18, fontWeight: 900 }}>Emploi du temps</div>
            <div style={{ fontSize: 12, color: T.muted }}>
              {data?.classe?.nom ? `Classe ${data.classe.nom}` : ''} · {monthNames[mois - 1]} {annee} · {count} séance(s)
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={prev} style={{ padding: '8px 14px', background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text, cursor: 'pointer' }}>Précédent</button>
          <button onClick={() => { const m = now.getMonth() + 1; const y = now.getFullYear(); setMois(m); setAnnee(y); load(m, y); }} style={{ padding: '8px 14px', background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text, cursor: 'pointer' }}>Aujourd'hui</button>
          <button onClick={next} style={{ padding: '8px 14px', background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text, cursor: 'pointer' }}>Suivant</button>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: T.muted }}><Loader size={18} /></div>
      ) : count === 0 ? (
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: 40, textAlign: 'center', color: T.muted }}>
          Aucune séance pour votre classe ce mois.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {JOURS.map((jour) => {
            const items = horaires.filter((h) => h.jour === jour).sort((a, b) => a.heureDebut.localeCompare(b.heureDebut));
            if (items.length === 0) return null;
            return (
              <div key={jour} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.accent, marginBottom: 10 }}>{jour}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {items.map((h) => (
                    <div key={h.id} style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px',
                      background: T.bg, borderRadius: 10, border: `1px solid ${T.border}`,
                    }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: T.blue, minWidth: 90 }}>
                        {h.heureDebut} — {h.heureFin}
                      </span>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{h.matiere?.libelle}</span>
                      <span style={{ fontSize: 12, color: T.muted, marginLeft: 'auto' }}>
                        {h.enseignant?.nom} {h.enseignant?.prenom}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
