import { useCallback, useEffect, useRef, useState } from 'react';

export type SelectionMode = 'select' | 'deselect';

export function useDragSelection<T extends string>(
  selected: Set<T>,
  onApply: (ids: T[], mode: SelectionMode) => void,
) {
  const sessionRef = useRef<{ mode: SelectionMode; seen: Set<T> } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const endDrag = useCallback(() => {
    sessionRef.current = null;
    setIsDragging(false);
  }, []);

  useEffect(() => {
    window.addEventListener('pointerup', endDrag);
    window.addEventListener('pointercancel', endDrag);
    return () => {
      window.removeEventListener('pointerup', endDrag);
      window.removeEventListener('pointercancel', endDrag);
    };
  }, [endDrag]);

  const start = useCallback(
    (id: T) => {
      const mode: SelectionMode = selected.has(id) ? 'deselect' : 'select';
      sessionRef.current = { mode, seen: new Set([id]) };
      setIsDragging(true);
      onApply([id], mode);
    },
    [selected, onApply],
  );

  const enter = useCallback(
    (id: T) => {
      if (!sessionRef.current) return;
      if (sessionRef.current.seen.has(id)) return;
      sessionRef.current.seen.add(id);
      onApply([id], sessionRef.current.mode);
    },
    [onApply],
  );

  const startMany = useCallback(
    (ids: T[]) => {
      if (ids.length === 0) return;
      const allSelected = ids.every((id) => selected.has(id));
      const mode: SelectionMode = allSelected ? 'deselect' : 'select';
      sessionRef.current = { mode, seen: new Set(ids) };
      setIsDragging(true);
      onApply(ids, mode);
    },
    [selected, onApply],
  );

  const enterMany = useCallback(
    (ids: T[]) => {
      if (!sessionRef.current || ids.length === 0) return;
      const fresh = ids.filter((id) => !sessionRef.current!.seen.has(id));
      if (fresh.length === 0) return;
      fresh.forEach((id) => sessionRef.current!.seen.add(id));
      onApply(fresh, sessionRef.current.mode);
    },
    [onApply],
  );

  return { isDragging, start, enter, startMany, enterMany };
}
