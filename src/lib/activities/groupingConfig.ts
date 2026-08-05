import {
  FILTER_LABELS_HE,
  getOperatingModelDefinition,
  QUICK_ACTION_LABELS_HE,
} from '../../config/operatingModelConfig';
import type { LucideIcon } from 'lucide-react';
import {
  CalendarClock,
  CalendarDays,
  FolderKanban,
  Layers,
  Repeat2,
  Route,
  TicketCheck,
} from 'lucide-react';
import type { OperatingModel } from '../../types/workspace';
import { resolveWorkspaceConfig } from '../workspace';
import type { Business } from '../../types/models';
import type {
  ActivitiesGroupingConfig,
  ActivitiesPageCopy,
  ActivityFilterChip,
  ActivityGroupDefinition,
} from './types';

const PAGE_SUBTITLE: Record<Exclude<OperatingModel, 'hybrid'>, string> = {
  event: 'כל האירועים שלך במקום אחד',
  appointment: 'סדר היום והפגישות הקרובות',
  journey: 'מעקב אחר לקוחות ותהליכים פעילים',
  package: 'מעקב אחר ניצול, יתרות ותוקף',
  project: 'מעקב אחר שלבים, דדליינים ומסירות',
  recurring: 'מפגשים קבועים וקבוצות פעילות',
};

const EMPTY_COPY: Record<
  Exclude<OperatingModel, 'hybrid'>,
  Pick<ActivitiesPageCopy, 'emptyTitle' | 'emptyDescription' | 'emptyCta'>
> = {
  event: {
    emptyTitle: 'עדיין אין אירועים',
    emptyDescription: 'האירוע הראשון שלך יופיע כאן לאחר היצירה.',
    emptyCta: 'יצירת אירוע',
  },
  appointment: {
    emptyTitle: 'עדיין אין פגישות',
    emptyDescription: 'הפגישה הראשונה שלך תופיע כאן לאחר הקביעה.',
    emptyCta: 'קביעת פגישה',
  },
  journey: {
    emptyTitle: 'עדיין אין תהליכים פעילים',
    emptyDescription: 'תהליך הליווי הראשון שלך יופיע כאן.',
    emptyCta: 'יצירת תהליך',
  },
  package: {
    emptyTitle: 'עדיין אין כרטיסיות',
    emptyDescription: 'כרטיסייה או חבילה חדשה תופיע כאן לאחר היצירה.',
    emptyCta: 'יצירת כרטיסייה',
  },
  project: {
    emptyTitle: 'עדיין אין פרויקטים',
    emptyDescription: 'הפרויקט הראשון שלך יופיע כאן לאחר היצירה.',
    emptyCta: 'יצירת פרויקט',
  },
  recurring: {
    emptyTitle: 'עדיין אין פעילות קבועה',
    emptyDescription: 'חוג, קבוצה או מפגש קבוע יופיע כאן.',
    emptyCta: 'יצירת פעילות קבועה',
  },
};

const GROUPS: Record<Exclude<OperatingModel, 'hybrid'>, ActivityGroupDefinition[]> = {
  event: [
    { id: 'needs_attention', title: 'דורש טיפול' },
    { id: 'this_week', title: 'השבוע' },
    { id: 'upcoming', title: 'אירועים קרובים' },
    { id: 'completed', title: 'אירועים שהושלמו', collapsible: true, defaultCollapsed: true },
  ],
  appointment: [
    { id: 'needs_attention', title: 'דורש אישור או טיפול' },
    { id: 'today', title: 'היום' },
    { id: 'this_week', title: 'השבוע' },
    { id: 'upcoming', title: 'פגישות עתידיות' },
    { id: 'completed', title: 'הושלמו', collapsible: true, defaultCollapsed: true },
  ],
  journey: [
    { id: 'needs_attention', title: 'דורש טיפול' },
    { id: 'next_meeting', title: 'הפגישה הבאה' },
    { id: 'active', title: 'תהליכים פעילים' },
    { id: 'completed', title: 'הושלמו', collapsible: true, defaultCollapsed: true },
  ],
  package: [
    { id: 'nearly_depleted', title: 'כמעט הסתיימו' },
    { id: 'expiring_soon', title: 'עומדות לפוג' },
    { id: 'active', title: 'כרטיסיות פעילות' },
    { id: 'completed', title: 'הסתיימו', collapsible: true, defaultCollapsed: true },
  ],
  recurring: [
    { id: 'today', title: 'היום' },
    { id: 'this_week', title: 'השבוע' },
    { id: 'active', title: 'קבוצות או פעילויות פעילות' },
    { id: 'paused', title: 'מושהות', collapsible: true },
    { id: 'completed', title: 'הסתיימו', collapsible: true, defaultCollapsed: true },
  ],
  project: [
    { id: 'needs_attention', title: 'דורש טיפול' },
    { id: 'upcoming_deadlines', title: 'דדליינים קרובים' },
    { id: 'in_progress', title: 'בביצוע' },
    { id: 'nearing_delivery', title: 'לקראת מסירה' },
    { id: 'completed', title: 'הושלמו', collapsible: true, defaultCollapsed: true },
  ],
};

const HYBRID_GROUPS: ActivityGroupDefinition[] = [
  { id: 'needs_attention', title: 'דורש טיפול' },
  { id: 'today_and_week', title: 'היום והשבוע' },
  { id: 'in_progress', title: 'פעילות בתהליך' },
  { id: 'paused', title: 'ממתין / מושהה', collapsible: true },
  { id: 'completed', title: 'הושלם', collapsible: true, defaultCollapsed: true },
];

