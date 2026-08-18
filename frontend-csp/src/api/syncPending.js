import { getPendingActions, clearPendingAction, incrementRetry, clearStaleActions } from '../utils/offlineDb';

const API_BASE = import.meta.env.VITE_API_URL || '/api';
const RETRY_INTERVAL = 60_000;
const MAX_RETRIES = 5;

let refreshPromise = null;

async function refreshAccessToken() {
  if (refreshPromise) return refreshPromise;
  refreshPromise = (async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) throw new Error('No refresh token');
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) throw new Error('Refresh failed');
    const data = await res.json();
    localStorage.setItem('accessToken', data.accessToken);
    if (data.refreshToken) localStorage.setItem('refreshToken', data.refreshToken);
    return data.accessToken;
  })().finally(() => { refreshPromise = null; });
  return refreshPromise;
}

async function doSyncFetch(endpoint, method, body, clientId, token) {
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...(clientId && { 'X-Client-Id': clientId }),
  };
  return fetch(`${API_BASE}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
}

export async function syncPendingActions() {
  const actions = await getPendingActions();
  if (!actions || actions.length === 0) return { synced: 0, failed: 0, total: 0 };

  // Nettoyer les actions trop anciennes (avant de commencer)
  await clearStaleActions(MAX_RETRIES).catch(() => {});

  let token = localStorage.getItem('accessToken');
  let synced = 0;
  let failed = 0;
  let tokenRefreshFailed = false;

  for (const action of actions) {
    if (tokenRefreshFailed) { failed++; continue; }

    try {
      let res = await doSyncFetch(action.endpoint, action.method, action.body, action.clientId, token);

      // Token expiré : on refresh et on rejoue
      if (res.status === 401) {
        try {
          token = await refreshAccessToken();
          res = await doSyncFetch(action.endpoint, action.method, action.body, action.clientId, token);
        } catch {
          tokenRefreshFailed = true;
          failed++;
          continue;
        }
      }

      if (res.ok || res.status === 409) {
        await clearPendingAction(action.id);
        synced++;
      } else {
        await incrementRetry(action.id);
        failed++;
      }
    } catch {
      await incrementRetry(action.id);
      failed++;
    }
  }

  return { synced, failed, total: actions.length };
}

let syncInProgress = false;
let retryTimer = null;

async function runSync() {
  if (syncInProgress) return;
  syncInProgress = true;
  try {
    const result = await syncPendingActions();
    if (result && result.total > 0 && (result.synced > 0 || result.failed > 0)) {
      window.dispatchEvent(new CustomEvent('sync-complete', { detail: result }));
    }
  } catch (err) {
    console.error('[API-SCHOOL] Sync failed:', err);
  } finally {
    syncInProgress = false;
  }
}

export function setupOnlineSync() {
  if (typeof window === 'undefined') return;

  window.addEventListener('online', runSync);

  window.addEventListener('load', () => {
    setTimeout(runSync, 2000);
  });

  retryTimer = setInterval(async () => {
    const { getPendingActions: getPA } = await import('../utils/offlineDb.js');
    const actions = await getPA();
    if (actions && actions.length > 0 && navigator.onLine) {
      runSync();
    }
  }, RETRY_INTERVAL);
}

export function getPendingCount() {
  return getPendingActions().then((a) => a?.length || 0);
}
