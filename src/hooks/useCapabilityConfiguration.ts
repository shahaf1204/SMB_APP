import { useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';
import {
  resolveCapabilityConfigurationFromWorkspace,
  type ResolvedCapabilityConfiguration,
} from '../lib/capabilities';

/**
 * Runtime capability recommendations + enabled profile for the active business.
 * Phase 2A: read-only foundation — no UI or behavior gating wired yet.
 */
export function useCapabilityConfiguration(): ResolvedCapabilityConfiguration | null {
  const business = useAppStore((s) => s.business);
  return useMemo(
    () =>
      resolveCapabilityConfigurationFromWorkspace(
        business?.workspace ?? null,
        business?.presetId,
      ),
    [business?.workspace, business?.presetId],
  );
}
