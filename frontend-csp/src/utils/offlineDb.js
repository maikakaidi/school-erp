const DB_NAME = 'api-school-offline';
const DB_VERSION = 1;

const STORES = {
  eleves: 'idb-eleves',
  notes: 'idb-notes',
  bulletins: 'idb-bulletins',
  versements: 'idb-versements',
  settings: 'idb-settings',
  pendingActions: 'idb-pending-actions',
};

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      Object.values(STORES).forEach((store) => {
        if (!db.objectStoreNames.contains(store)) {
          db.createObjectStore(store, { keyPath: 'id' });
        }
      });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveToStore(storeName, data) {
  const db = await openDB();
  const tx = db.transaction(storeName, 'readwrite');
  const store = tx.objectStore(storeName);
  if (Array.isArray(data)) {
    data.forEach((item) => store.put(item));
  } else {
    store.put(data);
  }
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}

export async function getFromStore(storeName) {
  const db = await openDB();
  const tx = db.transaction(storeName, 'readonly');
  const store = tx.objectStore(storeName);
  const request = store.getAll();
  return new Promise((resolve, reject) => {
    request.onsuccess = () => { db.close(); resolve(request.result); };
    request.onerror = () => { db.close(); reject(request.error); };
  });
}

export async function deleteFromStore(storeName, id) {
  const db = await openDB();
  const tx = db.transaction(storeName, 'readwrite');
  const store = tx.objectStore(storeName);
  store.delete(id);
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}

export async function clearStore(storeName) {
  const db = await openDB();
  const tx = db.transaction(storeName, 'readwrite');
  const store = tx.objectStore(storeName);
  store.clear();
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}

export async function addPendingAction(action) {
  const clientId = action.clientId || `cid-${crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2)}`;
  const db = await openDB();
  const tx = db.transaction(STORES.pendingActions, 'readwrite');
  const store = tx.objectStore(STORES.pendingActions);
  const record = {
    id: `pending-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    clientId,
    ...action,
    timestamp: new Date().toISOString(),
    synced: false,
    retries: 0,
  };
  store.put(record);
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => { db.close(); resolve(record); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}

export async function getPendingActions() {
  return getFromStore(STORES.pendingActions);
}

export async function clearPendingAction(id) {
  return deleteFromStore(STORES.pendingActions, id);
}

export async function incrementRetry(id) {
  const db = await openDB();
  const tx = db.transaction(STORES.pendingActions, 'readwrite');
  const store = tx.objectStore(STORES.pendingActions);
  const req = store.get(id);
  return new Promise((resolve, reject) => {
    req.onsuccess = () => {
      const record = req.result;
      if (record) {
        record.retries = (record.retries || 0) + 1;
        store.put(record);
      }
      tx.oncomplete = () => { db.close(); resolve(record); };
    };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}

export async function clearStaleActions(maxRetries = 5) {
  const actions = await getPendingActions();
  const stale = actions.filter(a => (a.retries || 0) >= maxRetries);
  for (const a of stale) {
    await clearPendingAction(a.id);
  }
  return stale.length;
}

export async function cacheApiResponse(key, data) {
  return saveToStore(STORES.settings, { id: key, data, cachedAt: Date.now() });
}

export async function getCachedApiResponse(key) {
  const all = await getFromStore(STORES.settings);
  const record = all.find((r) => r.id === key);
  if (!record) return null;
  return { data: record.data, cachedAt: record.cachedAt };
}

export { STORES };
