import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import {
  getEnabledCreationModels,
  getSingleCreationRoute,
  isCreateRouteEnabled,
} from '../lib/workspace/creationModels';

/** Redirects away from create routes disabled in workspace config. */
export function useGuardCreateRoute() {
  const location = useLocation();
  const navigate = useNavigate();
  const business = useAppStore((s) => s.business);

  useEffect(() => {
    const path = location.pathname;
    if (!path.startsWith('/create')) return;
    if (isCreateRouteEnabled(path, business)) return;

    const single = getSingleCreationRoute(business);
    const models = getEnabledCreationModels(business);
    if (single) {
      navigate(single, { replace: true });
    } else if (models.length > 1) {
      navigate('/create', { replace: true });
    } else {
      navigate('/activities', { replace: true });
    }
  }, [location.pathname, business, navigate]);
}
