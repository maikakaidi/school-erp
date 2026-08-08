import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import {
  Home, Users, UserCheck, BookOpen, FileText,
  Award, DollarSign, CreditCard, Briefcase,
  BarChart2, Settings, Shield, LogOut, ChevronRight, Clock,
  Calculator, Table, TrendingUp, Building2, Globe
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { fetchWithAuth } from '../api/fetchWithAuth';

const T = {
  sidebar: '#091522', border: '#1a3050', accent: '#d4921a',
  text: '#ddd0b8', muted: '#486070',
};

const NAV_SCHOOL = [
  { section: 'PRINCIPAL', items: [
    { key: 'dashboard', label: 'Tableau de bord', icon: Home, path: '/' },
  ]},
  { section: 'SCOLARITÉ', items: [
    { key: 'eleves',       label: 'Élèves',          icon: Users, path: '/eleves' },
    { key: 'inscriptions', label: 'Inscriptions',    icon: UserCheck, path: '/inscriptions' },
    { key: 'matieres',     label: 'Matières',        icon: BookOpen, path: '/matieres' },
    { key: 'coefficients', label: 'Coefficients',    icon: Calculator, path: '/coefficients' },
    { key: 'notes',        label: 'Notes & Devoirs', icon: Table, path: '/notes' },
    { key: 'bulletins',    label: 'Bulletins',       icon: FileText, path: '/bulletins' },
  ]},
  { section: 'EXAMENS', items: [
    { key: 'examens', label: 'Examens blancs', icon: Award, path: '/examens' },
  ]},
  { section: 'FINANCES', items: [
    { key: 'versements',   label: 'Versements',      icon: DollarSign, path: '/versements' },
    { key: 'frais',        label: 'Frais scolaires', icon: CreditCard, path: '/frais' },
    { key: 'depenses',     label: 'Dépenses',        icon: CreditCard, path: '/depenses' },
  ]},
  { section: 'RESSOURCES HUMAINES', items: [
    { key: 'enseignants', label: 'Enseignants', icon: Users, path: '/enseignants' },
    { key: 'horaires',    label: 'Horaires',    icon: Clock, path: '/horaires' },
    { key: 'salaires',    label: 'Salaires',    icon: DollarSign, path: '/salaires' },
  ]},
  { section: 'RAPPORTS', items: [
    { key: 'statistiques', label: 'Statistiques',    icon: BarChart2, path: '/statistiques' },
    { key: 'architecture', label: 'Architecture',    icon: Settings, path: '/architecture' },
  ]},
  { section: 'CONFIG', items: [
    { key: 'parametres',   label: 'Paramètres',      icon: Settings, path: '/parametres' },
  ]},
];

const NAV_SUPER_ADMIN = [
  { section: 'SUPER ADMIN', items: [
    { key: 'sa-dashboard', label: 'Dashboard', icon: Home, path: '/super-admin' },
    { key: 'sa-schools',   label: 'Écoles',    icon: Building2, path: '/super-admin' },
  ]},
];

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { t, i18n } = useTranslation();
  const [logoUrl, setLogoUrl] = useState(null);

  const isSuperAdmin = user?.role === 'super_admin';
  const NAV = isSuperAdmin ? NAV_SUPER_ADMIN : NAV_SCHOOL;

  useEffect(() => {
    if (!isSuperAdmin) {
      fetchWithAuth('/settings').then(data => {
        if (data?.logoUrl) setLogoUrl(data.logoUrl);
      }).catch(() => {});
    }
  }, [isSuperAdmin]);

  const changeLang = (lang) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('app-language', lang);
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getActiveKey = () => {
    const path = location.pathname;
    if (path === '/') return 'dashboard';
    if (path === '/super-admin') return 'sa-dashboard';
    const match = NAV.flatMap(s => s.items).find(item => item.path === path);
    return match ? match.key : 'dashboard';
  };

  const activeKey = getActiveKey();
  const isRtl = i18n.language === 'ar';

  return (
    <div style={{
      width: 255, minHeight: '100vh', background: T.sidebar,
      borderRight: isRtl ? 'none' : `1px solid ${T.border}`,
      borderLeft: isRtl ? `1px solid ${T.border}` : 'none',
      display: 'flex', flexDirection: 'column',
      position: 'fixed', left: isRtl ? undefined : 0, right: isRtl ? 0 : undefined, top: 0, bottom: 0,
      overflowY: 'auto', zIndex: 100,
    }}>
      <div style={{ padding: '26px 20px 18px', borderBottom: `1px solid ${T.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: isSuperAdmin
              ? 'linear-gradient(135deg, #b83838, #8a2020)'
              : logoUrl ? 'transparent' : `linear-gradient(135deg, ${T.accent}, #9a6010)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            overflow: 'hidden',
            fontFamily: "'Fraunces', serif", fontWeight: 900, fontSize: 20, color: '#fff',
          }}>
            {logoUrl && !isSuperAdmin ? (
              <img src={logoUrl} alt="Logo" style={{ width: 40, height: 40, objectFit: 'contain' }} />
            ) : (
              isSuperAdmin ? 'SA' : 'A'
            )}
          </div>
          <div>
            <div style={{ fontFamily: "'Fraunces', serif", fontWeight: 900, fontSize: 15, color: T.text }}>
              {isSuperAdmin ? 'Super Admin' : 'API-SCHOOL'}
            </div>
            <div style={{ fontSize: 11, color: T.muted }}>
              {isSuperAdmin ? 'Gestion multi-écoles' : 'Gestion scolaire'}
            </div>
          </div>
        </div>
        {!isSuperAdmin && (
          <div style={{
            marginTop: 12, display: 'inline-flex', alignItems: 'center', gap: 5,
            background: T.accent + '15', border: `1px solid ${T.accent}30`,
            borderRadius: 7, padding: '5px 10px', fontSize: 11, color: T.accent,
          }}>
            <Clock size={11} /> {t('common.year')} 2025-2026
          </div>
        )}
        <div style={{ marginTop: 10, display: 'flex', gap: 4 }}>
          {[{ code: 'fr', label: 'FR' }, { code: 'en', label: 'EN' }, { code: 'ar', label: 'AR' }].map(l => (
            <button key={l.code} onClick={() => changeLang(l.code)} style={{
              padding: '3px 8px', borderRadius: 5, fontSize: 10, fontWeight: 600, cursor: 'pointer',
              background: i18n.language === l.code ? T.accent + '30' : 'transparent',
              border: i18n.language === l.code ? `1px solid ${T.accent}60` : `1px solid ${T.border}`,
              color: i18n.language === l.code ? T.accent : T.muted,
            }}>{l.label}</button>
          ))}
        </div>
      </div>

      <div style={{ padding: '14px 10px', flex: 1 }}>
        {NAV.map(section => (
          <div key={section.section} style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 9, color: T.muted, fontWeight: 700, letterSpacing: '0.12em', padding: '0 10px', marginBottom: 5 }}>
              {section.section}
            </div>
            {section.items.map(item => {
              const Icon = item.icon;
              const isActive = activeKey === item.key;
              return (
                <button key={item.key} onClick={() => navigate(item.path)} style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 9,
                  padding: '9px 10px', borderRadius: 9, marginBottom: 1,
                  background: isActive ? T.accent + '18' : 'transparent',
                  border: isActive ? `1px solid ${T.accent}35` : '1px solid transparent',
                  color: isActive ? T.accent : T.muted, cursor: 'pointer',
                  textAlign: 'left', fontSize: 13, fontWeight: isActive ? 600 : 400,
                  transition: 'all 0.15s',
                }}
                  onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = '#ffffff08'; e.currentTarget.style.color = T.text; }}}
                  onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = T.muted; }}}
                >
                  <Icon size={14} />
                  <span style={{ flex: 1 }}>{item.label}</span>
                  {isActive && <ChevronRight size={12} />}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      <div style={{ padding: '14px 18px', borderTop: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          background: isSuperAdmin ? '#b83838' : logoUrl ? 'transparent' : T.accent,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden',
          fontSize: 13, fontWeight: 700, color: '#fff'
        }}>
          {logoUrl && !isSuperAdmin ? (
            <img src={logoUrl} alt="Logo" style={{ width: 32, height: 32, objectFit: 'contain', borderRadius: '50%' }} />
          ) : (
            isSuperAdmin ? 'SA' : (user?.schoolName ? user.schoolName.charAt(0).toUpperCase() : 'E')
          )}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: T.text }}>
            {isSuperAdmin ? 'Super Admin' : (user?.schoolName || 'Mon École')}
          </div>
          <div style={{ fontSize: 10, color: T.muted }}>{isSuperAdmin ? 'Administrateur global' : 'Administrateur'}</div>
        </div>
        <LogOut size={13} color={T.muted} style={{ cursor: 'pointer' }} onClick={handleLogout} />
      </div>
    </div>
  );
}
