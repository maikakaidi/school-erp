import { useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchWithAuth } from '../api/fetchWithAuth';
import {
  Home, FileText, CalendarX, CalendarDays, Megaphone, Bell, User, LogOut, GraduationCap, MessageSquare,
} from 'lucide-react';

const T = {
  bg: '#06101a', card: '#0c1c2c', border: '#1a3050', accent: '#d4921a',
  text: '#ddd0b8', muted: '#486070',
};

const NAV = [
  { key: 'dashboard', label: 'Accueil', icon: Home, path: '/enseignant' },
  { key: 'notes', label: 'Notes', icon: FileText, path: '/enseignant/notes' },
  { key: 'absences', label: 'Absences', icon: CalendarX, path: '/enseignant/absences' },
  { key: 'edt', label: 'Emploi du temps', icon: CalendarDays, path: '/enseignant/emploi-du-temps' },
  { key: 'annonces', label: 'Annonces', icon: Megaphone, path: '/enseignant/annonces' },
  { key: 'notifications', label: 'Notifications', icon: Bell, path: '/enseignant/notifications' },
  { key: 'messages', label: 'Messages', icon: MessageSquare, path: '/enseignant/messages' },
  { key: 'profil', label: 'Profil', icon: User, path: '/enseignant/profil' },
];

export default function EnseignantLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [unread, setUnread] = useState({ annonces: 0, notifications: 0, messages: 0 });

  const loadUnread = () => {
    Promise.all([
      fetchWithAuth('/prof/annonces/unread-count').then(d => d.count).catch(() => 0),
      fetchWithAuth('/prof/notifications/unread-count').then(d => d.count).catch(() => 0),
      fetchWithAuth('/messages/unread-count').then(d => d.count).catch(() => 0),
    ]).then(([annonces, notifications, messages]) => setUnread({ annonces, notifications, messages }));
  };

  useEffect(() => {
    loadUnread();
    const id = setInterval(loadUnread, 60000);
    return () => clearInterval(id);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const activeKey = NAV.find((n) => location.pathname === n.path)?.key || 'dashboard';

  const badge = (key) => {
    const count = unread[key] || 0;
    if (!count) return null;
    return (
      <span style={{
        position: 'absolute', top: -5, right: -5, minWidth: 16, height: 16,
        borderRadius: 8, background: '#b83838', color: '#fff', fontSize: 9,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px',
        fontWeight: 700,
      }}>
        {count > 99 ? '99+' : count}
      </span>
    );
  };

  return (
    <div style={{ minHeight: '100vh', background: T.bg, color: T.text }}>
      <div style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: '#091522', borderBottom: `1px solid ${T.border}`,
        padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginRight: 'auto' }}>
          <div style={{
            width: 34, height: 34, borderRadius: 9,
            background: `linear-gradient(135deg, ${T.accent}, #9a6010)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
          }}>
            <GraduationCap size={18} />
          </div>
          <div>
            <div style={{ fontFamily: "'Fraunces', serif", fontWeight: 900, fontSize: 14, lineHeight: 1.1 }}>
              {user?.schoolName || 'API-SCHOOL'}
            </div>
            <div style={{ fontSize: 10, color: T.muted }}>Espace Enseignant</div>
          </div>
        </div>

        <button onClick={handleLogout} style={{
          display: 'flex', alignItems: 'center', gap: 6, background: 'transparent',
          border: `1px solid ${T.border}`, color: T.muted, borderRadius: 8,
          padding: '8px 12px', cursor: 'pointer', fontSize: 12,
        }}>
          <LogOut size={14} /> Déconnexion
        </button>
      </div>

      <div style={{
        display: 'flex', gap: 6, padding: '10px 16px', flexWrap: 'wrap',
        borderBottom: `1px solid ${T.border}`, background: '#081320',
        position: 'sticky', top: 55, zIndex: 40,
      }}>
        {NAV.map((n) => {
          const Icon = n.icon;
          const active = activeKey === n.key;
          return (
            <button key={n.key} onClick={() => navigate(n.path)} style={{
              display: 'flex', alignItems: 'center', gap: 6, flex: '1 1 auto', minWidth: 90,
              justifyContent: 'center', padding: '9px 12px', borderRadius: 9, cursor: 'pointer',
              position: 'relative',
              background: active ? T.accent + '20' : 'transparent',
              border: active ? `1px solid ${T.accent}50` : `1px solid ${T.border}`,
              color: active ? T.accent : T.muted, fontSize: 13, fontWeight: active ? 600 : 400,
            }}>
              <Icon size={14} /> {n.label} {badge(n.key)}
            </button>
          );
        })}
      </div>

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '20px 16px 60px' }}>
        {children}
      </div>
    </div>
  );
}
