import { resolveWorkspaceConfig } from '../workspace';
import type { Business } from '../../types/models';

export function isEventPrimaryWorkspace(business: Business | null): boolean {
  const ws = resolveWorkspaceConfig(business);
  return ws?.workspace.primaryOperatingModel === 'event';
}
