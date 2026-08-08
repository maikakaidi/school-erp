import { cacheApiResponse, getCachedApiResponse, addPendingAction } from '../utils/offlineDb';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

export async function fetchWithAuth(endpoint, options = {}) {
  const token = localStorage.getItem('accessToken');
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const method = (options.method || 'GET').toUpperCase();
  const isGet = method === 'GET';

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });

    if (res.status === 401) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      window.dispatchEvent(new CustomEvent('auth:unauthorized'));
      throw new Error('Session expirée, veuillez vous reconnecter');
    }

    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.message || `Erreur HTTP ${res.status}`);
    }

    if (res.status === 204) return null;
    const data = await res.json();

    if (isGet) {
      await cacheApiResponse(endpoint, data).catch(() => {});
    }

    return data;
  } catch (err) {
    if (isGet && !navigator.onLine) {
      const cached = await getCachedApiResponse(endpoint).catch(() => null);
      if (cached) return cached;
    }

    if (!isGet && !navigator.onLine) {
      await addPendingAction({
        endpoint,
        method,
        body: options.body ? JSON.parse(options.body) : null,
      });
      throw new Error('Hors ligne — action enregistrée pour sync ultérieur');
    }

    throw err;
  }
}
