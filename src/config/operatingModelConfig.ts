import type { LucideIcon } from 'lucide-react';
import {
  CalendarClock,
  CalendarDays,
  FolderKanban,
  Layers3,
  Repeat2,
  Route,
  TicketCheck,
} from 'lucide-react';
import type {
  ActivityFormFieldId,
  OperatingModel,
  OperatingModelDefinition,
  WorkspaceQuickActionId,
  WorkspaceTerminology,
} from '../types/workspace';

export const FILTER_LABELS_HE: Record<string, string> = {
  this_week: 'השבוע',
  upcoming: 'בקרוב',
  past: 'עבר',
  today: 'היום',
  needs_attention: 'דורש טיפול',
  active: 'פעיל',
  waiting: 'ממתין',
  completed: 'הושלם',
  low_remaining: 'מעט מפגשים נותרו',
  expiring_soon: 'פג תוקף בקרוב',
  active_groups: 'קבוצות פעילות',
  paused: 'מושהה',
  in_progress: 'בתהליך',
  waiting_for_client: 'ממתין ללקוח',
  upcoming_deadlines: 'דדליינים קרובים',
  all: 'הכל',
  by_type: 'לפי סוג',
};

export const WORKFLOW_STAGE_LABELS_HE: Record<string, string> = {
  lead: 'ליד',
  scheduled: 'נקבע',
  deposit: 'מקדמה',
  preparation: 'הכנה',
  confirmed: 'אושר',
  onboarding: 'קליטה',
  active: 'פעיל',
  review: 'סיכום',
  closing: 'סגירה',
  purchased: 'נרכש',
  nearly_used: 'כמעט נגמר',
  expired: 'פג תוקף',
  planned: 'מתוכנן',
  waiting_for_client: 'ממתין ללקוח',
  delivery: 'מסירה',
  paused: 'מושהה',
  cancelled: 'בוטל',
};

export const DASHBOARD_METRIC_LABELS_HE: Record<string, string> = {
  upcoming_events: 'אירועים קרובים',
  expected_revenue: 'הכנסה צפויה',
  unpaid_deposits: 'מקדמות פתוחות',
  appointments_today: 'פגישות היום',
  appointments_this_week: 'פגישות השבוע',
  unpaid_appointments: 'פגישות שלא שולמו',
  active_journeys: 'תהליכים פעילים',
  next_meetings: 'מפגשים הבאים',
  journeys_needing_attention: 'תהליכים שדורשים טיפול',
  active_packages: 'כרטיסיות פעילות',
  remaining_sessions: 'מפגשים שנותרו',
  expiring_soon: 'פג תוקף בקרוב',
  sessions_this_week: 'מפגשים השבוע',
  active_participants: 'משתתפים פעילים',
  unpaid_recurring: 'תשלומים חוזרים פתוחים',
  active_projects: 'פרויקטים פעילים',
  deadlines_this_week: 'דדליינים השבוע',
  projects_needing_attention: 'פרויקטים שדורשים טיפול',
  cross_model_summary: 'סיכום כללי',
};

export const QUICK_ACTION_LABELS_HE: Record<WorkspaceQuickActionId, string> = {
  new_event: 'אירוע חדש',
  new_appointment: 'פגישה חדשה',
  new_journey: 'תהליך חדש',
  new_package: 'כרטיסייה חדשה',
  new_recurring: 'מפגש קבוע חדש',
  new_project: 'פרויקט חדש',
  new_activity: 'פעילות חדשה',
  client: 'לקוח',
  invoice: 'חשבונית',
  task: 'משימה',
  use_session: 'מימוש מפגש',
  participant: 'משתתף',
  attendance: 'נוכחות',
  new_meeting: 'מפגש חדש',
};

const DEFAULT_TERMINOLOGY: WorkspaceTerminology = {
  activitySingular: 'פעילות',
  activityPlural: 'פעילויות',
  clientSingular: 'לקוח',
  clientPlural: 'לקוחות',
};

function def(
  id: OperatingModel,
  titleHe: string,
  descriptionHe: string,
  icon: LucideIcon,
  cardPresentation: OperatingModelDefinition['cardPresentation'],
  groupingMode: OperatingModelDefinition['groupingMode'],
  workflowStageIds: string[],
  recommendedFilterIds: string[],
  dashboardMetricIds: string[],
  quickActionIds: WorkspaceQuickActionId[],
  formFieldIds: ActivityFormFieldId[],
  terminology: Partial<WorkspaceTerminology> = {},
): OperatingModelDefinition {
  return {
    id,
    titleHe,
    descriptionHe,
    icon,
    cardPresentation,
    groupingMode,
    workflowStageIds,
    recommendedFilterIds,
    dashboardMetricIds,
    quickActionIds,
    formFieldIds,
    defaultTerminology: { ...DEFAULT_TERMINOLOGY, ...terminology },
  };
}

export const OPERATING_MODEL_DEFINITIONS: Record<
  Exclude<OperatingModel, 'hybrid'>,
  OperatingModelDefinition
