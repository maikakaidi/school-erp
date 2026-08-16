import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext();

function decodeToken(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (payload.actorType) {
      return {
        schoolId: payload.schoolId || null,
        actorType: payload.actorType,
        actorId: payload.actorId || null,
        role: payload.role || payload.actorType,
        exp: payload.exp,
      };
    }
    return {
      schoolId: payload.schoolId || null,
      superAdminId: payload.superAdminId || null,
      role: payload.superAdminId ? 'super_admin' : 'school',
      exp: payload.exp,
    };
  } catch { return null; }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      const decoded = decodeToken(token);
      if (decoded && decoded.exp * 1000 > Date.now()) {
        setUser({
          token,
          ...decoded,
          mustChangePassword: localStorage.getItem('mustChangePassword') === 'true',
        });
      } else {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('mustChangePassword');
      }
    }
    setLoading(false);
  }, []);

  const logout = useCallback(() => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      }).catch(() => {});
    }
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('mustChangePassword');
    setUser(null);
  }, []);

  useEffect(() => {
    const onUnauthorized = () => logout();
    window.addEventListener('auth:unauthorized', onUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', onUnauthorized);
  }, [logout]);

  const login = (accessToken, refreshToken, schoolData, mustChangePassword) => {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    if (mustChangePassword) localStorage.setItem('mustChangePassword', 'true');
    else localStorage.removeItem('mustChangePassword');
    const decoded = decodeToken(accessToken);
    setUser({ token: accessToken, ...decoded, mustChangePassword: !!mustChangePassword, schoolName: schoolData?.name });
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
