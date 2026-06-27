import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { GlobalSearch } from './GlobalSearch';
import { useCloudSync } from '../hooks/useCloudSync';
import { useCrmSync } from '../hooks/useCrmSync';
import { useIntegrationSync } from '../hooks/useIntegrationSync';
import { useExternalFormSync } from '../hooks/useExternalFormSync';
import { FormNotificationBanner } from './externalForms/FormNotificationBanner';
import { useLeadSheetAutoSync } from '../hooks/useLeadSheetAutoSync';
import { runEventReminderCheck } from '../lib/eventReminders';
import { useAppStore } from '../store/useAppStore';
import { AutoSaveIndicator } from './AutoSaveIndicator';

const HIDE_SEARCH_PATHS = ['/auth', '/onboarding'];

export function BusinessLayout() {
  const events = useAppStore((s) => s.events);
  const business = useAppStore((s) => s.business);
  const { pathname } = useLocation();

  useCrmSync();
  useCloudSync();
  useIntegrationSync();
  useExternalFormSync();
  useLeadSheetAutoSync();

  useEffect(() => {
    if (!business || events.length === 0) return;
    void runEventReminderCheck(events);
  }, [business, events]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible' && business) {
        void runEventReminderCheck(useAppStore.getState().events);
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [business]);

  const showSearch = !HIDE_SEARCH_PATHS.some((p) => pathname.startsWith(p));

  return (
    <>
      <AutoSaveIndicator />
      <FormNotificationBanner />
      {showSearch && (
        <div className="app-global-search-bar">
          <GlobalSearch />
        </div>
      )}
      <Outlet />
    </>
  );
}
