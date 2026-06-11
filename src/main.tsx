import './i18n';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { withErrorOverlay } from './components/with-error-overlay';

const AppWithErrorOverlay = withErrorOverlay(App);

// DISABLED: Service Worker was intercepting API calls to Supabase
// Only enable in production builds after fixing fetch interception
// if ('serviceWorker' in navigator && import.meta.env.PROD) {
//   window.addEventListener('load', () => {
//     navigator.serviceWorker.register('/sw.js')
//       .then((registration) => {
//         console.log('SW registered:', registration);
//       })
//       .catch((error) => {
//         console.log('SW registration failed:', error);
//       });
//   });
// }

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppWithErrorOverlay />
  </StrictMode>,
)
