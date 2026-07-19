import {
  Briefcase,
  Camera,
  ChevronLeft,
  Dumbbell,
  PartyPopper,
  Stethoscope,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { BottomNav } from '../components/BottomNav';
import { ActivityCard } from '../components/business/ActivityCard';
import { Text } from '../components/ds';

const noop = () => undefined;

const EXAMPLES = [
  {
    key: 'event',
    label: 'One-time event · Standard',
    props: {
      id: 'demo-event',
      title: 'יום הולדת עמית',
      variant: 'standard' as const,
      activityTypeLabel: 'אירוע חד-פעמי',
      activityTypeIcon: PartyPopper,
      clientName: 'משפחת כהן',
      dateLabel: 'יום א׳, 26 ביולי',
      timeLabel: '16:00–19:00',
      locationLabel: 'גן אירועים רמת אביב',
      amount: 4200,
      currency: '₪',
      status: 'active' as const,
      stage: 'הכנה',
      paymentStatus: 'partial' as const,
      progressPercent: 65,
      progressLabel: 'צ׳ק-ליסט הכנה · 65%',
      tags: ['20 ילדים', 'עיצוב בלונים'],
      onClick: noop,
      quickActions: [
        { type: 'call' as const, label: 'התקשר ללקוח', onClick: noop },
        { type: 'edit' as const, label: 'עריכת פעילות', onClick: noop },
      ],
    },
  },
  {
    key: 'appointment',
    label: 'Appointment · Compact',
    props: {
      id: 'demo-appointment',
      title: 'פגישת טיפול',
      variant: 'compact' as const,
      activityTypeLabel: 'תור',
      activityTypeIcon: Stethoscope,
      clientName: 'דנה לוי',
      dateLabel: 'מחר',
      timeLabel: '10:30',
      amount: 350,
      status: 'waiting' as const,
      paymentStatus: 'unpaid' as const,
      onClick: noop,
    },
  },
  {
    key: 'journey',
    label: 'Long-term journey · Hero',
    props: {
      id: 'demo-journey',
      title: 'ליווי עסקי',
      variant: 'hero' as const,
      activityTypeLabel: 'מסלול ליווי',
      activityTypeIcon: Briefcase,
      clientName: 'רונית שטרן',
      dateLabel: 'חודש 3 מתוך 6',
      timeLabel: 'מפגש הבא: 22/07',
      amount: 12000,
      status: 'active' as const,
      stage: 'בתהליך',
      paymentStatus: 'paid' as const,
      progressPercent: 50,
      progressLabel: '3 מתוך 6 מפגשים',
      onClick: noop,
      quickActions: [
        { type: 'open' as const, label: 'פתיחת תיק', onClick: noop },
        { type: 'invoice' as const, label: 'חשבונית', onClick: noop },
      ],
    },
  },
  {
    key: 'photo',
    label: 'Photography · Timeline',
    props: {
      id: 'demo-photo',
      title: 'צילום משפחה',
      variant: 'timeline' as const,
      activityTypeLabel: 'פרויקט צילום',
      activityTypeIcon: Camera,
      clientName: 'משפחת אברהם',
      dateLabel: '18/07/2026',
      timeLabel: '17:00',
      locationLabel: 'פארק הירקון',
      amount: 1800,
      status: 'active' as const,
      stage: 'עריכה',
      paymentStatus: 'paid' as const,
      progressPercent: 40,
      progressLabel: 'עריכה · 40%',
      onClick: noop,
    },
  },
  {
    key: 'package',
    label: 'Package · Standard',
    props: {
      id: 'demo-package',
      title: 'כרטיסיית אימונים',
      variant: 'standard' as const,
      activityTypeLabel: 'חבילה',
      activityTypeIcon: Dumbbell,
      clientName: 'יוסי מזרחי',
      dateLabel: 'תוקף: 30/09/2026',
      amount: 900,
      status: 'active' as const,
      stage: 'מומש',
      paymentStatus: 'paid' as const,
      progressPercent: 70,
      progressLabel: '7 מתוך 10 אימונים',
      tags: ['סטודיו', 'חידוש אוטומטי'],
      onClick: noop,
      quickActions: [
        { type: 'navigate' as const, label: 'ניווט לסטודיו', onClick: noop },
      ],
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
          רכיב עסקי גנרי — דוגמאות בלבד, ללא נתוני production.
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
