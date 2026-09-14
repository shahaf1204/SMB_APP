import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAutoLoginFromRememberMe } from '../hooks/useAutoLoginFromRememberMe';
import { isPasswordRecoveryPending } from '../lib/passwordRecoveryFlow';
import { useAppStore } from '../store/useAppStore';
import { LoadingScreen } from './LoadingScreen';

export function RequireGuest() {
  const ready = useAutoLoginFromRememberMe();
  const user = useAppStore((s) => s.user);
  const business = useAppStore((s) => s.business);
  const location = useLocation();
  const recoveryFlow = location.pathname === '/auth' && isPasswordRecoveryPending();

  if (!ready) return <LoadingScreen />;
  if (user && !recoveryFlow && business) return <Navigate to="/dashboard" replace />;
  if (user && !recoveryFlow) return <Navigate to="/onboarding" replace />;
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
