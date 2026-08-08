import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Users, DollarSign, TrendingUp, BookOpen, AlertTriangle, CheckCircle } from 'lucide-react';
import { fetchWithAuth } from '../api/fetchWithAuth';
import { useTranslation } from 'react-i18next';

const T = {
  bg: '#06101a', card: '#0c1c2c', border: '#1a3050', accent: '#d4921a',
  blue: '#2878c8', green: '#1d9468', red: '#b83838', purple: '#7848c8',
  text: '#ddd0b8', muted: '#486070',
};

const COLORS = ['#d4921a', '#2878c8', '#1d9468', '#b83838', '#7848c8', '#1890a0'];

function StatCard({ label, value, icon: Icon, color }) {
  return (
    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: 20, display: 'flex', alignItems: 'center', gap: 14 }}>
      <div style={{ width: 44, height: 44, borderRadius: 10, background: color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={20} color={color} />
      </div>
      <div>
        <div style={{ fontSize: 26, fontFamily: "'Fraunces', serif", fontWeight: 900, color }}>{typeof value === 'number' ? value.toLocaleString() : value}</div>
        <div style={{ fontSize: 11, color: T.muted }}>{label}</div>
      </div>
    </div>
  );
}

export default function Statistiques() {
  const { t } = useTranslation();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [annee, setAnnee] = useState('2025-2026');

  useEffect(() => { load(); }, [annee]);

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchWithAuth(`/statistiques/dashboard?anneeScolaire=${annee}`);
      setStats(data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  if (loading) return <div style={{ color: T.text, padding: 40 }}>{t('common.loading')}</div>;
  if (!stats) return <div style={{ color: T.muted, padding: 40 }}>{t('statistiques.noData')}</div>;

  const paiementData = [
    { name: 'Paye', value: stats.paiements?.payeCount || 0, color: T.green },
    { name: 'Partiel', value: stats.paiements?.partielCount || 0, color: T.accent },
    { name: 'Impaye', value: stats.paiements?.impayeCount || 0, color: T.red },
  ].filter(d => d.value > 0);

  return (
    <div style={{ padding: '32px 0', color: T.text }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 24, fontWeight: 900 }}>{t('statistiques.title')}</h1>
          <p style={{ fontSize: 12, color: T.muted, marginTop: 4 }}>{t('statistiques.subtitle')} {annee}</p>
        </div>
        <select value={annee} onChange={e => setAnnee(e.target.value)}
          style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '7px 12px', color: T.text, fontSize: 12 }}>
          <option value="2025-2026">2025-2026</option>
          <option value="2024-2025">2024-2025</option>
        </select>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
        <StatCard label={t('statistiques.elevesInscrits')} value={stats.nbEleves} icon={Users} color={T.blue} />
        <StatCard label={t('statistiques.totalRecu')} value={`${(stats.totalPercu || 0).toLocaleString()} F`} icon={DollarSign} color={T.green} />
        <StatCard label={t('statistiques.totalDepenses')} value={`${(stats.depenses || 0).toLocaleString()} F`} icon={TrendingUp} color={T.red} />
        <StatCard label={t('statistiques.resteARecevoir')} value={`${(stats.resteAPercevoir || 0).toLocaleString()} F`} icon={AlertTriangle} color={T.accent} />
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginBottom: 28 }}>
        {/* Versements par classe */}
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: 20 }}>
          <h3 style={{ fontFamily: "'Fraunces', serif", fontSize: 15, fontWeight: 700, marginBottom: 16 }}>{t('statistiques.versementsParClasse')}</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={stats.chartData || []}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="classe" tick={{ fill: T.muted, fontSize: 10 }} />
              <YAxis tick={{ fill: T.muted, fontSize: 10 }} />
              <Tooltip contentStyle={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text }} />
              <Bar dataKey="attendu" fill={T.accent} name={t('statistiques.attendu')} radius={[4, 4, 0, 0]} />
              <Bar dataKey="percu" fill={T.green} name={t('statistiques.recu')} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie chart paiements */}
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: 20 }}>
          <h3 style={{ fontFamily: "'Fraunces', serif", fontSize: 15, fontWeight: 700, marginBottom: 16 }}>{t('statistiques.statutPaiements')}</h3>
          {paiementData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={paiementData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, value }) => `${name}: ${value}`}>
                  {paiementData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Legend wrapperStyle={{ color: T.muted, fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : <div style={{ color: T.muted, textAlign: 'center', padding: 40 }}>{t('statistiques.noData')}</div>}
        </div>
      </div>

      {/* Bottom row: recent + exams */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: 20 }}>
          <h3 style={{ fontFamily: "'Fraunces', serif", fontSize: 15, fontWeight: 700, marginBottom: 16 }}>{t('statistiques.elevesRecents')}</h3>
          {(stats.recentEleves || []).map(e => (
            <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${T.border}20` }}>
              <span style={{ fontSize: 13 }}>{e.nom}</span>
              <span style={{ fontSize: 11, color: T.accent }}>{e.classe}</span>
            </div>
          ))}
          {(!stats.recentEleves || stats.recentEleves.length === 0) && <div style={{ color: T.muted, fontSize: 13 }}>{t('statistiques.noRecentEleve')}</div>}
        </div>

        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: 20 }}>
          <h3 style={{ fontFamily: "'Fraunces', serif", fontSize: 15, fontWeight: 700, marginBottom: 16 }}>{t('statistiques.examensAVenir')}</h3>
          {(stats.prochainsExamens || []).map((ex, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${T.border}20` }}>
              <div>
                <div style={{ fontSize: 13 }}>{ex.exam}</div>
                <div style={{ fontSize: 10, color: T.muted }}>{ex.niveau}</div>
              </div>
              <span style={{ fontSize: 11, color: T.blue }}>{ex.date}</span>
            </div>
          ))}
          {(!stats.prochainsExamens || stats.prochainsExamens.length === 0) && <div style={{ color: T.muted, fontSize: 13 }}>{t('statistiques.noExamen')}</div>}
        </div>
      </div>
    </div>
  );
}