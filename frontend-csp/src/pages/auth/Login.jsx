import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';

const T = {
  card: '#0c1c2c',
  border: '#1a3050',
  accent: '#d4921a',
  text: '#ddd0b8',
  muted: '#486070',
  bg: '#06101a',
};

export default function Login() {
  const { t } = useTranslation();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const endpoint = isSuperAdmin ? '/api/auth/login-super-admin' : '/api/auth/login';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Erreur de connexion');
      login(data.accessToken, data.refreshToken, data.school || { name: 'Super Admin' });
      navigate(isSuperAdmin ? '/super-admin' : '/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: T.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, padding: 32, width: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{
            width: 50, height: 50, borderRadius: 12, margin: '0 auto 12px',
            background: `linear-gradient(135deg, ${T.accent}, #9a6010)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: "'Fraunces', serif", fontWeight: 900, fontSize: 22, color: '#fff',
          }}>A</div>
          <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 22, color: T.text }}>
            {isSuperAdmin ? t('auth.loginSuperAdmin') : t('auth.loginSchool')}
          </h2>
          <p style={{ fontSize: 12, color: T.muted, marginTop: 4 }}>{t('app.name')} — {t('app.tagline')}</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 13, color: T.muted }}>{t('auth.phone')}</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              style={{ width: '100%', background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, padding: '10px', color: T.text, marginTop: 4 }}
            />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={{ fontSize: 13, color: T.muted }}>{t('auth.password')}</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ width: '100%', background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, padding: '10px', color: T.text, marginTop: 4 }}
            />
          </div>

          <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="checkbox"
              id="superAdmin"
              checked={isSuperAdmin}
              onChange={(e) => setIsSuperAdmin(e.target.checked)}
              style={{ accentColor: T.accent }}
            />
            <label htmlFor="superAdmin" style={{ fontSize: 13, color: T.muted, cursor: 'pointer' }}>
              {t('auth.loginSuperAdmin')}
            </label>
          </div>

          {error && <div style={{ color: '#b83838', fontSize: 12, marginBottom: 16 }}>{error}</div>}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', background: T.accent, border: 'none', borderRadius: 8,
              padding: '11px', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: 14,
            }}
          >
            {loading ? t('auth.connecting') : t('auth.connect')}
          </button>
        </form>

        {!isSuperAdmin && (
          <p style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: T.muted }}>
            {t('auth.noAccount')} <a href="/register" style={{ color: T.accent }}>{t('auth.register')}</a>
          </p>
        )}
      </div>
    </div>
  );
}
