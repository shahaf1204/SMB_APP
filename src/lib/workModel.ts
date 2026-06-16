import type { Business, Engagement, PrimaryWorkModel } from '../types/models';

export const PRIMARY_WORK_MODEL_OPTIONS: Array<{
  id: PrimaryWorkModel;
  icon: string;
  title: string;
  desc: string;
}> = [
  {
    id: 'single_event',
    icon: '📅',
    title: 'אירועים בודדים',
    desc: 'תאריך + תשלום — צילום, ימי הולדת, הזמנות',
  },
  {
    id: 'session_pack',
    icon: '🎫',
    title: 'כרטיסיות / כניסות',
    desc: 'תשלום מראש + מונה — אימון, סטודיו, טיפול',
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
    desc: 'לאורך זמן · אבני דרך · חשבוניות לפי תפוקה',
  },
  {
    id: 'mixed',
    icon: '🔀',
    title: 'שילוב / לא בטוח',
    desc: 'כמה סוגי עבודה — הדשבורד יציג את מה שרלוונטי',
  },
];

export const PRIMARY_WORK_MODEL_LABEL: Record<PrimaryWorkModel, string> = {
  single_event: 'אירועים בודדים',
  session_pack: 'כרטיסיות',
  recurring_group: 'חוגים',
  project: 'ליווי / פרויקט',
  mixed: 'שילוב',
};

const PRESET_WORK_MODEL: Record<string, PrimaryWorkModel> = {
  birthday: 'single_event',
  photographer: 'single_event',
  confectioner: 'single_event',
  balloons: 'single_event',
  therapist: 'session_pack',
  coach: 'session_pack',
  tutor: 'recurring_group',
  consultant: 'project',
  freelance: 'mixed',
};

export function suggestWorkModelFromPreset(presetId: string | undefined): PrimaryWorkModel {
  if (!presetId) return 'mixed';
  return PRESET_WORK_MODEL[presetId] ?? 'mixed';
}

export function resolvePrimaryWorkModel(business: Business | null): PrimaryWorkModel {
  if (business?.primaryWorkModel) return business.primaryWorkModel;
  if (business?.presetId) return suggestWorkModelFromPreset(business.presetId);
  return 'single_event';
}

export type DashboardHero = 'event' | 'pack' | 'group' | 'project' | 'none';

export interface DashboardLayout {
  hero: DashboardHero;
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
  const model = resolvePrimaryWorkModel(business);
  const hasEvents = eventsCount > 0;
  const active = engagements.filter((e) => e.status === 'active');
  const hasPacks = active.some((e) => e.kind === 'session_pack');
  const hasGroups = active.some((e) => e.kind === 'recurring_group');
  const hasProjects = active.some((e) => e.kind === 'project');

  const base = {
    showCalendar: hasEvents,
    showSourceBreakdown: hasEvents,
    showEventCharts: hasEvents,
  };

  switch (model) {
    case 'session_pack':
      return {
        ...base,
        hero: 'pack',
        showNextEvent: hasEvents,
        showActiveEngagementsList: hasGroups || hasProjects,
        showCalendar: hasEvents,
      };
    case 'recurring_group':
      return {
        ...base,
        hero: 'group',
        showNextEvent: hasEvents,
        showActiveEngagementsList: hasPacks || hasProjects,
        showCalendar: hasEvents,
      };
    case 'project':
      return {
        ...base,
        hero: 'project',
        showNextEvent: hasEvents,
        showActiveEngagementsList: hasPacks || hasGroups,
        showCalendar: hasEvents,
      };
    case 'mixed':
      return {
        ...base,
        hero: hasPacks
          ? 'pack'
          : hasGroups
            ? 'group'
            : hasProjects
              ? 'project'
              : hasEvents
                ? 'event'
                : 'none',
        showNextEvent: hasEvents,
        showActiveEngagementsList: active.length > 0,
        showCalendar: hasEvents || active.length > 0,
      };
    default:
      return {
        ...base,
        hero: hasEvents ? 'event' : active.length > 0 ? 'pack' : 'none',
        showNextEvent: hasEvents,
        showActiveEngagementsList: active.length > 0,
        showCalendar: true,
      };
  }
}

export const CREATE_ROUTES: Record<PrimaryWorkModel, string> = {
  single_event: '/create/event',
  session_pack: '/create/pack',
  recurring_group: '/create/group',
  project: '/create/project',
  mixed: '/create',
};

export function sortCreateOptions<T extends { to: string }>(
  options: readonly T[],
  model: PrimaryWorkModel,
): T[] {
  const primary = CREATE_ROUTES[model];
  if (model === 'mixed' || primary === '/create') return [...options];
  return [...options].sort((a, b) => {
    if (a.to === primary) return -1;
    if (b.to === primary) return 1;
    return 0;
  });
}

export function normalizeBusiness(business: Business | null): Business | null {
  if (!business) return null;
  return {
    ...business,
    primaryWorkModel:
      business.primaryWorkModel ??
      (business.presetId ? suggestWorkModelFromPreset(business.presetId) : 'single_event'),
  };
}
