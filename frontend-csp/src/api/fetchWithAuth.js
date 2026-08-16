import { cacheApiResponse, getCachedApiResponse, addPendingAction } from '../utils/offlineDb';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

let refreshPromise = null;

async function refreshAccessToken() {
  if (refreshPromise) return refreshPromise;
  refreshPromise = (async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) throw new Error('Aucun refresh token');
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) throw new Error('Refresh token invalide');
    const data = await res.json();
    localStorage.setItem('accessToken', data.accessToken);
    if (data.refreshToken) localStorage.setItem('refreshToken', data.refreshToken);
    return data.accessToken;
  })().finally(() => {
    refreshPromise = null;
  });
  return refreshPromise;
}

function clearSession() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('mustChangePassword');
  window.dispatchEvent(new CustomEvent('auth:unauthorized'));
}

function isNetworkError(err) {
  return !navigator.onLine || (err instanceof TypeError && /failed to fetch|network/i.test(err.message));
}

export async function fetchWithAuth(endpoint, options = {}) {
  const token = localStorage.getItem('accessToken');
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const method = (options.method || 'GET').toUpperCase();
  const isGet = method === 'GET';

  const doFetch = async (authHeaders) => {
    const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers: authHeaders });
    return res;
  };

  try {
    let res = await doFetch(headers);

    // Token expiré : on tente un refresh une seule fois, puis on rejoue la requête
    if (res.status === 401 && token) {
      try {
        const newToken = await refreshAccessToken();
        res = await doFetch({ ...headers, Authorization: `Bearer ${newToken}` });
      } catch {
        clearSession();
        throw new Error('Session expirée, veuillez vous reconnecter');
      }
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
    if (isGet && isNetworkError(err)) {
      const cached = await getCachedApiResponse(endpoint).catch(() => null);
      if (cached) return cached.data;
    }

    if (!isGet && isNetworkError(err)) {
      const clientId = `cid-${crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2)}`;
      await addPendingAction({
        endpoint,
        method,
        clientId,
        body: options.body ? JSON.parse(options.body) : null,
      });
      throw new Error('Hors ligne — action enregistrée pour sync ultérieur');
    }

    throw err;
  }
}
