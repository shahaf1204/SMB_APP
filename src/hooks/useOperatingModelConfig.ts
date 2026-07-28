import { useMemo } from 'react';
import { getOperatingModelDefinition } from '../config/operatingModelConfig';
import { useWorkspaceConfig } from './useWorkspaceConfig';

/** Resolved operating model definition for the active workspace */
export function useOperatingModelConfig() {
  const config = useWorkspaceConfig();
  return useMemo(() => config?.primary ?? null, [config]);
}

export function useEnabledOperatingModels() {
  const config = useWorkspaceConfig();
  return useMemo(() => config?.enabled ?? [], [config]);
}

export function useOperatingModelDefinition(model?: Parameters<typeof getOperatingModelDefinition>[0]) {
  const config = useWorkspaceConfig();
  return useMemo(() => {
    const m = model ?? config?.workspace.primaryOperatingModel ?? 'hybrid';
    return getOperatingModelDefinition(m);
  }, [config, model]);
}
