
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import './i18n.js'
import { SchoolProvider } from './context/SchoolContext.jsx'
import { setupOnlineSync } from './api/syncPending.js'

setupOnlineSync();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <SchoolProvider>
      <App />
    </SchoolProvider>
  </React.StrictMode>
)

if ('serviceWorker' in navigator) {
  if (import.meta.env.PROD) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    });
  } else {
    navigator.serviceWorker.getRegistrations()
      .then((regs) => Promise.all(regs.map((r) => r.unregister())))
      .catch(() => {});
    if (window.caches) {
      caches.keys()
        .then((keys) => Promise.all(keys.filter((k) => k.startsWith('api-school')).map((k) => caches.delete(k))))
        .catch(() => {});
    }
  }
}
