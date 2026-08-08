import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2, Users, AlertTriangle, TrendingUp,
  CheckCircle, XCircle, RefreshCw, Trash2, Key,
  Plus, Calendar, Search, ArrowLeft
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';

const T = {
  bg: '#06101a', card: '#0c1c2c', cardB: '#132638',
  border: '#1a3050', accent: '#d4921a', blue: '#2878c8',
  green: '#1d9468', red: '#b83838', purple: '#7848c8',
  text: '#ddd0b8', muted: '#486070',
};

function StatCard({ label, value, icon: Icon, color }) {
  return (
    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: 20, display: 'flex', alignItems: 'center', gap: 14 }}>
      <div style={{ width: 44, height: 44, borderRadius: 10, background: color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={20} color={color} />
      </div>
      <div>
        <div style={{ fontSize: 26, fontFamily: "'Fraunces', serif", fontWeight: 900, color }}>{value}</div>
        <div style={{ fontSize: 11, color: T.muted }}>{label}</div>
      </div>
    </div>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000a', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, padding: 28, width: 420, maxHeight: '80vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ fontFamily: "'Fraunces', serif", fontSize: 17, color: T.text }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: T.muted, cursor: 'pointer', fontSize: 18 }}>&times;</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function SuperAdminDashboard() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null);
  const [modalData, setModalData] = useState({});
  const [actionLoading, setActionLoading] = useState(false);

  const token = localStorage.getItem('accessToken');

  const api = async (url, options = {}) => {
    const res = await fetch(url, {
      ...options,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...options.headers },
    });
    if (res.status === 401) { logout(); navigate('/login'); return; }
    if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.message || 'Erreur'); }
    return res.status === 204 ? null : res.json();
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [s, sc] = await Promise.all([
        api('/api/super-admin/dashboard'),
        api('/api/super-admin/schools'),
      ]);
      setStats(s);
      setSchools(sc);
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const doAction = async (action, id, body = {}) => {
    setActionLoading(true);
    try {
      await api(`/api/super-admin/${action}/${id}`, { method: 'PATCH', body: JSON.stringify(body) });
      await loadData();
      setModal(null);
    } catch (e) { setError(e.message); }
    setActionLoading(false);
  };

  const doDelete = async (id) => {
    if (!confirm(t('superAdmin.confirmDelete'))) return;
    setActionLoading(true);
    try {
      await api(`/api/super-admin/delete/${id}`, { method: 'DELETE' });
      await loadData();
    } catch (e) { setError(e.message); }
    setActionLoading(false);
  };

  const filtered = schools.filter(s =>
    s.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.phone?.includes(search)
  );

  const statusColor = (s) => {
    if (s === 'active') return T.green;
    if (s === 'trial') return T.accent;
    if (s === 'expired') return T.red;
    return T.muted;
  };

  const statusLabel = (s) => {
    if (s === 'active') return t('common.active');
    if (s === 'trial') return t('common.trial');
    if (s === 'expired') return t('common.expired');
    if (s === 'suspended') return t('common.suspended');
    return s;
  };

  const daysRemaining = (school) => {
    if (!school.subscriptionEnd) return school.trialDays || 0;
    const diff = new Date(school.subscriptionEnd) - new Date();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  if (loading) return <div style={{ color: T.text, padding: 40 }}>{t('common.loading')}</div>;

  return (
    <div style={{ padding: '32px 0', color: T.text }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 24, fontWeight: 900 }}>{t('superAdmin.title')}</h1>
          <p style={{ fontSize: 12, color: T.muted, marginTop: 4 }}>{t('superAdmin.headerSubtitle')}</p>
        </div>
      </div>

      {error && <div style={{ background: T.red + '20', border: `1px solid ${T.red}40`, borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 13 }}>{error}</div>}

      {/* Stats */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
          <StatCard label={t('superAdmin.totalSchools')} value={stats.totalSchools} icon={Building2} color={T.blue} />
          <StatCard label={t('superAdmin.activeSubscriptions')} value={stats.activeSchools} icon={CheckCircle} color={T.green} />
          <StatCard label={t('superAdmin.inTrial')} value={stats.trialSchools} icon={AlertTriangle} color={T.accent} />
          <StatCard label={t('superAdmin.expired')} value={stats.expiredSchools} icon={XCircle} color={T.red} />
        </div>
      )}

      {/* Schools table */}
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontFamily: "'Fraunces', serif", fontSize: 15, fontWeight: 700 }}>{t('superAdmin.schoolList')} ({filtered.length})</h3>
          <div style={{ position: 'relative' }}>
            <Search size={14} color={T.muted} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
            <input
              placeholder={t('common.search')}
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, padding: '7px 10px 7px 30px', color: T.text, fontSize: 12, width: 220 }}
            />
          </div>
        </div>

        <table width="100%" style={{ borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${T.border}` }}>
              {[t('superAdmin.tableHeaders.ecole'), t('superAdmin.tableHeaders.telephone'), t('superAdmin.tableHeaders.statut'), t('superAdmin.tableHeaders.joursRestants'), t('superAdmin.tableHeaders.expireLe'), t('superAdmin.tableHeaders.actions')].map(h => (
                <th key={h} style={{ padding: '10px 16px', fontSize: 10, color: T.muted, fontWeight: 700, letterSpacing: '0.07em', textAlign: 'left' }}>{h.toUpperCase()}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(school => (
              <tr key={school.id} style={{ borderBottom: `1px solid ${T.border}20` }}>
                <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600 }}>{school.name}</td>
                <td style={{ padding: '12px 16px', fontSize: 12, color: T.muted }}>{school.phone}</td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{
                    fontSize: 10, padding: '3px 10px', borderRadius: 20,
                    background: statusColor(school.subscriptionStatus) + '20',
                    color: statusColor(school.subscriptionStatus),
                    border: `1px solid ${statusColor(school.subscriptionStatus)}40`,
                    fontWeight: 600,
                  }}>{statusLabel(school.subscriptionStatus)}</span>
                </td>
                <td style={{ padding: '12px 16px', fontSize: 12, color: T.text }}>{daysRemaining(school)}j</td>
                <td style={{ padding: '12px 16px', fontSize: 12, color: T.muted }}>
                  {school.subscriptionEnd ? new Date(school.subscriptionEnd).toLocaleDateString('fr-FR') : '—'}
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {school.isActive ? (
                      <button onClick={() => doAction('deactivate', school.id)} title="Desactiver"
                        style={{ background: T.red + '20', border: `1px solid ${T.red}40`, borderRadius: 6, padding: '4px 8px', cursor: 'pointer', color: T.red }}>
                        <XCircle size={13} />
                      </button>
                    ) : (
                      <button onClick={() => doAction('activate', school.id)} title="Activer"
                        style={{ background: T.green + '20', border: `1px solid ${T.green}40`, borderRadius: 6, padding: '4px 8px', cursor: 'pointer', color: T.green }}>
                        <CheckCircle size={13} />
                      </button>
                    )}
                    <button onClick={() => { setModal('renew'); setModalData({ schoolId: school.id, schoolName: school.name }); }}
                      title="Renouveler" style={{ background: T.accent + '20', border: `1px solid ${T.accent}40`, borderRadius: 6, padding: '4px 8px', cursor: 'pointer', color: T.accent }}>
                      <RefreshCw size={13} />
                    </button>
                    <button onClick={() => { setModal('addDays'); setModalData({ schoolId: school.id, schoolName: school.name }); }}
                      title="Ajouter jours" style={{ background: T.blue + '20', border: `1px solid ${T.blue}40`, borderRadius: 6, padding: '4px 8px', cursor: 'pointer', color: T.blue }}>
                      <Plus size={13} />
                    </button>
                    <button onClick={() => { setModal('resetPassword'); setModalData({ schoolId: school.id, schoolName: school.name }); }}
                      title="Reset mot de passe" style={{ background: T.purple + '20', border: `1px solid ${T.purple}40`, borderRadius: 6, padding: '4px 8px', cursor: 'pointer', color: T.purple }}>
                      <Key size={13} />
                    </button>
                    <button onClick={() => doDelete(school.id)} title="Supprimer"
                      style={{ background: T.red + '20', border: `1px solid ${T.red}40`, borderRadius: 6, padding: '4px 8px', cursor: 'pointer', color: T.red }}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div style={{ padding: 40, textAlign: 'center', color: T.muted, fontSize: 13 }}>{t('superAdmin.noSchools')}</div>
        )}
      </div>

      {/* Modals */}
      {modal === 'renew' && (
        <Modal title={t('superAdmin.renewTitle')} onClose={() => setModal(null)}>
          <p style={{ fontSize: 13, color: T.muted, marginBottom: 16 }}>
            {t('superAdmin.renewConfirm')} <strong style={{ color: T.text }}>{modalData.schoolName}</strong> {t('superAdmin.renewDays')}
          </p>
          <button onClick={() => doAction('renew', modalData.schoolId, { days: 365 })}
            disabled={actionLoading}
            style={{ width: '100%', background: T.green, border: 'none', borderRadius: 8, padding: 10, color: '#fff', fontWeight: 600, cursor: 'pointer' }}>
            {actionLoading ? t('superAdmin.progress') : t('superAdmin.renewAction')}
          </button>
        </Modal>
      )}

      {modal === 'addDays' && (
        <Modal title={t('superAdmin.addDaysTitle')} onClose={() => setModal(null)}>
          <p style={{ fontSize: 13, color: T.muted, marginBottom: 12 }}>
            {t('superAdmin.addDaysConfirm')} <strong style={{ color: T.text }}>{modalData.schoolName}</strong>
          </p>
          <input
            type="number"
            min="1"
            max="365"
            value={modalData.days || ''}
            onChange={e => setModalData({ ...modalData, days: parseInt(e.target.value) || 0 })}
            placeholder={t('superAdmin.daysPlaceholder')}
            style={{ width: '100%', background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, padding: 10, color: T.text, marginBottom: 16 }}
          />
          <button onClick={() => doAction('add-days', modalData.schoolId, { days: modalData.days })}
            disabled={actionLoading || !modalData.days}
            style={{ width: '100%', background: T.blue, border: 'none', borderRadius: 8, padding: 10, color: '#fff', fontWeight: 600, cursor: 'pointer' }}>
            {actionLoading ? t('superAdmin.progress') : t('superAdmin.addAction')}
          </button>
        </Modal>
      )}

      {modal === 'resetPassword' && (
        <Modal title={t('superAdmin.resetTitle')} onClose={() => setModal(null)}>
          <p style={{ fontSize: 13, color: T.muted, marginBottom: 12 }}>
            {t('superAdmin.resetConfirm')} <strong style={{ color: T.text }}>{modalData.schoolName}</strong>
          </p>
          <input
            type="text"
            value={modalData.newPassword || ''}
            onChange={e => setModalData({ ...modalData, newPassword: e.target.value })}
            placeholder={t('superAdmin.passwordPlaceholder')}
            style={{ width: '100%', background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, padding: 10, color: T.text, marginBottom: 16 }}
          />
          <button onClick={() => doAction('reset-password', modalData.schoolId, { newPassword: modalData.newPassword })}
            disabled={actionLoading || !modalData.newPassword || modalData.newPassword.length < 6}
            style={{ width: '100%', background: T.accent, border: 'none', borderRadius: 8, padding: 10, color: '#fff', fontWeight: 600, cursor: 'pointer' }}>
            {actionLoading ? t('superAdmin.progress') : t('superAdmin.resetAction')}
          </button>
        </Modal>
      )}
    </div>
  );
}