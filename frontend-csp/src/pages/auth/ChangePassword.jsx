import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Eye, EyeOff, ShieldCheck } from 'lucide-react';

const T = {
  card: '#0c1c2c',
  border: '#1a3050',
  accent: '#d4921a',
  text: '#ddd0b8',
  muted: '#486070',
  bg: '#06101a',
};

export default function ChangePassword() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const inputStyle = {
    width: '100%', background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8,
    padding: '10px', color: T.text, marginTop: 4, boxSizing: 'border-box',
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (newPassword !== confirm) {
      setError('Les deux nouveaux mots de passe ne correspondent pas');
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Erreur lors du changement de mot de passe');
      logout();
      navigate('/login', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div style={{ minHeight: '100vh', background: T.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, padding: 28, width: 400, maxWidth: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: 22 }}>
          <div style={{
            width: 50, height: 50, borderRadius: 12, margin: '0 auto 12px',
            background: `linear-gradient(135deg, ${T.accent}, #9a6010)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <ShieldCheck size={26} color="#fff" />
          </div>
          <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 20, color: T.text, margin: 0 }}>
            Sécurité — Nouveau mot de passe
          </h2>
          <p style={{ fontSize: 12, color: T.muted, marginTop: 4 }}>
            Pour votre sécurité, vous devez définir un nouveau mot de passe avant de continuer.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 13, color: T.muted }}>Mot de passe actuel</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              autoFocus
              style={inputStyle}
            />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 13, color: T.muted }}>Nouveau mot de passe</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                style={{ ...inputStyle, paddingRight: 40 }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(s => !s)}
                title={showPassword ? 'Masquer' : 'Afficher'}
                style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer', color: T.muted, display: 'flex', alignItems: 'center', padding: 4 }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <p style={{ fontSize: 11, color: T.muted, marginTop: 4 }}>
              Au moins 8 caractères, dont une majuscule et un chiffre.
            </p>
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 13, color: T.muted }}>Confirmer le nouveau mot de passe</label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              style={inputStyle}
            />
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
            {loading ? 'Changement en cours...' : 'Changer le mot de passe'}
          </button>
        </form>
      </div>
    </div>
  );
}
