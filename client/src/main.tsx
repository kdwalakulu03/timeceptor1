import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// ── Register service worker for PWA + Push ───────────────────────────────
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const reg = await navigator.serviceWorker.register('/sw.js');
      console.log('[sw] registered, scope:', reg.scope);
    } catch (e) {
      console.warn('[sw] registration failed:', e);
    }
  });

  // Fetch VAPID public key from server and expose globally
  fetch('/api/push/vapid-public-key')
    .then(r => r.json())
    .then(d => { if (d.key) (window as any).__VAPID_PUBLIC_KEY__ = d.key; })
    .catch(() => { /* push not configured */ });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
