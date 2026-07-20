import { useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';
import { resolveWorkspaceConfig } from '../lib/workspace';
import type { ResolvedWorkspaceConfig } from '../types/workspace';

export function useWorkspaceConfig(): ResolvedWorkspaceConfig | null {
  const business = useAppStore((s) => s.business);
  return useMemo(() => resolveWorkspaceConfig(business), [business]);
}
