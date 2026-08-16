import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { Eye, EyeOff } from 'lucide-react';

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
  const [mode, setMode] = useState('school'); // school | parent | enseignant | eleve
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [phone, setPhone] = useState('');
  const [schoolPhone, setSchoolPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login, user } = useAuth();

  // Redirige un utilisateur déjà connecté
  useEffect(() => {
    if (user?.role === 'parent') navigate('/parent', { replace: true });
    else if (user?.role === 'enseignant') navigate('/enseignant', { replace: true });
    else if (user?.role === 'eleve') navigate('/eleve', { replace: true });
    else if (user?.role === 'super_admin') navigate('/super-admin', { replace: true });
    else if (user?.role === 'school') navigate('/', { replace: true });
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      let endpoint, body;
      if (mode === 'parent') {
        endpoint = '/api/auth/login-parent';
        body = { schoolPhone, phone, password };
      } else if (mode === 'enseignant') {
        endpoint = '/api/auth/login-enseignant';
        body = { schoolPhone, phone, password };
      } else if (mode === 'eleve') {
        endpoint = '/api/auth/login-eleve';
        body = { schoolPhone, matricule: phone, password };
      } else if (isSuperAdmin) {
        endpoint = '/api/auth/login-super-admin';
        body = { phone, password };
      } else {
        endpoint = '/api/auth/login';
        body = { phone, password };
      }
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Erreur de connexion');
      const schoolData = data.school || (mode === 'parent' ? { name: data.school?.name } : null);
      login(data.accessToken, data.refreshToken, schoolData, data.mustChangePassword);
      if (data.mustChangePassword) {
        navigate('/change-password');
        return;
      }
      if (mode === 'parent') navigate('/parent');
      else if (mode === 'enseignant') navigate('/enseignant');
      else if (mode === 'eleve') navigate('/eleve');
      else if (isSuperAdmin) navigate('/super-admin');
      else navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const tab = (key, label) => (
    <button
      type="button"
      onClick={() => { setMode(key); setError(''); }}
      style={{
        flex: 1, padding: '9px 0', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600,
        background: mode === key ? T.accent + '25' : 'transparent',
        border: mode === key ? `1px solid ${T.accent}60` : `1px solid ${T.border}`,
        color: mode === key ? T.accent : T.muted,
      }}
    >
      {label}
    </button>
  );

  return (
    <div style={{ minHeight: '100vh', background: T.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, padding: 28, width: 400, maxWidth: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: 22 }}>
          <div style={{
            width: 50, height: 50, borderRadius: 12, margin: '0 auto 12px',
            background: `linear-gradient(135deg, ${T.accent}, #9a6010)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: "'Fraunces', serif", fontWeight: 900, fontSize: 22, color: '#fff',
          }}>A</div>
          <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 20, color: T.text, margin: 0 }}>
            {t('app.name')} — Connexion
          </h2>
          <p style={{ fontSize: 12, color: T.muted, marginTop: 4 }}>{t('app.tagline')}</p>
        </div>

        <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
          {tab('school', 'École')}
          {tab('parent', 'Parent')}
          {tab('enseignant', 'Enseignant')}
          {tab('eleve', 'Élève')}
        </div>

        <form onSubmit={handleSubmit}>
          {(mode === 'parent' || mode === 'enseignant' || mode === 'eleve') && (
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, color: T.muted }}>Téléphone de l'établissement</label>
              <input
                type="tel"
                value={schoolPhone}
                onChange={(e) => setSchoolPhone(e.target.value)}
                required
                style={{ width: '100%', background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, padding: '10px', color: T.text, marginTop: 4, boxSizing: 'border-box' }}
              />
            </div>
          )}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 13, color: T.muted }}>
              {mode === 'parent' ? 'Téléphone du parent' : mode === 'enseignant' ? "Téléphone de l'enseignant" : mode === 'eleve' ? "Matricule de l'élève" : t('auth.phone')}
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              style={{ width: '100%', background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, padding: '10px', color: T.text, marginTop: 4, boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 13, color: T.muted }}>{t('auth.password')}</label>
            <div style={{ position: 'relative', marginTop: 4 }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ width: '100%', background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, padding: '10px', paddingRight: 40, color: T.text, boxSizing: 'border-box' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(s => !s)}
                title={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer', color: T.muted, display: 'flex', alignItems: 'center', padding: 4 }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {mode === 'school' && (
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
          )}

          {error && <div style={{ color: '#b83838', fontSize: 12, marginBottom: 16 }}>{error}</div>}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', background: T.accent, border: 'none', borderRadius: 8,
              padding: '11px', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: 14,
            }}
          >
            {loading ? 'Connexion...' : t('auth.connect')}
          </button>
        </form>

        {mode === 'school' && (
          <p style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: T.muted }}>
            {t('auth.noAccount')} <a href="/register" style={{ color: T.accent }}>{t('auth.register')}</a>
          </p>
        )}
      </div>
    </div>
  );
}
