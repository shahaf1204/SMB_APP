import { StrictMode, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, useLocation } from 'react-router-dom';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import { saveAccountSnapshot, flushAccountSnapshot } from './lib/accountArchive';
import { ensureAccountInRegistry } from './lib/accountsRegistry';
import { flushCloudPush } from './lib/cloudSync';
import { isSupabaseConfigured } from './lib/supabase';
import { runBootstrapResetFromUrl } from './lib/safeStorage';
import { useAppStore } from './store/useAppStore';
import './styles/global.css';
import './styles/design-refresh.css';

runBootstrapResetFromUrl();

useAppStore.persist.onFinishHydration(() => {
  const state = useAppStore.getState();
  if (state.user?.email) {
    ensureAccountInRegistry(state.user);
    if (!isSupabaseConfigured()) {
      flushAccountSnapshot(state);
    }
  }
});

let archiveTimer: ReturnType<typeof setTimeout> | undefined;
useAppStore.subscribe((state) => {
  if (!state.user?.email) return;
  if (archiveTimer) clearTimeout(archiveTimer);
  archiveTimer = setTimeout(() => {
    if (!isSupabaseConfigured()) {
      saveAccountSnapshot(state.user!.displayName, state.user!.email, state);
    }
    ensureAccountInRegistry(state.user!);
  }, 300);
});

window.addEventListener('beforeunload', () => {
  const state = useAppStore.getState();
  if (state.user?.email) {
    if (isSupabaseConfigured()) {
      void flushCloudPush();
    } else {
      saveAccountSnapshot(state.user.displayName, state.user.email, state);
    }
  }
});

function RouteErrorBoundary({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  return <ErrorBoundary key={pathname}>{children}</ErrorBoundary>;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <RouteErrorBoundary>
        <App />
      </RouteErrorBoundary>
    </BrowserRouter>
  </StrictMode>,
);
