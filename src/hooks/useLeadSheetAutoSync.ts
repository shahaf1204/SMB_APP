import { useCallback, useEffect, useRef } from 'react';
import { loadLeadSheetSettings } from '../lib/leadSheetSettings';
import { syncLeadsFromGoogleSheet } from '../lib/leadSheetSync';
import { useAppStore } from '../store/useAppStore';

/** סנכרון אוטומטי של לידים מ-Google Sheets בפתיחת האפליקציה */
export function useLeadSheetAutoSync(): void {
  const business = useAppStore((s) => s.business);
  const addLead = useAppStore((s) => s.addLead);
  const syncingRef = useRef(false);

  const runSync = useCallback(async () => {
    const settings = loadLeadSheetSettings();
    if (!settings.autoSync || !settings.sheetId || syncingRef.current) return;
    syncingRef.current = true;
    try {
      await syncLeadsFromGoogleSheet(
        (lead) => addLead(lead),
        useAppStore.getState().leads,
      );
    } finally {
      syncingRef.current = false;
    }
  }, [addLead]);

  useEffect(() => {
    if (!business) return;
    void runSync();
  }, [business, runSync]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible' && business) {
        void runSync();
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [business, runSync]);
}
