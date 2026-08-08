import { useState, useEffect } from 'react';
import { WifiOff, Wifi, CheckCircle } from 'lucide-react';

export default function OfflineBanner() {
  const [offline, setOffline] = useState(!navigator.onLine);
  const [syncResult, setSyncResult] = useState(null);

  useEffect(() => {
    const onOnline = () => { setOffline(false); setSyncResult(null); };
    const onOffline = () => { setOffline(true); setSyncResult(null); };
    const onSync = (e) => setSyncResult(e.detail);

    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    window.addEventListener('sync-complete', onSync);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
      window.removeEventListener('sync-complete', onSync);
    };
  }, []);

  if (syncResult && syncResult.synced > 0) {
    return (
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999,
        background: '#1d9468', color: '#fff',
        padding: '8px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        fontSize: 13, fontWeight: 600, transition: 'opacity 0.5s',
      }}>
        <CheckCircle size={14} />
        Synchronisé — {syncResult.synced} action(s) en ligne
      </div>
    );
  }

  if (syncResult && syncResult.failed > 0) {
    return (
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999,
        background: '#d4921a', color: '#fff',
        padding: '8px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        fontSize: 13, fontWeight: 600,
      }}>
        <Wifi size={14} />
        En ligne — {syncResult.failed} action(s) en échec
      </div>
    );
  }

  if (!offline) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999,
      background: '#b83838', color: '#fff',
      padding: '8px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      fontSize: 13, fontWeight: 600,
    }}>
      <WifiOff size={14} />
      Mode hors ligne — les modifications seront synchronisées à la reconnexion
    </div>
  );
}
