import { useState, useEffect } from 'react';
import { fetchWithAuth } from '../../api/fetchWithAuth';
import { Bell, CalendarX, Megaphone, Wallet, CheckCheck } from 'lucide-react';

const T = {
  card: '#0c1c2c', border: '#1a3050', accent: '#d4921a',
  green: '#1d9468', red: '#b83838', orange: '#d4921a', purple: '#7848c8', blue: '#2878c8',
  text: '#ddd0b8', muted: '#486070',
};

const typeIcons = {
  absence: { icon: CalendarX, color: T.red },
  annonce: { icon: Megaphone, color: T.blue },
  versement: { icon: Wallet, color: T.green },
};

const fmtDate = (d) => new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

export default function EnseignantNotifications() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchWithAuth('/prof/notifications');
      setItems(data);
    } catch (err) { /* silent */ }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const markRead = async (id) => {
    try {
      await fetchWithAuth(`/prof/notifications/${id}/read`, { method: 'PUT' });
      setItems(prev => prev.map(n => (n.id === id ? { ...n, isRead: true } : n)));
    } catch (err) { /* silent */ }
  };

  const unreadCount = items.filter(n => !n.isRead).length;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18, justifyContent: 'space-between', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: T.accent + '20', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Bell size={18} color={T.accent} />
          </div>
          <div>
            <div style={{ fontFamily: "'Fraunces', serif", fontSize: 18, fontWeight: 900 }}>Notifications</div>
            <div style={{ fontSize: 12, color: T.muted }}>
              {unreadCount > 0 ? `${unreadCount} non lue(s)` : 'Tout est à jour'}
            </div>
          </div>
        </div>
        {unreadCount > 0 && (
          <button onClick={() => Promise.all(items.filter(n => !n.isRead).map(n => markRead(n.id)))} style={{
            display: 'flex', alignItems: 'center', gap: 6, background: 'transparent',
            border: `1px solid ${T.border}`, color: T.muted, borderRadius: 8,
            padding: '8px 12px', cursor: 'pointer', fontSize: 12,
          }}>
            <CheckCheck size={14} /> Tout marquer comme lu
          </button>
        )}
      </div>

      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: 18 }}>
        {loading && items.length === 0 && <div style={{ fontSize: 12, color: T.muted, padding: 20, textAlign: 'center' }}>Chargement...</div>}
        {!loading && items.length === 0 && (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <Bell size={28} color={T.muted} style={{ marginBottom: 10 }} />
            <div style={{ fontSize: 13, color: T.muted }}>Aucune notification</div>
          </div>
        )}
        {items.map((n) => {
          const meta = typeIcons[n.type] || { icon: Bell, color: T.purple };
          const Icon = meta.icon;
          return (
            <div key={n.id} onClick={() => { if (!n.isRead) markRead(n.id); }} style={{
              display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 8px',
              borderBottom: `1px solid ${T.border}`, cursor: n.isRead ? 'default' : 'pointer',
              background: n.isRead ? 'transparent' : meta.color + '0d',
              borderRadius: 10,
            }}>
              <span style={{
                width: 34, height: 34, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: meta.color + '20', flexShrink: 0,
              }}>
                <Icon size={15} color={meta.color} />
              </span>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{n.title}</span>
                  {!n.isRead && <span style={{ width: 8, height: 8, borderRadius: '50%', background: T.accent }} />}
                  <span style={{ fontSize: 11, color: T.muted, marginLeft: 'auto' }}>{fmtDate(n.createdAt)}</span>
                </div>
                <div style={{ fontSize: 12, color: T.muted, marginTop: 3 }}>{n.message}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
