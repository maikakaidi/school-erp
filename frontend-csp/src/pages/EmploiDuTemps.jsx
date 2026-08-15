import { useState, useEffect } from 'react';
import { fetchWithAuth } from '../api/fetchWithAuth';
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

export default function EmploiDuTemps() {
  const [classes, setClasses] = useState([]);
  const [classeId, setClasseId] = useState('');
  const [mois, setMois] = useState(now.getMonth() + 1);
  const [annee, setAnnee] = useState(now.getFullYear());
  const [horaires, setHoraires] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchWithAuth('/classes?limit=100')
      .then((d) => {
        const list = d.classes || [];
        setClasses(list);
        if (list.length > 0) setClasseId((prev) => prev || list[0].id);
      })
      .catch(() => {});
  }, []);

  const load = async (cid = classeId, m = mois, y = annee) => {
    if (!cid) return;
    setLoading(true);
    try {
      const d = await fetchWithAuth(`/horaires/classe?classeId=${cid}&mois=${m}&annee=${y}`);
      setHoraires(d || []);
    } catch (err) { setHoraires([]); }
    setLoading(false);
  };

  useEffect(() => {
    if (classeId) load(classeId, mois, annee);
  }, [classeId, mois, annee]);

  const prev = () => {
    const m = mois - 1; const y = m === 0 ? annee - 1 : annee;
    setMois(m === 0 ? 12 : m); setAnnee(y);
  };
  const next = () => {
    const m = mois + 1;
    setMois(m === 13 ? 1 : m); setAnnee(m === 13 ? annee + 1 : annee);
  };

  const count = horaires.length;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18, justifyContent: 'space-between', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: T.accent + '20', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CalendarDays size={18} color={T.accent} />
          </div>
          <div>
            <div style={{ fontFamily: "'Fraunces', serif", fontSize: 18, fontWeight: 900 }}>Emploi du temps par classe</div>
            <div style={{ fontSize: 12, color: T.muted }}>{monthNames[mois - 1]} {annee} · {count} séance(s)</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={prev} style={{ padding: '8px 14px', background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text, cursor: 'pointer' }}>Précédent</button>
          <button onClick={() => { const m = now.getMonth() + 1; const y = now.getFullYear(); setMois(m); setAnnee(y); }} style={{ padding: '8px 14px', background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text, cursor: 'pointer' }}>Aujourd'hui</button>
          <button onClick={next} style={{ padding: '8px 14px', background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text, cursor: 'pointer' }}>Suivant</button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 16, marginBottom: 18, alignItems: 'flex-end' }}>
        <div>
          <label style={{ display: 'block', fontSize: 11, color: T.muted, marginBottom: 5 }}>Classe</label>
          <select
            value={classeId}
            onChange={(e) => setClasseId(e.target.value)}
            style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 12px', color: T.text, minWidth: 220, cursor: 'pointer' }}
          >
            {classes.length === 0 && <option value="">Aucune classe</option>}
            {classes.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
          </select>
        </div>
        <button onClick={() => load()} style={{ padding: '8px 16px', background: T.blue, border: 'none', borderRadius: 8, color: '#fff', cursor: 'pointer' }}>Actualiser</button>
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: T.muted }}><Loader size={18} /></div>
      ) : count === 0 ? (
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: 40, textAlign: 'center', color: T.muted }}>
          Aucune séance pour cette classe ce mois.
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