const FILTER_CHIPS: Record<Exclude<OperatingModel, 'hybrid'>, ActivityFilterChip[]> = {
  event: [
    { id: 'all', label: 'הכל' },
    { id: 'this_week', label: 'השבוע' },
    { id: 'upcoming', label: 'עתידיים' },
    { id: 'completed', label: 'הושלמו' },
    { id: 'needs_attention', label: 'דורש טיפול' },
  ],
  appointment: [
    { id: 'all', label: 'הכל' },
    { id: 'today', label: 'היום' },
    { id: 'this_week', label: 'השבוע' },
    { id: 'upcoming', label: 'עתידיות' },
    { id: 'completed', label: 'הושלמו' },
  ],
  journey: [
    { id: 'all', label: 'הכל' },
    { id: 'active', label: 'פעילים' },
    { id: 'needs_attention', label: 'דורש טיפול' },
    { id: 'completed', label: 'הושלמו' },
  ],
  package: [
    { id: 'all', label: 'הכל' },
    { id: 'active', label: 'פעילות' },
    { id: 'low_remaining', label: 'כמעט הסתיימו' },
    { id: 'expiring_soon', label: 'עומדות לפוג' },
    { id: 'completed', label: 'הסתיימו' },
  ],
  project: [
    { id: 'all', label: 'הכל' },
    { id: 'in_progress', label: 'בביצוע' },
    { id: 'upcoming_deadlines', label: 'דדליין קרוב' },
    { id: 'completed', label: 'הושלמו' },
  ],
  recurring: [
    { id: 'all', label: 'הכל' },
    { id: 'today', label: 'היום' },
    { id: 'this_week', label: 'השבוע' },
    { id: 'active', label: 'פעילות' },
    { id: 'paused', label: 'מושהות' },
  ],
};

const PRESENTATION_FILTER: Record<
  Exclude<OperatingModel, 'hybrid'>,
  ActivityFilterChip
> = {
  event: { id: 'presentation_event', label: 'אירועים' },
  appointment: { id: 'presentation_appointment', label: 'פגישות' },
  journey: { id: 'presentation_journey', label: 'ליווי' },
  package: { id: 'presentation_package', label: 'כרטיסיות' },
  recurring: { id: 'presentation_recurring', label: 'קבועות' },
  project: { id: 'presentation_project', label: 'פרויקטים' },
};

function resolvePrimaryModel(business: Business | null): OperatingModel {
  const config = resolveWorkspaceConfig(business);
  return config?.workspace.primaryOperatingModel ?? 'hybrid';
}

export function getActivitiesGroupingConfig(
  business: Business | null,
): ActivitiesGroupingConfig {
  const primary = resolvePrimaryModel(business);
  if (primary === 'hybrid') {
    return { primaryModel: 'hybrid', groups: HYBRID_GROUPS };
  }
  return { primaryModel: primary, groups: GROUPS[primary] };
}

export function getActivitiesPageCopy(business: Business | null): ActivitiesPageCopy {
  const primary = resolvePrimaryModel(business);
  const def = getOperatingModelDefinition(primary);

  if (primary === 'hybrid') {
    return {
      title: 'פעילויות',
      subtitle: 'מרכז העבודה היומי — כל הפעילויות במקום אחד',
      emptyTitle: 'עדיין אין פעילויות',
      emptyDescription: 'הפעילות הראשונה שלך תופיע כאן לאחר היצירה.',
      emptyCta: 'יצירת פעילות',
    };
  }

  const empty = EMPTY_COPY[primary];
  return {
    title: def.defaultTerminology.activityPlural,
    subtitle: PAGE_SUBTITLE[primary],
    ...empty,
  };
}

export function getActivitiesFilterChips(business: Business | null): ActivityFilterChip[] {
  const config = resolveWorkspaceConfig(business);
  const primary = config?.workspace.primaryOperatingModel ?? 'hybrid';

  if (primary === 'hybrid') {
    const enabled = config?.workspace.enabledOperatingModels ?? [];
    const chips: ActivityFilterChip[] = [{ id: 'all', label: FILTER_LABELS_HE.all }];
    for (const model of enabled) {
      if (model === 'hybrid') continue;
      const chip = PRESENTATION_FILTER[model];
      if (chip) chips.push(chip);
    }
    chips.push({ id: 'needs_attention', label: FILTER_LABELS_HE.needs_attention });
    return chips;
  }

  return FILTER_CHIPS[primary];
}

export function getActivitiesPrimaryCtaLabel(business: Business | null): string {
  const primary = resolvePrimaryModel(business);
  const keyMap: Partial<Record<OperatingModel, keyof typeof QUICK_ACTION_LABELS_HE>> = {
    event: 'new_event',
    appointment: 'new_appointment',
    journey: 'new_journey',
    package: 'new_package',
    recurring: 'new_recurring',
    project: 'new_project',
    hybrid: 'new_activity',
  };
  const key = keyMap[primary] ?? 'new_activity';
  return QUICK_ACTION_LABELS_HE[key];
}

const EMPTY_ICONS: Record<Exclude<OperatingModel, 'hybrid'>, LucideIcon> = {
  event: CalendarDays,
  appointment: CalendarClock,
  journey: Route,
  package: TicketCheck,
  project: FolderKanban,
  recurring: Repeat2,
};

export function getActivitiesEmptyIcon(business: Business | null): LucideIcon {
  const primary = resolvePrimaryModel(business);
  if (primary === 'hybrid') return Layers;
  return EMPTY_ICONS[primary];
}
