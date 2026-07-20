import type { Business, WorkConcept } from '../../types/models';
import type {
  BusinessWorkspaceConfig,
  OperatingModel,
  ResolvedWorkspaceConfig,
  WorkspaceTerminology,
} from '../../types/workspace';
import {
  FILTER_LABELS_HE,
  getOperatingModelDefinition,
  HYBRID_OPERATING_MODEL,
} from '../../config/operatingModelConfig';
import { resolveWorkModels as resolveLegacyWorkModels } from '../workModel';

const WORK_CONCEPT_TO_OPERATING: Record<WorkConcept, OperatingModel> = {
  single_event: 'event',
  session_pack: 'package',
  recurring_group: 'recurring',
  project: 'project',
};

const OPERATING_TO_WORK_CONCEPT: Partial<Record<OperatingModel, WorkConcept>> = {
  event: 'single_event',
  package: 'session_pack',
  recurring: 'recurring_group',
  project: 'project',
  journey: 'project',
};

export function workConceptsToOperatingModels(concepts: WorkConcept[]): OperatingModel[] {
  const mapped = concepts.map((c) => WORK_CONCEPT_TO_OPERATING[c]);
  return [...new Set(mapped)];
}

export function operatingModelsToWorkConcepts(models: OperatingModel[]): WorkConcept[] {
  const out: WorkConcept[] = [];
  for (const m of models) {
    if (m === 'hybrid') continue;
    const wc = OPERATING_TO_WORK_CONCEPT[m];
    if (wc && !out.includes(wc)) out.push(wc);
  }
  return out.length > 0 ? out : ['single_event'];
}

export function buildWorkspaceConfig(params: {
  primaryOperatingModel: OperatingModel;
  enabledOperatingModels: OperatingModel[];
  businessType?: string;
  onboardingCompleted?: boolean;
  terminology?: Partial<WorkspaceTerminology>;
}): BusinessWorkspaceConfig {
  const now = new Date().toISOString();
  const enabled = normalizeEnabledModels(
    params.primaryOperatingModel,
    params.enabledOperatingModels,
  );

  return {
    businessType: params.businessType,
    primaryOperatingModel: params.primaryOperatingModel,
    enabledOperatingModels: enabled,
    onboardingCompleted: params.onboardingCompleted ?? true,
    terminology: params.terminology,
    createdAt: now,
    updatedAt: now,
  };
}

export function normalizeEnabledModels(
  primary: OperatingModel,
  enabled: OperatingModel[],
): OperatingModel[] {
  if (primary === 'hybrid') {
    const list = enabled.filter((m) => m !== 'hybrid');
    return list.length >= 2 ? [...new Set(list)] : ['event', 'appointment'];
  }
  const set = new Set<OperatingModel>([
    primary,
    ...enabled.filter((m) => m !== 'hybrid' && m !== primary),
  ]);
  return [...set];
}

export function migrateWorkspaceFromBusiness(
  business: Business | null,
): BusinessWorkspaceConfig | null {
  if (!business) return null;
  if (business.workspace?.onboardingCompleted) {
    return {
      ...business.workspace,
      enabledOperatingModels: normalizeEnabledModels(
        business.workspace.primaryOperatingModel,
        business.workspace.enabledOperatingModels,
      ),
    };
  }

  const legacyConcepts = resolveLegacyWorkModels(business);
  const enabled = workConceptsToOperatingModels(legacyConcepts);
  const primary: OperatingModel =
    enabled.length > 1 ? 'hybrid' : (enabled[0] ?? 'hybrid');

  const now = new Date().toISOString();
  return {
    businessType: business.presetId,
    primaryOperatingModel: primary,
    enabledOperatingModels:
      primary === 'hybrid' && enabled.length > 0
        ? enabled
        : normalizeEnabledModels(primary, enabled),
    onboardingCompleted: true,
    createdAt: business.workspace?.createdAt ?? now,
    updatedAt: now,
  };
}

export function resolveWorkspace(business: Business | null): BusinessWorkspaceConfig | null {
  if (!business) return null;
  return migrateWorkspaceFromBusiness(business);
}

export function buildWorkspaceFilterTabs(
  workspace: BusinessWorkspaceConfig,
): Array<{ id: string; label: string }> {
  if (workspace.primaryOperatingModel === 'hybrid') {
    const tabs: Array<{ id: string; label: string }> = [
      { id: 'all', label: FILTER_LABELS_HE.all },
    ];
    for (const model of workspace.enabledOperatingModels) {
      if (model === 'hybrid') continue;
      const modelDef = getOperatingModelDefinition(model);
      tabs.push({ id: model, label: modelDef.defaultTerminology.activityPlural });
    }
    return tabs.length > 1 ? tabs : [];
  }

  const modelDef = getOperatingModelDefinition(workspace.primaryOperatingModel);
  const filters = modelDef.recommendedFilterIds.map((id) => ({
    id,
    label: FILTER_LABELS_HE[id] ?? id,
  }));
  return filters.length > 1 ? filters : [];
}

export function resolveWorkspaceConfig(business: Business | null): ResolvedWorkspaceConfig | null {
  const workspace = resolveWorkspace(business);
  if (!workspace) return null;

  const primary = getOperatingModelDefinition(workspace.primaryOperatingModel);
  const enabledModels = workspace.enabledOperatingModels.map(getOperatingModelDefinition);

  const terminology: WorkspaceTerminology = {
    ...primary.defaultTerminology,
    ...workspace.terminology,
  };

  return {
    workspace,
    primary,
    enabled: enabledModels,
    terminology,
    defaultCardPresentation: primary.cardPresentation,
    groupingMode:
      workspace.primaryOperatingModel === 'hybrid'
        ? HYBRID_OPERATING_MODEL.groupingMode
        : primary.groupingMode,
    activityFilterTabs: buildWorkspaceFilterTabs(workspace),
  };
}

export function syncWorkModelsFromWorkspace(workspace: BusinessWorkspaceConfig): WorkConcept[] {
  return operatingModelsToWorkConcepts(workspace.enabledOperatingModels);
}

export function normalizeBusinessWorkspace(business: Business | null): Business | null {
  if (!business) return null;

  const workspace = migrateWorkspaceFromBusiness(business);
  if (!workspace) return business;

  const workModels = syncWorkModelsFromWorkspace(workspace);

  return {
    ...business,
    workspace,
    workModels,
    primaryWorkModel: workModels.length > 1 ? 'mixed' : workModels[0],
  };
}
