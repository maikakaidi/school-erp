import { getPendingActions, clearPendingAction } from '../utils/offlineDb';

const API_BASE = import.meta.env.VITE_API_URL || '/api';
const RETRY_INTERVAL = 60_000;

export async function syncPendingActions() {
  const actions = await getPendingActions();
  if (!actions || actions.length === 0) return { synced: 0, failed: 0, total: 0 };

  let synced = 0;
  let failed = 0;

  for (const action of actions) {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${API_BASE}${action.endpoint}`, {
        method: action.method,
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
          ...(action.clientId && { 'X-Client-Id': action.clientId }),
        },
        body: action.body ? JSON.stringify(action.body) : undefined,
      });

      if (res.ok || res.status === 409) {
        await clearPendingAction(action.id);
        synced++;
      } else {
        failed++;
      }
    } catch {
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
    if (result && result.total > 0) {
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
