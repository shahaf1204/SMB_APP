import { useMemo } from 'react';
import { getActivityFormFields, getPrimaryActivityFormFields } from '../config/activityFormSchema';
import { useAppStore } from '../store/useAppStore';
import { useWorkspaceConfig } from './useWorkspaceConfig';

/** Activity creation form field ids from workspace primary model */
export function useActivityFormSchema() {
  const business = useAppStore((s) => s.business);
  const config = useWorkspaceConfig();

  return useMemo(() => {
    const fields = getPrimaryActivityFormFields(business);
    const model = config?.workspace.primaryOperatingModel ?? 'hybrid';
    return {
      model,
      fields,
      hasField: (field: (typeof fields)[number]) => fields.includes(field),
      allModels: config?.enabled.map((d) => ({
        model: d.id,
        fields: getActivityFormFields(d.id),
      })) ?? [],
    };
  }, [business, config]);
}
