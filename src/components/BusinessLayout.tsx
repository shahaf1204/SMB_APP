import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { runEventReminderCheck } from '../lib/eventReminders';
import { useAppStore } from '../store/useAppStore';
import { AutoSaveIndicator } from './AutoSaveIndicator';

export function BusinessLayout() {
  const events = useAppStore((s) => s.events);
  const business = useAppStore((s) => s.business);

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

  return (
    <>
      <AutoSaveIndicator />
      <Outlet />
    </>
  );
}
