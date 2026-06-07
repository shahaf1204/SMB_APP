import { StrictMode, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, useLocation } from 'react-router-dom';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import { saveAccountSnapshot, flushAccountSnapshot } from './lib/accountArchive';
import { ensureAccountInRegistry } from './lib/accountsRegistry';
import { runBootstrapResetFromUrl } from './lib/safeStorage';
import { useAppStore } from './store/useAppStore';
import './styles/global.css';

runBootstrapResetFromUrl();

useAppStore.persist.onFinishHydration(() => {
  const state = useAppStore.getState();
  if (state.user?.email) {
    ensureAccountInRegistry(state.user);
    flushAccountSnapshot(state);
  }
});

let archiveTimer: ReturnType<typeof setTimeout> | undefined;
useAppStore.subscribe((state) => {
  if (!state.user?.email) return;
  if (archiveTimer) clearTimeout(archiveTimer);
  archiveTimer = setTimeout(() => {
    saveAccountSnapshot(state.user!.displayName, state.user!.email, state);
    ensureAccountInRegistry(state.user!);
  }, 300);
});

window.addEventListener('beforeunload', () => {
  const state = useAppStore.getState();
  if (state.user?.email) {
    saveAccountSnapshot(state.user.displayName, state.user.email, state);
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
