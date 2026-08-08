import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext();

function decodeToken(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
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
        setUser({ token, ...decoded });
      } else {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
      }
    }
    setLoading(false);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
  }, []);

  useEffect(() => {
    const onUnauthorized = () => logout();
    window.addEventListener('auth:unauthorized', onUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', onUnauthorized);
  }, [logout]);

  const login = (accessToken, refreshToken, schoolData) => {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    const decoded = decodeToken(accessToken);
    setUser({ token: accessToken, ...decoded, schoolName: schoolData?.name });
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
