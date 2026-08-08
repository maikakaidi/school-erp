import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const T = {
  card: '#0c1c2c',
  border: '#1a3050',
  accent: '#d4921a',
  text: '#ddd0b8',
  muted: '#486070',
  bg: '#06101a',
};

export default function RegisterSchool() {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/register-school', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Erreur inscription');
      // Auto-connexion après inscription
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: T.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, padding: 32, width: 400 }}>
        <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 24, color: T.text, marginBottom: 24 }}>{t('auth.createSchool')}</h2>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 13, color: T.muted }}>{t('auth.schoolName')}</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              style={{ width: '100%', background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, padding: '10px', color: T.text }}
            />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 13, color: T.muted }}>{t('auth.phone')}</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              style={{ width: '100%', background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, padding: '10px', color: T.text }}
            />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={{ fontSize: 13, color: T.muted }}>{t('auth.password')}</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ width: '100%', background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, padding: '10px', color: T.text }}
            />
          </div>
          <div style={{ fontSize: 12, color: T.accent, marginBottom: 16 }}>{t('auth.trialInfo')}</div>
          {error && <div style={{ color: '#b83838', fontSize: 12, marginBottom: 16 }}>{error}</div>}
          <button
            type="submit"
            disabled={loading}
            style={{ width: '100%', background: T.accent, border: 'none', borderRadius: 8, padding: '10px', color: '#fff', fontWeight: 600, cursor: 'pointer' }}
          >
            {loading ? t('auth.connecting') : t('auth.createSchool')}
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: T.muted }}>
          {t('auth.alreadyRegistered')} <a href="/login" style={{ color: T.accent }}>{t('auth.loginHere')}</a>
        </p>
      </div>
    </div>
  );
}