import type { ActivityFormFieldId, OperatingModel } from '../types/workspace';
import { getOperatingModelDefinition } from './operatingModelConfig';
import { resolveWorkspace } from '../lib/workspace';
import type { Business } from '../types/models';

export {
  resolveActivityFormSchema,
  resolveActivityFormSchemaFromCategories,
  resolveActivityFormSchemaFromDrafts,
  buildOnboardingPreviewRows,
  partitionDraftsForOnboarding,
  applyDefaultEnabledToDrafts,
} from '../lib/activityForm/resolveActivityFormSchema';
export type {
  ActivityFormFieldPresentation,
  ActivityFormSchema,
  FieldPriority,
  FieldSection,
} from '../lib/activityForm/types';

/** Configurable field sections for shared activity creation forms */
export function getActivityFormFields(model: OperatingModel): ActivityFormFieldId[] {
  return getOperatingModelDefinition(model).formFieldIds;
}

export function getPrimaryActivityFormFields(
  business: Business | null,
): ActivityFormFieldId[] {
  const workspace = resolveWorkspace(business);
  const model = workspace?.primaryOperatingModel ?? 'hybrid';
  return getActivityFormFields(model);
}

export function hasActivityFormField(
  fields: ActivityFormFieldId[],
  field: ActivityFormFieldId,
): boolean {
  return fields.includes(field);
}
