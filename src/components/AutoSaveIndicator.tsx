import { useEffect, useState } from 'react';
import { useAppStore } from '../store/useAppStore';

export function AutoSaveIndicator() {
  const business = useAppStore((s) => s.business);
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  useEffect(() => {
    if (!business) return;

    const markSaved = () => setSavedAt(new Date());
    markSaved();

    const unsubStore = useAppStore.subscribe(markSaved);
    const unsubPersist = useAppStore.persist.onFinishHydration(markSaved);

    return () => {
      unsubStore();
      unsubPersist();
    };
  }, [business]);

  if (!business) return null;

  const label = savedAt
    ? `נשמר אוטומטית ${savedAt.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}`
    : 'נשמר אוטומטית במכשיר';

  return (
    <p className="auto-save-indicator" role="status">
      <span className="auto-save-dot" aria-hidden />
      {label}
    </p>
  );
}
