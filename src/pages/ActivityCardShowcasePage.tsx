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
  annotation: string;
  props: ActivityCardProps;
};

const EXAMPLES: ShowcaseExample[] = [
  {
    key: 'event',
    label: 'אירוע · Standard',
    annotation:
      'עדיפות: הקשר זמן → כותרת → לקוח → תאריך/מיקום → סכום + סטטוס → התקדמות הכנה. מתאים לאירועים חד-פעמיים עם תאריך קבוע.',
    props: {
      id: 'demo-event',
      presentationType: 'event',
      title: 'יום הולדת עמית',
      variant: 'standard',
      contextualLabel: 'בעוד 5 ימים',
      clientName: 'משפחת כהן',
      dateLabel: 'יום א׳, 26 ביולי',
      timeLabel: '16:00–19:00',
      locationLabel: 'רמת אביב',
      amount: 4200,
      status: 'active',
      stage: 'הכנה',
      paymentStatus: 'partial',
      progressPercent: 65,
      onClick: noop,
    },
  },
  {
    key: 'appointment',
    label: 'פגישה · Compact',
    annotation:
      'עדיפות: שעה כעוגן → כותרת → לקוח/מיקום → סכום + ממתין. פריט יומן קומפקטי — בלי progress מיותר.',
    props: {
      id: 'demo-appointment',
      presentationType: 'appointment',
      title: 'פגישת טיפול',
      variant: 'compact',
      activityTypeIcon: Stethoscope,
      clientName: 'דנה לוי',
      locationLabel: 'מרחוק',
      timeLabel: '10:30',
      amount: 350,
      status: 'waiting',
      paymentStatus: 'unpaid',
      onClick: noop,
    },
  },
  {
    key: 'journey',
    label: 'תהליך · Hero',
    annotation:
      'עדיפות: מצב תהליך → כותרת → לקוח → התקדמת מפגשים → פגישה הבאה → ערך כולל. מדגיש תהליך מתמשך, לא אחוז גנרי.',
    props: {
      id: 'demo-journey',
      presentationType: 'journey',
      title: 'ליווי עסקי',
      variant: 'hero',
      clientName: 'רונית שרון',
      contextualLabel: 'בתהליך',
      progressDetail: 'מפגש 3 מתוך 8',
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
    label: 'כרטיסייה · Standard',
    annotation:
      'עדיפות: מפגשים שנותרו → שם חבילה → לקוח → שימוש + תוקף → תשלום. מדגיש ניצול, לא אחוז workflow.',
    props: {
      id: 'demo-package',
      presentationType: 'package',
      title: 'כרטיסיית אימונים',
      variant: 'standard',
      progressLabel: '3 מפגשים נותרו',
      usageLabel: '7 מתוך 10 נוצלו',
      clientName: 'יוסי מזרחי',
      dateLabel: 'בתוקף עד 30/09',
      amount: 900,
      paymentStatus: 'paid',
      onClick: noop,
    },
  },
  {
    key: 'project',
    label: 'פרויקט · Timeline',
    annotation:
      'עדיפות: דדליין → כותרת → לקוח → שלב נוכחי → פעולה נדרשת → סכום. סימון ציר זמן עם משמעות — לא נקודה דקורטיבית.',
    props: {
      id: 'demo-project',
      presentationType: 'project',
      title: 'צילום משפחה',
      variant: 'timeline',
      activityTypeIcon: Camera,
      contextualLabel: 'מסירה בעוד יומיים',
      stage: 'בעריכה',
      nextActionLabel: 'ממתין לאישור הלקוח',
      clientName: 'משפחת אברהם',
      amount: 1800,
      status: 'active',
      onClick: noop,
    },
  },
  {
    key: 'recurring',
    label: 'מפגש קבוע · Standard',
    annotation:
      'עדיפות: תבנית חזרה → כותרת → קבוצה → מפגש הבא + משתתפים → תשלום + סטטוס. בלי progress bar גנרי.',
    props: {
      id: 'demo-recurring',
      presentationType: 'recurring',
      title: 'חוג אנגלית',
      variant: 'standard',
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
    label: 'כללי · Standard',
    annotation:
      'עדיפות: כותרת → לקוח → תאריך → סכום + סטטוס. fallback אחיד כשאין presentationType ספציפי.',
    props: {
      id: 'demo-generic',
      presentationType: 'generic',
      title: 'פעילות כללית',
      variant: 'standard',
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
          ActivityCard v2
        </Text>
        <Text variant="small" tone="secondary" style={{ marginBottom: 24 }}>
          שפה ויזואלית אחידה — דוגמאות בלבד, ללא נתוני production.
        </Text>

        <div className="ds-showcase__stack" style={{ gap: 36 }}>
          {EXAMPLES.map(({ key, label, annotation, props }) => (
            <section key={key} className="ds-showcase__section">
              <Text variant="h3" className="ds-showcase__section-title" style={{ marginBottom: 12 }}>
                {label}
              </Text>
              <ActivityCard {...props} />
              <Text
                variant="small"
                tone="secondary"
                style={{ marginTop: 10, lineHeight: 1.5, fontSize: '0.78rem' }}
              >
                {annotation}
              </Text>
            </section>
          ))}
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
