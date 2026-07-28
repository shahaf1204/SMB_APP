import type { ActivityPresentationType } from '../../components/business/ActivityCard';
import type { Business } from '../../types/models';
import { resolveWorkspaceConfig } from '../workspace';

type ActivityWithPresentation = {
  presentationType?: ActivityPresentationType | null;
  activityType?: string | null;
};

const VALID_PRESENTATIONS = new Set<ActivityPresentationType>([
  'event',
  'appointment',
  'journey',
  'package',
  'project',
  'recurring',
  'generic',
]);

/**
 * Resolve ActivityCard presentationType for a production activity.
 * Order: stored presentation → workspace cardPresentation → generic.
 * Never infers from title or preset names.
 */
export function resolvePresentationType(
  business: Business | null,
  activity?: ActivityWithPresentation | null,
): ActivityPresentationType {
  const stored = activity?.presentationType;
  if (stored && VALID_PRESENTATIONS.has(stored)) {
    return stored;
  }

  const config = resolveWorkspaceConfig(business);
  const fromWorkspace = config?.defaultCardPresentation;
  if (fromWorkspace && VALID_PRESENTATIONS.has(fromWorkspace)) {
    return fromWorkspace;
  }

  return 'generic';
}
