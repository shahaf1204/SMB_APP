import type { LucideIcon } from 'lucide-react';
import {
  AlarmClock,
  ArrowLeft,
  Banknote,
  Calendar,
  CalendarClock,
  CalendarDays,
  Clock,
  Clock3,
  Flag,
  MapPin,
  Milestone,
  Repeat2,
  Ticket,
  Timer,
  TrendingUp,
  User,
  Users,
  Video,
} from 'lucide-react';

/**
 * Semantic icon vocabulary for ActivityCard metadata.
 * Icons aid scanability — they never replace readable labels.
 */
export const MetaIcons = {
  context: Clock,
  contextUrgent: AlarmClock,
  recurrence: Repeat2,
  client: User,
  date: Calendar,
  time: Clock3,
  schedule: CalendarClock,
  location: MapPin,
  remote: Video,
  amount: Banknote,
  nextAction: ArrowLeft,
  progress: TrendingUp,
  usage: Ticket,
  expiration: Timer,
  nextOccurrence: CalendarDays,
  participants: Users,
  stage: Milestone,
  deadline: Flag,
} as const satisfies Record<string, LucideIcon>;

export type MetaIconKey = keyof typeof MetaIcons;

export function metaIcon(key: MetaIconKey): LucideIcon {
  return MetaIcons[key];
}

export function locationIcon(label: string | null | undefined): LucideIcon {
  if (!label) return MetaIcons.location;
  const remote = /מרחוק|זום|online|remote|וידאו|video/i.test(label);
  return remote ? MetaIcons.remote : MetaIcons.location;
}

export function progressIcon(
  tone: 'default' | 'journey' | 'usage' | 'project' | 'event',
): LucideIcon {
  switch (tone) {
    case 'usage':
      return MetaIcons.usage;
    case 'journey':
      return MetaIcons.progress;
    case 'project':
      return MetaIcons.stage;
    case 'event':
      return MetaIcons.progress;
    default:
      return MetaIcons.progress;
  }
}

export function contextIcon(
  tone: 'default' | 'urgent' | 'muted' | 'accent',
): LucideIcon {
  switch (tone) {
    case 'urgent':
      return MetaIcons.contextUrgent;
    case 'accent':
      return MetaIcons.recurrence;
    case 'muted':
      return MetaIcons.date;
    default:
      return MetaIcons.context;
  }
}
