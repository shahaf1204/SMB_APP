import {
  OPERATING_MODEL_CREATE_ROUTE,
  QUICK_ACTION_LABELS_HE,
} from '../../config/operatingModelConfig';
import type { Business } from '../../types/models';
import type { OperatingModel } from '../../types/workspace';
import { resolveWorkspaceConfig } from './resolve';

export interface EnabledCreationModel {
  id: OperatingModel;
  /** Hebrew label e.g. "פרויקט חדש" */
  label: string;
  route: string;
  isPrimary: boolean;
}

const CREATE_LABEL_KEY: Partial<Record<OperatingModel, keyof typeof QUICK_ACTION_LABELS_HE>> = {
  event: 'new_event',
  appointment: 'new_appointment',
  journey: 'new_journey',
  package: 'new_package',
  recurring: 'new_recurring',
  project: 'new_project',
};

function labelForModel(id: OperatingModel): string {
  const key = CREATE_LABEL_KEY[id];
  if (key && QUICK_ACTION_LABELS_HE[key]) return QUICK_ACTION_LABELS_HE[key];
  return 'פעילות חדשה';
}

/**
 * Returns operating models the user may create activities from.
 * Primary model first, then enabled additional models — no duplicates, no disabled models.
 */
export function getEnabledCreationModels(
  business: Business | null | undefined,
): EnabledCreationModel[] {
  const resolved = resolveWorkspaceConfig(business ?? null);
  if (!resolved) return [];

  const workspace = resolved.workspace;
  const primary = workspace.primaryOperatingModel;
  const enabled = workspace.enabledOperatingModels ?? [];

  const ordered: OperatingModel[] = [];
  const seen = new Set<OperatingModel>();

  const push = (id: OperatingModel) => {
    if (id === 'hybrid' || seen.has(id)) return;
    seen.add(id);
    ordered.push(id);
  };

  if (primary === 'hybrid') {
    for (const id of enabled) push(id);
  } else {
    push(primary);
    for (const id of enabled) {
      if (id !== primary) push(id);
    }
  }

  const primaryId = primary === 'hybrid' ? ordered[0] : primary;

  return ordered.map((id) => ({
    id,
    label: labelForModel(id),
    route: OPERATING_MODEL_CREATE_ROUTE[id],
    isPrimary: id === primaryId,
  }));
}

/** Routes that map to one or more operating models */
const CREATE_ROUTE_MODELS: Record<string, OperatingModel[]> = {
  '/create/event': ['event', 'appointment'],
  '/create/project': ['journey', 'project'],
  '/create/pack': ['package'],
  '/create/group': ['recurring'],
};

export function isCreateRouteEnabled(
  pathname: string,
  business: Business | null | undefined,
): boolean {
  if (pathname === '/create') return getEnabledCreationModels(business).length > 1;
  const enabledIds = new Set(getEnabledCreationModels(business).map((m) => m.id));
  for (const [route, modelIds] of Object.entries(CREATE_ROUTE_MODELS)) {
    if (pathname === route || pathname.startsWith(`${route}/`)) {
      return modelIds.some((id) => enabledIds.has(id));
    }
  }
  return false;
}

export function getSingleCreationRoute(business: Business | null | undefined): string | null {
  const models = getEnabledCreationModels(business);
  return models.length === 1 ? models[0].route : null;
}

export function isModelEnabled(
  business: Business | null | undefined,
  modelId: OperatingModel,
): boolean {
  return getEnabledCreationModels(business).some((m) => m.id === modelId);
}
