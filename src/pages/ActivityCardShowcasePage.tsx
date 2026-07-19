import {
  Activity,
  Camera,
  ChevronLeft,
  Repeat2,
  Stethoscope,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { BottomNav } from '../components/BottomNav';
import { ActivityCard } from '../components/business/ActivityCard';
import type { ActivityCardProps } from '../components/business/ActivityCard';
import { Text } from '../components/ds';

const noop = () => undefined;

type ShowcaseExample = {
  key: string;
  label: string;
  props: ActivityCardProps;
};

const EXAMPLES: ShowcaseExample[] = [
  {
    key: 'event',
    label: 'Event · Standard',
    props: {
      id: 'demo-event',
      presentationType: 'event',
      title: 'יום הולדת עמית',
      variant: 'standard',
      activityTypeLabel: 'אירוע חד-פעמי',
      contextualLabel: 'בעוד 5 ימים',
      clientName: 'משפחת כהן',
      dateLabel: 'יום א׳, 26 ביולי',
      timeLabel: '16:00–19:00',
      locationLabel: 'גן אירועים רמת אביב',
      amount: 4200,
      status: 'active',
      stage: 'הכנה',
      paymentStatus: 'partial',
      progressPercent: 65,
      progressLabel: 'צ׳ק-ליסט הכנה',
      onClick: noop,
    },
  },
  {
    key: 'appointment',
    label: 'Appointment · Compact',
    props: {
      id: 'demo-appointment',
      presentationType: 'appointment',
      title: 'פגישת טיפול',
      variant: 'compact',
      activityTypeLabel: 'תור',
      activityTypeIcon: Stethoscope,
      clientName: 'דנה לוי',
      dateLabel: 'מחר',
      timeLabel: '10:30',
      amount: 350,
      status: 'waiting',
      paymentStatus: 'unpaid',
      onClick: noop,
    },
  },
  {
    key: 'journey',
    label: 'Journey · Hero',
    props: {
      id: 'demo-journey',
      presentationType: 'journey',
      title: 'ליווי עסקי',
      variant: 'hero',
      activityTypeLabel: 'מסלול ליווי',
      clientName: 'רונית שטרן',
      stage: 'בתהליך',
      progressDetail: 'מפגש 3 מתוך 8',
      progressPercent: 37.5,
      nextActionLabel: 'הפגישה הבאה ב־22/07',
      amount: 12000,
      status: 'active',
      paymentStatus: 'paid',
      onClick: noop,
      quickActions: [
        { type: 'open', label: 'פתיחת תיק', onClick: noop },
        { type: 'invoice', label: 'חשבונית', onClick: noop },
      ],
    },
  },
  {
    key: 'package',
    label: 'Package · Standard',
    props: {
      id: 'demo-package',
      presentationType: 'package',
      title: 'כרטיסיית אימונים',
      variant: 'standard',
      activityTypeLabel: 'חבילה',
      usageLabel: '7 מתוך 10 מפגשים נוצלו',
      clientName: 'יוסי מזרחי',
      dateLabel: 'תוקף: 30/09/2026',
      amount: 900,
      paymentStatus: 'paid',
      progressPercent: 70,
      progressLabel: '3 מפגשים נותרו',
      tags: ['VIP'],
      onClick: noop,
    },
  },
  {
    key: 'project',
    label: 'Project · Timeline',
    props: {
      id: 'demo-project',
      presentationType: 'project',
      title: 'צילום משפחה',
      variant: 'timeline',
      activityTypeLabel: 'פרויקט צילום',
      activityTypeIcon: Camera,
      stage: 'בעריכה',
      deadlineLabel: 'מסירה עד 18/07',
      clientName: 'משפחת אברהם',
      progressPercent: 40,
      progressDetail: 'עריכה · 40%',
      amount: 1800,
      status: 'active',
      paymentStatus: 'paid',
      onClick: noop,
    },
  },
  {
    key: 'recurring',
    label: 'Recurring · Standard',
    props: {
      id: 'demo-recurring',
      presentationType: 'recurring',
      title: 'חוג אנגלית',
      variant: 'standard',
      activityTypeLabel: 'מפגש קבוע',
      activityTypeIcon: Repeat2,
      recurrenceLabel: 'כל יום שלישי',
      nextOccurrenceLabel: '24/07',
      clientName: 'קבוצת בוקר',
      usageLabel: '8 משתתפים',
      paymentStatus: 'paid',
      status: 'active',
      onClick: noop,
    },
  },
  {
    key: 'generic',
    label: 'Generic · Standard (fallback)',
    props: {
      id: 'demo-generic',
      presentationType: 'generic',
      title: 'פעילות כללית',
      variant: 'standard',
      activityTypeLabel: 'כללי',
      activityTypeIcon: Activity,
      clientName: 'לקוח לדוגמה',
      dateLabel: '19/07/2026',
      timeLabel: '14:00',
      amount: 500,
      status: 'new',
      paymentStatus: 'unpaid',
      onClick: noop,
    },
  },
];

export function ActivityCardShowcasePage() {
  return (
    <div className="app-shell">
      <div className="ds-showcase" style={{ maxWidth: 430, margin: '0 auto' }}>
        <Link
          to="/dev/design-system"
          className="ds-small ds-text-primary"
          style={{ display: 'inline-flex', gap: 4, marginBottom: 16 }}
        >
          <ChevronLeft size={16} /> חזרה למערכת עיצוב
        </Link>

        <Text variant="display" style={{ marginBottom: 8 }}>
          ActivityCard
        </Text>
        <Text variant="small" tone="secondary" style={{ marginBottom: 24 }}>
          presentationType — דוגמאות בלבד, ללא נתוני production.
        </Text>

        <div className="ds-showcase__stack" style={{ gap: 32 }}>
          {EXAMPLES.map(({ key, label, props }) => (
            <section key={key} className="ds-showcase__section">
              <Text variant="h3" className="ds-showcase__section-title" style={{ marginBottom: 12 }}>
                {label}
              </Text>
              <ActivityCard {...props} />
            </section>
          ))}
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
