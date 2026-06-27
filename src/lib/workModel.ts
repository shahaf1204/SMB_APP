import type { Business, Engagement, WorkConcept } from '../types/models';

export const WORK_CONCEPT_OPTIONS: Array<{
  id: WorkConcept;
  icon: string;
  title: string;
  desc: string;
}> = [
  {
    id: 'single_event',
    icon: '📅',
    title: 'אירועים בודדים',
    desc: 'תאריך + תשלום — ימי הולדת, צילום, הזמנות',
  },
  {
    id: 'session_pack',
    icon: '🎫',
    title: 'כרטיסיות / כניסות',
    desc: 'מכירה מראש + מונה כניסות — אימון, סטודיו',
  },
  {
    id: 'recurring_group',
    icon: '👥',
    title: 'חוגים קבועים',
    desc: 'יום בשבוע + תלמידים + תשלום לכל שיעור',
  },
  {
    id: 'project',
    icon: '📋',
    title: 'ליווי / פרויקט',
    desc: 'אותו לקוח לאורך זמן · אבני דרך · חשבוניות',
  },
];

/** @deprecated השתמשו ב-WORK_CONCEPT_OPTIONS */
export const PRIMARY_WORK_MODEL_OPTIONS = WORK_CONCEPT_OPTIONS;

export const WORK_CONCEPT_LABEL: Record<WorkConcept, string> = {
  single_event: 'אירועים בודדים',
  session_pack: 'כרטיסיות',
  recurring_group: 'חוגים',
  project: 'ליווי / פרויקט',
};

export const PRIMARY_WORK_MODEL_LABEL: Record<WorkConcept, string> = WORK_CONCEPT_LABEL;

const PRESET_WORK_MODELS: Record<string, WorkConcept[]> = {
  birthday: ['single_event'],
  photographer: ['single_event'],
  confectioner: ['single_event'],
  balloons: ['single_event'],
  therapist: ['session_pack'],
  coach: ['session_pack'],
  tutor: ['recurring_group'],
  consultant: ['project'],
  freelance: ['single_event', 'project'],
};

export function suggestWorkModelsFromPreset(presetId: string | undefined): WorkConcept[] {
  if (!presetId) return ['single_event'];
  return PRESET_WORK_MODELS[presetId] ?? ['single_event'];
}

export function resolveWorkModels(business: Business | null): WorkConcept[] {
  if (business?.workModels?.length) return business.workModels;
  if (business?.primaryWorkModel && business.primaryWorkModel !== 'mixed') {
    return [business.primaryWorkModel];
  }
  if (business?.primaryWorkModel === 'mixed') {
    return ['single_event', 'session_pack', 'recurring_group', 'project'];
  }
  if (business?.presetId) return suggestWorkModelsFromPreset(business.presetId);
  return ['single_event'];
}

export function resolvePrimaryWorkModel(business: Business | null): WorkConcept {
  return resolveWorkModels(business)[0] ?? 'single_event';
}

export function isMultiConcept(business: Business | null): boolean {
  return resolveWorkModels(business).length > 1;
}

export function workModelsLabel(models: WorkConcept[]): string {
  if (models.length === 0) return WORK_CONCEPT_LABEL.single_event;
  if (models.length === 1) return WORK_CONCEPT_LABEL[models[0]];
  return models.map((m) => WORK_CONCEPT_LABEL[m]).join(' + ');
}

export interface DashboardLayout {
  showPackHero: boolean;
  showGroupHero: boolean;
  showProjectHero: boolean;
  showNextEvent: boolean;
  showActiveEngagementsList: boolean;
  showCalendar: boolean;
  showSourceBreakdown: boolean;
  showEventCharts: boolean;
}

