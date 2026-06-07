import { Navigate, Outlet } from 'react-router-dom';
import { useAutoLoginFromRememberMe } from '../hooks/useAutoLoginFromRememberMe';
import { useAppStore } from '../store/useAppStore';
import { LoadingScreen } from './LoadingScreen';

export function RequireGuest() {
  const ready = useAutoLoginFromRememberMe();
  const user = useAppStore((s) => s.user);
  const business = useAppStore((s) => s.business);

  if (!ready) return <LoadingScreen />;
  if (user && business) return <Navigate to="/dashboard" replace />;
  if (user) return <Navigate to="/onboarding" replace />;
  return <Outlet />;
}

export function RequireUser() {
  const ready = useAutoLoginFromRememberMe();
  const user = useAppStore((s) => s.user);

  if (!ready) return <LoadingScreen />;
  if (!user) return <Navigate to="/auth" replace />;
  return <Outlet />;
}

export function RequireBusiness() {
  const ready = useAutoLoginFromRememberMe();
  const business = useAppStore((s) => s.business);

  if (!ready) return <LoadingScreen />;
  if (!business) return <Navigate to="/onboarding" replace />;
  return <Outlet />;
}

export function RootRedirect() {
  const ready = useAutoLoginFromRememberMe();
  const user = useAppStore((s) => s.user);
  const business = useAppStore((s) => s.business);

  if (!ready) return <LoadingScreen />;
  if (!user) return <Navigate to="/auth" replace />;
  if (!business) return <Navigate to="/onboarding" replace />;
  return <Navigate to="/dashboard" replace />;
}
