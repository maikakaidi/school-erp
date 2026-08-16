import { useState, useEffect, useRef } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Users, DollarSign, GraduationCap, AlertCircle, Award, Search, Bell, Check, Trash2, CheckCheck } from 'lucide-react';
import { fetchWithAuth } from '../api/fetchWithAuth';
import { useTranslation } from 'react-i18next';
import { useNotifications } from '../context/NotificationContext';
import { useAcademicYear } from '../context/AcademicYearContext';

const T = {
  card: '#0c1c2c', border: '#1a3050', accent: '#d4921a',
  blue: '#2878c8', green: '#1d9468', red: '#b83838', purple: '#7848c8',
  text: '#ddd0b8', muted: '#486070', bg: '#06101a',
};

function StatCard({ title, value, sub, icon: Icon, color }) {
  return (
    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: 22, display: 'flex', flexDirection: 'column', gap: 12, position: 'relative', overflow: 'hidden', cursor: 'default', transition: 'transform 0.2s' }}
      onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
      onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
    >
      <div style={{ position: 'absolute', top: -20, right: -20, width: 90, height: 90, borderRadius: '50%', background: color, opacity: 0.07 }} />
      <div style={{ width: 40, height: 40, borderRadius: 10, background: color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={18} color={color} />
      </div>
      <div>
        <div style={{ fontFamily: "'Fraunces', serif", fontSize: 28, fontWeight: 900, color }}>{value}</div>
        <div style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>{title}</div>
      </div>
      <div style={{ fontSize: 11, color, opacity: 0.75 }}>{sub}</div>
    </div>
  );
}

