import { StrictMode, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, useLocation } from 'react-router-dom';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import { saveAccountSnapshot } from './lib/accountArchive';
import { runBootstrapResetFromUrl } from './lib/safeStorage';
import { useAppStore } from './store/useAppStore';
import './styles/global.css';

runBootstrapResetFromUrl();

let archiveTimer: ReturnType<typeof setTimeout> | undefined;
useAppStore.subscribe((state) => {
  if (!state.user) return;
  if (!state.business && state.events.length === 0) return;
  if (archiveTimer) clearTimeout(archiveTimer);
  archiveTimer = setTimeout(
    () => saveAccountSnapshot(state.user!.displayName, state.user!.email, state),
    800,
  );
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
