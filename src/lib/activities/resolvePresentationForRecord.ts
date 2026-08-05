import type { ActivityPresentationType } from '../../components/business/ActivityCard';
import type { Business, EngagementKind } from '../../types/models';
import type { OperatingModel } from '../../types/workspace';
import { resolveWorkspaceConfig } from '../workspace';

/**
 * Resolve presentationType for a production activity record.
 * Order: stored → source/kind mapping → workspace default → generic.
 */
export function resolvePresentationForRecord(
  business: Business | null,
  params: {
    source: 'event' | 'engagement';
    engagementKind?: EngagementKind;
    storedPresentation?: ActivityPresentationType | null;
  },
): ActivityPresentationType {
  if (params.storedPresentation) return params.storedPresentation;

  if (params.source === 'engagement') {
    if (params.engagementKind === 'session_pack') return 'package';
    if (params.engagementKind === 'recurring_group') return 'recurring';
    if (params.engagementKind === 'project') {
      const config = resolveWorkspaceConfig(business);
      const primary = config?.workspace.primaryOperatingModel;
      const enabled = config?.workspace.enabledOperatingModels ?? [];
      if (primary === 'journey') return 'journey';
      if (enabled.includes('journey') && !enabled.includes('project')) return 'journey';
      return 'project';
    }
  }

  const config = resolveWorkspaceConfig(business);
  const primary: OperatingModel = config?.workspace.primaryOperatingModel ?? 'event';
  if (primary === 'appointment') return 'appointment';
  if (primary === 'event') return 'event';
  if (params.source === 'event') return 'event';

  const fromWorkspace = config?.defaultCardPresentation;
  if (fromWorkspace && fromWorkspace !== 'generic') return fromWorkspace;

  return 'generic';
}