export default function Dashboard() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [logoUrl, setLogoUrl] = useState(null);
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const notifRef = useRef(null);
  const { notifications, unreadCount, loading: notifLoading, fetchNotifications, markAsRead, markAllAsRead, deleteNotification } = useNotifications();
  const { years, currentYear } = useAcademicYear();
  const [stats, setStats] = useState({
    nbEleves: 0,
    nbClasses: 0,
    totalPercu: 0,
    depenses: 0,
    resteAPercevoir: 0,
    chartData: [],
    paiements: { payeCount: 0, partielCount: 0, impayeCount: 0 },
    recentEleves: [],
    prochainsExamens: [],
  });
  const [annee, setAnnee] = useState(currentYear);
  const [loading, setLoading] = useState(true);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const data = await fetchWithAuth(`/statistiques/dashboard?anneeScolaire=${annee}`);
      setStats(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadLogo = async () => {
    try {
      const data = await fetchWithAuth('/settings');
      if (data?.logoUrl) setLogoUrl(data.logoUrl);
    } catch (err) { /* ignore */ }
  };

  useEffect(() => {
    loadDashboard();
    loadLogo();
  }, [annee]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifPanel(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleNotifPanel = () => {
    if (!showNotifPanel) fetchNotifications();
    setShowNotifPanel(!showNotifPanel);
  };

  const notifIcon = (type) => {
    switch (type) {
      case 'versement': return <DollarSign size={13} color={T.green} />;
      case 'eleve': return <Users size={13} color={T.blue} />;
      case 'bulletin': return <Award size={13} color={T.purple} />;
      default: return <Bell size={13} color={T.accent} />;
    }
  };

  const notifBg = (type) => {
    switch (type) {
      case 'versement': return T.green + '18';
      case 'eleve': return T.blue + '18';
      case 'bulletin': return T.purple + '18';
      default: return T.accent + '18';
    }
  };

  const pieData = [
    { name: t('dashboard.pieComplet', 'Complet'), value: stats.paiements.payeCount },
    { name: t('dashboard.piePartiel', 'Partiel'), value: stats.paiements.partielCount },
    { name: t('dashboard.pieImpaye', 'Impayé'), value: stats.paiements.impayeCount },
  ];
  const pieColors = [T.green, T.accent, T.red];

  return (
    <div className="fade-up">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {logoUrl && (
            <img src={logoUrl} alt="Logo" style={{ width: 48, height: 48, borderRadius: 10, objectFit: 'contain', background: '#fff', padding: 4 }} />
          )}
          <div>
            <h1 style={{ fontFamily: "'Fraunces', serif", fontWeight: 900, fontSize: 24, color: T.text }}>{t('dashboard.title')}</h1>
            <p style={{ fontSize: 13, color: T.muted, marginTop: 2 }}>{t('dashboard.welcome', 'Bienvenue')} · {t('common.year')} {annee}</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '8px 14px' }}>
            <Search size={14} color={T.muted} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('common.search')}
              style={{ background: 'transparent', border: 'none', outline: 'none', color: T.text, fontSize: 13, width: 180 }} />
          </div>
          <div ref={notifRef} style={{ position: 'relative' }}>
            <div onClick={toggleNotifPanel} style={{ width: 38, height: 38, borderRadius: 10, background: T.card, border: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', cursor: 'pointer' }}>
              <Bell size={15} color={showNotifPanel ? T.accent : T.muted} />
              {unreadCount > 0 && (
                <div style={{ position: 'absolute', top: 6, right: 6, minWidth: 16, height: 16, borderRadius: 8, background: T.red, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: '#fff', padding: '0 4px' }}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </div>
              )}
            </div>
            {showNotifPanel && (
              <div style={{ position: 'absolute', top: 46, right: 0, width: 360, maxHeight: 440, background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, overflow: 'hidden', zIndex: 100, boxShadow: '0 12px 40px rgba(0,0,0,0.5)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: `1px solid ${T.border}` }}>
                  <span style={{ fontFamily: "'Fraunces', serif", fontWeight: 700, fontSize: 14, color: T.text }}>{t('notifications.title', 'Notifications')}</span>
                  {unreadCount > 0 && (
                    <span onClick={markAllAsRead} style={{ fontSize: 11, color: T.accent, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <CheckCheck size={12} /> {t('notifications.markAllRead', 'Tout lire')}
                    </span>
                  )}
                </div>
                <div style={{ overflowY: 'auto', maxHeight: 360 }}>
                  {notifLoading ? (
                    <div style={{ padding: 30, textAlign: 'center', color: T.muted, fontSize: 12 }}>{t('common.loading')}</div>
                  ) : notifications.length === 0 ? (
                    <div style={{ padding: 30, textAlign: 'center', color: T.muted, fontSize: 12 }}>{t('notifications.empty', 'Aucune notification')}</div>
                  ) : (
                    notifications.map(n => (
                      <div key={n.id} onClick={() => !n.isRead && markAsRead(n.id)} style={{ display: 'flex', gap: 10, padding: '12px 16px', borderBottom: `1px solid ${T.border}30`, cursor: 'pointer', background: n.isRead ? 'transparent' : T.accent + '08', transition: 'background 0.2s' }}
                        onMouseEnter={e => e.currentTarget.style.background = T.border + '30'}
                        onMouseLeave={e => e.currentTarget.style.background = n.isRead ? 'transparent' : T.accent + '08'}
                      >
                        <div style={{ width: 30, height: 30, borderRadius: 8, background: notifBg(n.type), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                          {notifIcon(n.type)}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: n.isRead ? 400 : 600, color: T.text, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.title}</div>
                          <div style={{ fontSize: 11, color: T.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.message}</div>
                          <div style={{ fontSize: 10, color: T.muted, marginTop: 3, opacity: 0.7 }}>{new Date(n.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0 }}>
                          {!n.isRead && <div style={{ width: 7, height: 7, borderRadius: '50%', background: T.accent, marginTop: 4 }} />}
                          <Trash2 size={12} color={T.muted} style={{ cursor: 'pointer', marginTop: 2 }} onClick={(e) => { e.stopPropagation(); deleteNotification(n.id); }} />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 50, color: T.muted }}>{t('common.loading')}</div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
            <StatCard title={t('dashboard.totalEleves')} value={stats.nbEleves} sub={`${t('common.year')} ${annee}`} icon={Users} color={T.accent} />
            <StatCard title={t('dashboard.totalVersements')} value={(stats.totalPercu / 1000).toFixed(0) + 'k'} sub="FCFA collectés" icon={DollarSign} color={T.green} />
            <StatCard title={t('dashboard.resteAPercevoir', 'Reste à percevoir')} value={(stats.resteAPercevoir / 1000).toFixed(0) + 'k'} sub="FCFA en attente" icon={AlertCircle} color={T.red} />
            <StatCard title={t('dashboard.classesActives', 'Classes actives')} value={stats.nbClasses} sub={t('dashboard.tousNiveaux', 'Tous niveaux')} icon={GraduationCap} color={T.blue} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 16, marginBottom: 24 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: 22 }}>
              <h3 style={{ fontFamily: "'Fraunces', serif", fontWeight: 700, fontSize: 15, color: T.text, marginBottom: 4 }}>{t('dashboard.versementsParClasse', 'Versements par classe')}</h3>
              <p style={{ fontSize: 12, color: T.muted, marginBottom: 18 }}>{t('dashboard.fraisAttendus', 'Frais attendus (gris) vs perçus (or) en FCFA')}</p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={stats.chartData} barGap={4}>
                  <XAxis dataKey="classe" tick={{ fill: T.muted, fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: T.muted, fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => v/1000 + 'k'} />
                  <Tooltip contentStyle={{ background: '#0c1c2c', border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 12 }}
                    formatter={(v, n) => [v.toLocaleString('fr-FR') + ' FCFA', n === 'attendu' ? t('dashboard.attendu', 'Attendu') : t('dashboard_percu', 'Perçu')]} />
                  <Bar dataKey="attendu" fill={T.border} radius={[4,4,0,0]} />
                  <Bar dataKey="percu" fill={T.accent} radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: 22 }}>
              <h3 style={{ fontFamily: "'Fraunces', serif", fontWeight: 700, fontSize: 15, color: T.text, marginBottom: 4 }}>{t('dashboard.statutPaiements', 'Statut des paiements')}</h3>
              <p style={{ fontSize: 12, color: T.muted, marginBottom: 10 }}>{t('dashboard.repartitionEleves', 'Répartition des élèves')}</p>
              <ResponsiveContainer width="100%" height={150}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={68} paddingAngle={3} dataKey="value">
                    {pieData.map((_, i) => <Cell key={i} fill={pieColors[i]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#0c1c2c', border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                {pieData.map((d, i) => (
                  <div key={d.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: T.muted }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: pieColors[i] }} />
                      {d.name}
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: 22 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                <h3 style={{ fontFamily: "'Fraunces', serif", fontWeight: 700, fontSize: 15, color: T.text }}>{t('dashboard.elevesRecents', 'Élèves récents')}</h3>
                <span style={{ fontSize: 12, color: T.accent, cursor: 'pointer' }}>{t('dashboard.voirTout', 'Voir tout')} →</span>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr><th style={{ textAlign: 'left', fontSize: 10, color: T.muted, padding: '0 0 10px', fontWeight: 700 }}>Nom & Prénom</th>
                    <th style={{ textAlign: 'left', fontSize: 10, color: T.muted, padding: '0 0 10px', fontWeight: 700 }}>Classe</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentEleves.map(e => (
                    <tr key={e.id} style={{ borderTop: `1px solid ${T.border}20` }}>
                      <td style={{ padding: '11px 0', fontSize: 13, color: T.text }}>{e.nom}</td>
                      <td style={{ padding: '11px 0', fontSize: 12, color: T.muted }}>{e.classe}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: 22 }}>
              <h3 style={{ fontFamily: "'Fraunces', serif", fontWeight: 700, fontSize: 15, color: T.text, marginBottom: 16 }}>{t('dashboard.examensAVenir', 'Examens à venir')}</h3>
              {stats.prochainsExamens.map((ex, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 0', borderBottom: i < stats.prochainsExamens.length - 1 ? `1px solid ${T.border}` : 'none' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: T.purple + '20', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Award size={14} color={T.purple} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: T.text }}>{ex.exam}</div>
                    <div style={{ fontSize: 11, color: T.muted }}>{ex.niveau} · {ex.salle}</div>
                  </div>
                  <div style={{ fontSize: 11, color: T.accent, background: T.accent + '15', padding: '3px 8px', borderRadius: 6 }}>{ex.date}</div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}