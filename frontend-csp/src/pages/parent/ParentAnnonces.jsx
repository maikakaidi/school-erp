import { useState, useEffect } from 'react';
import { fetchWithAuth } from '../../api/fetchWithAuth';
import { Megaphone, Info, AlertTriangle, CalendarHeart, BadgeCheck } from 'lucide-react';

const T = {
  card: '#0c1c2c', border: '#1a3050', accent: '#d4921a',
  green: '#1d9468', red: '#b83838', orange: '#d4921a', purple: '#7848c8', blue: '#2878c8',
  text: '#ddd0b8', muted: '#486070',
};

const typeMeta = {
  info: { icon: Info, color: T.blue, label: 'Information' },
  urgence: { icon: AlertTriangle, color: T.red, label: 'Urgence' },
  evenement: { icon: CalendarHeart, color: T.purple, label: 'Événement' },
  resultat: { icon: BadgeCheck, color: T.green, label: 'Résultat' },
};

const fmtDate = (d) => new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });

export default function ParentAnnonces() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchWithAuth('/parent/annonces');
      setItems(data);
    } catch (err) { /* silent */ }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const markRead = async (id) => {
    try {
      await fetchWithAuth(`/parent/annonces/${id}/read`, { method: 'PUT' });
      setItems(prev => prev.map(a => (a.id === id ? { ...a, isRead: true } : a)));
    } catch (err) { /* silent */ }
  };

  const unread = items.filter(a => !a.isRead).length;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: T.accent + '20', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Megaphone size={18} color={T.accent} />
        </div>
        <div>
          <div style={{ fontFamily: "'Fraunces', serif", fontSize: 18, fontWeight: 900 }}>Annonces</div>
          <div style={{ fontSize: 12, color: T.muted }}>{unread > 0 ? `${unread} non lue(s)` : 'Informations de l\'école'}</div>
        </div>
      </div>

      {loading && items.length === 0 && <div style={{ fontSize: 12, color: T.muted, padding: 20, textAlign: 'center' }}>Chargement...</div>}
      {!loading && items.length === 0 && (
        <div style={{ textAlign: 'center', padding: 40, background: T.card, border: `1px solid ${T.border}`, borderRadius: 14 }}>
          <Megaphone size={28} color={T.muted} style={{ marginBottom: 10 }} />
          <div style={{ fontSize: 13, color: T.muted }}>Aucune annonce publiée.</div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {items.map((a) => {
          const meta = typeMeta[a.type] || typeMeta.info;
          const Icon = meta.icon;
          return (
            <div key={a.id} onClick={() => { if (!a.isRead) markRead(a.id); }} style={{
              background: T.card, border: `1px solid ${a.isRead ? T.border : meta.color + '50'}`,
              borderRadius: 14, padding: 18, cursor: a.isRead ? 'default' : 'pointer',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <span style={{ width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: meta.color + '20' }}>
                  <Icon size={16} color={meta.color} />
                </span>
                <div style={{ flex: 1, minWidth: 160 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: T.text }}>{a.titre}</span>
                    {!a.isRead && <span style={{ width: 8, height: 8, borderRadius: '50%', background: T.accent }} />}
                    <span style={{
                      fontSize: 10, padding: '2px 8px', borderRadius: 6,
                      background: meta.color + '20', color: meta.color, border: `1px solid ${meta.color}30`,
                    }}>{meta.label}</span>
                  </div>
                  <div style={{ fontSize: 12, color: T.muted, marginTop: 6, whiteSpace: 'pre-wrap' }}>{a.message}</div>
                </div>
                <div style={{ fontSize: 11, color: T.muted }}>
                  {fmtDate(a.date)}
                  {a.classe && <div style={{ marginTop: 4 }}>{a.classe.nom}</div>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
