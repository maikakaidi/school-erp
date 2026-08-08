import { getPendingActions, clearPendingAction } from '../utils/offlineDb';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

export async function syncPendingActions() {
  const actions = await getPendingActions();
  if (!actions || actions.length === 0) return;

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
        },
        body: action.body ? JSON.stringify(action.body) : undefined,
      });

      if (res.ok) {
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

// Auto-sync on reconnect
let syncInProgress = false;

export function setupOnlineSync() {
  if (typeof window === 'undefined') return;

  window.addEventListener('online', async () => {
    if (syncInProgress) return;
    syncInProgress = true;
    console.log('[API-SCHOOL] Back online — syncing pending actions...');
    try {
      const result = await syncPendingActions();
      if (result && result.total > 0) {
        console.log(`[API-SCHOOL] Sync complete: ${result.synced}/${result.total} synced, ${result.failed} failed`);
        // Notify the app
        window.dispatchEvent(new CustomEvent('sync-complete', { detail: result }));
      }
    } catch (err) {
      console.error('[API-SCHOOL] Sync failed:', err);
    } finally {
      syncInProgress = false;
    }
  });
}