> = {
  event: def(
    'event',
    'אירועים חד־פעמיים',
    'הזמנות או עבודות שמתקיימות בתאריך מוגדר ועומדות בפני עצמן.',
    CalendarDays,
    'event',
    'date',
    ['lead', 'scheduled', 'deposit', 'preparation', 'completed'],
    ['this_week', 'upcoming', 'past'],
    ['upcoming_events', 'expected_revenue', 'unpaid_deposits'],
    ['new_event', 'invoice', 'task', 'client'],
    ['title', 'client', 'date', 'start_time', 'end_time', 'location', 'amount', 'deposit', 'notes'],
    { activitySingular: 'אירוע', activityPlural: 'אירועים' },
  ),
  appointment: def(
    'appointment',
    'פגישות וטיפולים',
    'פגישות אישיות, טיפולים, שיעורים או ייעוץ לפי תאריך ושעה.',
    CalendarClock,
    'appointment',
    'agenda',
    ['scheduled', 'confirmed', 'completed', 'cancelled'],
    ['today', 'this_week', 'upcoming'],
    ['appointments_today', 'appointments_this_week', 'unpaid_appointments'],
    ['new_appointment', 'client', 'invoice', 'task'],
    ['title', 'client', 'date', 'start_time', 'duration', 'location', 'online', 'amount', 'notes'],
    { activitySingular: 'פגישה', activityPlural: 'פגישות' },
  ),
  journey: def(
    'journey',
    'ליווי ותהליך מתמשך',
    'תהליך עם לקוח לאורך מספר מפגשים, שלבים או תקופה.',
    Route,
    'journey',
    'status_and_next_action',
    ['onboarding', 'active', 'review', 'closing', 'completed'],
    ['needs_attention', 'active', 'waiting', 'completed'],
    ['active_journeys', 'next_meetings', 'journeys_needing_attention'],
    ['new_journey', 'new_meeting', 'task', 'client'],
    ['title', 'client', 'date', 'expected_end_date', 'session_count', 'total_value', 'workflow_template', 'notes'],
    { activitySingular: 'תהליך', activityPlural: 'תהליכים' },
  ),
  package: def(
    'package',
    'כרטיסיות וחבילות',
    'חבילות שירות או מספר מפגשים שנרכשים מראש.',
    TicketCheck,
    'package',
    'usage_and_expiration',
    ['purchased', 'active', 'nearly_used', 'expired', 'completed'],
    ['active', 'low_remaining', 'expiring_soon', 'completed'],
    ['active_packages', 'remaining_sessions', 'expiring_soon'],
    ['new_package', 'use_session', 'client', 'invoice'],
    ['package_name', 'client', 'session_count_package', 'amount', 'expiration_date', 'notes'],
    { activitySingular: 'כרטיסייה', activityPlural: 'כרטיסיות' },
  ),
  recurring: def(
    'recurring',
    'חוגים ומפגשים קבועים',
    'פעילות שחוזרת במחזוריות קבועה עם לקוחות או קבוצות.',
    Repeat2,
    'recurring',
    'recurrence',
    ['active', 'paused', 'completed'],
    ['today', 'this_week', 'active_groups', 'paused'],
    ['sessions_this_week', 'active_participants', 'unpaid_recurring'],
    ['new_recurring', 'participant', 'attendance', 'invoice'],
    ['title', 'recurrence_pattern', 'start_time', 'participants', 'billing', 'location', 'notes'],
    { activitySingular: 'מפגש קבוע', activityPlural: 'מפגשים קבועים' },
  ),
  project: def(
    'project',
    'פרויקטים ותוצרים',
    'עבודה שמורכבת משלבים, משימות, אישורים ודדליין.',
    FolderKanban,
    'project',
    'deadline_and_stage',
    ['planned', 'active', 'waiting_for_client', 'delivery', 'completed'],
    ['needs_attention', 'in_progress', 'waiting_for_client', 'upcoming_deadlines', 'completed'],
    ['active_projects', 'deadlines_this_week', 'projects_needing_attention'],
    ['new_project', 'task', 'client', 'invoice'],
    ['title', 'client', 'date', 'deadline', 'amount', 'workflow_stage', 'notes'],
    { activitySingular: 'פרויקט', activityPlural: 'פרויקטים' },
  ),
};

export const HYBRID_OPERATING_MODEL: OperatingModelDefinition = def(
  'hybrid',
  'שילוב של כמה מודלים',
  'העסק שלך עובד בכמה צורות, ואין מודל אחד שמתאר את רוב הפעילות.',
  Layers3,
  'generic',
  'mixed',
  [],
  ['all', 'by_type'],
  ['cross_model_summary'],
  ['new_activity', 'client', 'invoice', 'task'],
  ['title', 'client', 'date', 'amount', 'notes'],
);

export const OPERATING_MODEL_ONBOARDING_OPTIONS = [
  OPERATING_MODEL_DEFINITIONS.event,
  OPERATING_MODEL_DEFINITIONS.appointment,
  OPERATING_MODEL_DEFINITIONS.journey,
  OPERATING_MODEL_DEFINITIONS.package,
  OPERATING_MODEL_DEFINITIONS.recurring,
  OPERATING_MODEL_DEFINITIONS.project,
  HYBRID_OPERATING_MODEL,
];

export const OPERATING_MODEL_ADDITIONAL_OPTIONS = [
  OPERATING_MODEL_DEFINITIONS.event,
  OPERATING_MODEL_DEFINITIONS.appointment,
  OPERATING_MODEL_DEFINITIONS.journey,
  OPERATING_MODEL_DEFINITIONS.package,
  OPERATING_MODEL_DEFINITIONS.recurring,
  OPERATING_MODEL_DEFINITIONS.project,
];

export function getOperatingModelDefinition(
  model: OperatingModel,
): OperatingModelDefinition {
  if (model === 'hybrid') return HYBRID_OPERATING_MODEL;
  return OPERATING_MODEL_DEFINITIONS[model];
}

export function operatingModelTitleHe(model: OperatingModel): string {
  return getOperatingModelDefinition(model).titleHe;
}
