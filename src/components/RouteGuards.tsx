import { Navigate, Outlet } from 'react-router-dom';
import { useStoreHydration } from '../hooks/useStoreHydration';
import { useAppStore } from '../store/useAppStore';
import { LoadingScreen } from './LoadingScreen';

export function RequireGuest() {
  const hydrated = useStoreHydration();
  const user = useAppStore((s) => s.user);
  const business = useAppStore((s) => s.business);

  if (!hydrated) return <LoadingScreen />;
  if (user && business) return <Navigate to="/" replace />;
  if (user) return <Navigate to="/onboarding" replace />;
  return <Outlet />;
}

export function RequireUser() {
  const hydrated = useStoreHydration();
  const user = useAppStore((s) => s.user);

  if (!hydrated) return <LoadingScreen />;
  if (!user) return <Navigate to="/auth" replace />;
  return <Outlet />;
}

export function RequireBusiness() {
  const hydrated = useStoreHydration();
  const business = useAppStore((s) => s.business);

  if (!hydrated) return <LoadingScreen />;
  if (!business) return <Navigate to="/onboarding" replace />;
  return <Outlet />;
}

export function RootRedirect() {
  const hydrated = useStoreHydration();
  const user = useAppStore((s) => s.user);
  const business = useAppStore((s) => s.business);

  if (!hydrated) return <LoadingScreen />;
  if (!user) return <Navigate to="/auth" replace />;
  if (!business) return <Navigate to="/onboarding" replace />;
  return <Navigate to="/dashboard" replace />;
}
