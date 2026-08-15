import { useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchWithAuth } from '../api/fetchWithAuth';
import { Home, FileText, CalendarDays, CalendarX, Wallet, User, LogOut, GraduationCap, MessageSquare } from 'lucide-react';

const T = {
  bg: '#06101a', card: '#0c1c2c', border: '#1a3050', accent: '#d4921a',
  text: '#ddd0b8', muted: '#486070',
};

const NAV = [
  { key: 'dashboard', label: 'Accueil', icon: Home, path: '/eleve' },
  { key: 'notes', label: 'Notes', icon: FileText, path: '/eleve/notes' },
  { key: 'edt', label: 'Emploi du temps', icon: CalendarDays, path: '/eleve/emploi-du-temps' },
  { key: 'absences', label: 'Absences', icon: CalendarX, path: '/eleve/absences' },
  { key: 'paiements', label: 'Paiements', icon: Wallet, path: '/eleve/paiements' },
  { key: 'messages', label: 'Messages', icon: MessageSquare, path: '/eleve/messages' },
  { key: 'profil', label: 'Profil', icon: User, path: '/eleve/profil' },
];

export default function EleveLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [me, setMe] = useState(null);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    fetchWithAuth('/eleve/me').then((d) => setMe(d)).catch(() => {});
  }, []);

  useEffect(() => {
    const load = () => fetchWithAuth('/messages/unread-count').then(d => setUnread(d.count)).catch(() => {});
    load();
    const id = setInterval(load, 60000);
    return () => clearInterval(id);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const activeKey = NAV.find((n) => location.pathname === n.path)?.key || 'dashboard';

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
            <div style={{ fontSize: 10, color: T.muted }}>Espace Élève</div>
          </div>
        </div>

        {me?.eleve && (
          <div style={{ fontSize: 12, color: T.muted }}>
            {me.eleve.prenom} {me.eleve.nom} · {me.eleve.matricule}
            {me.eleve.classe ? ` · ${me.eleve.classe.nom}` : ''}
          </div>
        )}

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
              <Icon size={14} /> {n.label}
              {n.key === 'messages' && unread > 0 && (
                <span style={{
                  position: 'absolute', top: -5, right: -5, minWidth: 16, height: 16,
                  borderRadius: 8, background: '#b83838', color: '#fff', fontSize: 9,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px', fontWeight: 700,
                }}>
                  {unread > 99 ? '99+' : unread}
                </span>
              )}
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
