import { useMemo } from 'react';
import { useWorkspaceConfig } from './useWorkspaceConfig';

/** Hebrew terminology from workspace config */
export function useBusinessTerminology() {
  const config = useWorkspaceConfig();
  return useMemo(
    () =>
      config?.terminology ?? {
        activitySingular: 'פעילות',
        activityPlural: 'פעילויות',
        clientSingular: 'לקוח',
        clientPlural: 'לקוחות',
      },
    [config],
  );
}