export function resolveDashboardLayout(
  business: Business | null,
  eventsCount: number,
  engagements: Engagement[],
): DashboardLayout {
  const models = resolveWorkModels(business);
  const hasEvents = eventsCount > 0;
  const active = engagements.filter((e) => e.status === 'active');
  const usesEvents = models.includes('single_event');
  const usesPacks = models.includes('session_pack');
  const usesGroups = models.includes('recurring_group');
  const usesProjects = models.includes('project');
  const heroCount =
    (usesPacks ? 1 : 0) + (usesGroups ? 1 : 0) + (usesProjects ? 1 : 0);

  return {
    showPackHero: usesPacks,
    showGroupHero: usesGroups,
    showProjectHero: usesProjects,
    showNextEvent: usesEvents,
    showActiveEngagementsList:
      active.length > 0 && models.length > 1 && heroCount > 1,
    showCalendar: usesEvents || hasEvents,
    showSourceBreakdown: usesEvents && hasEvents,
    showEventCharts: usesEvents && hasEvents,
  };
}

export const CREATE_ROUTES: Record<WorkConcept, string> = {
  single_event: '/create/event',
  session_pack: '/create/pack',
  recurring_group: '/create/group',
  project: '/create/project',
};

export function sortCreateOptions<T extends { to: string }>(
  options: readonly T[],
  models: WorkConcept[],
): T[] {
  if (models.length <= 1) {
    const primary = CREATE_ROUTES[models[0] ?? 'single_event'];
    return [...options].sort((a, b) => {
      if (a.to === primary) return -1;
      if (b.to === primary) return 1;
      return 0;
    });
  }
  const routes = new Set(models.map((m) => CREATE_ROUTES[m]));
  return [...options].sort((a, b) => {
    const aRec = routes.has(a.to);
    const bRec = routes.has(b.to);
    if (aRec && !bRec) return -1;
    if (!aRec && bRec) return 1;
    return 0;
  });
}

export function isRecommendedCreateRoute(to: string, models: WorkConcept[]): boolean {
  return models.some((m) => CREATE_ROUTES[m] === to);
}

export function normalizeBusiness(business: Business | null): Business | null {
  if (!business) return null;
  const workModels = resolveWorkModels(business);
  return {
    ...business,
    workModels,
    primaryWorkModel: workModels.length > 1 ? 'mixed' : workModels[0],
  };
}

export function toggleWorkModel(models: WorkConcept[], id: WorkConcept): WorkConcept[] {
  if (models.includes(id)) {
    const next = models.filter((m) => m !== id);
    return next.length > 0 ? next : models;
  }
  return [...models, id];
}

/** Activity list filter ids used on the Activities page. */
export type ActivityFilter = 'all' | 'event' | 'session_pack' | 'recurring_group' | 'project';

export const WORK_CONCEPT_ACTIVITY_FILTER: Record<WorkConcept, Exclude<ActivityFilter, 'all'>> = {
  single_event: 'event',
  session_pack: 'session_pack',
  recurring_group: 'recurring_group',
  project: 'project',
};

const ACTIVITY_FILTER_LABEL: Record<Exclude<ActivityFilter, 'all'>, string> = {
  event: 'אירועים',
  session_pack: 'כרטיסיות',
  recurring_group: 'חוגים',
  project: 'ליווי',
};

export function allowedActivityFilters(business: Business | null): Set<Exclude<ActivityFilter, 'all'>> {
  return new Set(resolveWorkModels(business).map((m) => WORK_CONCEPT_ACTIVITY_FILTER[m]));
}

export function buildActivityFilterTabs(
  business: Business | null,
): Array<{ id: ActivityFilter; label: string }> {
  const kinds = resolveWorkModels(business).map((m) => WORK_CONCEPT_ACTIVITY_FILTER[m]);
  const unique = [...new Set(kinds)];
  if (unique.length <= 1) return [];
  return [
    { id: 'all', label: 'הכל' },
    ...unique.map((id) => ({ id, label: ACTIVITY_FILTER_LABEL[id] })),
  ];
}

export function usesEventActivities(business: Business | null): boolean {
  return allowedActivityFilters(business).has('event');
}

export function usesEngagementActivities(business: Business | null): boolean {
  const allowed = allowedActivityFilters(business);
  return allowed.has('session_pack') || allowed.has('recurring_group') || allowed.has('project');
}

export function activityEmptyMessage(business: Business | null): string {
  const models = resolveWorkModels(business);
  if (models.length === 1 && models[0] === 'single_event') {
    return 'הוסיפו אירוע כדי להתחיל';
  }
  return `הוסיפו ${workModelsLabel(models).toLowerCase()} כדי להתחיל`;
}
