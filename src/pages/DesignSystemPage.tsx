import { useState } from 'react';
import {
  Bell,
  Calendar,
  ChevronLeft,
  DollarSign,
  Inbox,
  Plus,
  Search,
  Sparkles,
  Users,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { BottomNav } from '../components/BottomNav';
import {
  ActivityCard,
  Avatar,
  Badge,
  Button,
  Checkbox,
  ClientCard,
  DateInput,
  DefaultCard,
  Divider,
  EmptyState,
  Field,
  Icon,
  IconButton,
  Input,
  MetricCard,
  SearchInput,
  Select,
  SettingsCard,
  StatisticCard,
  Text,
  TimeInput,
  Toggle,
} from '../components/ds';

const NEUTRAL_SWATCHES = [
  { token: '0', bg: 'var(--ds-neutral-0)' },
  { token: '50', bg: 'var(--ds-neutral-50)' },
  { token: '100', bg: 'var(--ds-neutral-100)' },
  { token: '200', bg: 'var(--ds-neutral-200)' },
  { token: '300', bg: 'var(--ds-neutral-300)' },
  { token: '400', bg: 'var(--ds-neutral-400)' },
  { token: '500', bg: 'var(--ds-neutral-500)' },
  { token: '600', bg: 'var(--ds-neutral-600)' },
  { token: '700', bg: 'var(--ds-neutral-700)' },
  { token: '800', bg: 'var(--ds-neutral-800)' },
  { token: '900', bg: 'var(--ds-neutral-900)' },
];

const BADGE_STATUSES = [
  'success',
  'waiting',
  'upcoming',
  'completed',
  'cancelled',
] as const;

export function DesignSystemPage() {
  const [toggleOn, setToggleOn] = useState(true);
  const [checked, setChecked] = useState(false);
  const [loading, setLoading] = useState(false);

  return (
    <div className="app-shell">
      <div className="ds-showcase">
        <Link to="/more" className="ds-small ds-text-primary" style={{ display: 'inline-flex', gap: 4, marginBottom: 16 }}>
          <ChevronLeft size={16} /> חזרה
        </Link>

        <Text variant="display" style={{ marginBottom: 8 }}>
          Product Design System
        </Text>
        <Text variant="small" tone="secondary" style={{ marginBottom: 24 }}>
          שפה ויזואלית אחידה לכל האפליקציה — רפרנס לפיתוח. לא מחליפה עדיין מסכים קיימים.
        </Text>

        {/* Colors */}
        <section className="ds-showcase__section">
          <Text variant="h2" className="ds-showcase__section-title">
            צבעי מותג (3 בלבד)
          </Text>
          <div className="ds-showcase__stack">
            <div>
              <Text variant="h3" style={{ marginBottom: 8 }}>Primary — כחול/סגול</Text>
              <div className="ds-showcase__swatch-row">
                {[50, 100, 200, 500, 600, 800].map((step) => (
                  <span
                    key={step}
                    className="ds-showcase__swatch"
                    style={{ background: `var(--ds-primary-${step})` }}
                  >
                    {step}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <Text variant="h3" style={{ marginBottom: 8 }}>Success — ירוק</Text>
              <div className="ds-showcase__swatch-row">
                {[50, 100, 200, 500, 600, 800].map((step) => (
                  <span
                    key={step}
                    className="ds-showcase__swatch"
                    style={{ background: `var(--ds-success-${step})` }}
                  >
                    {step}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <Text variant="h3" style={{ marginBottom: 8 }}>Accent — כתום</Text>
              <div className="ds-showcase__swatch-row">
                {[50, 100, 200, 500, 600, 800].map((step) => (
                  <span
                    key={step}
                    className="ds-showcase__swatch"
                    style={{ background: `var(--ds-accent-${step})` }}
                  >
                    {step}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <Text variant="h3" style={{ marginBottom: 8 }}>Neutral — אפורים</Text>
              <div className="ds-showcase__swatch-row">
                {NEUTRAL_SWATCHES.map(({ token, bg }) => (
                  <span key={token} className="ds-showcase__swatch" style={{ background: bg }}>
                    {token}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Typography */}
        <section className="ds-showcase__section">
          <Text variant="h2" className="ds-showcase__section-title">
            טיפוגרפיה
          </Text>
          <div className="ds-showcase__stack">
            <Text variant="display">Display — כותרת ראשית</Text>
            <Text variant="h1">H1 — כותרת עמוד</Text>
            <Text variant="h2">H2 — כותרת סקשן</Text>
            <Text variant="h3">H3 — כותרת משנית</Text>
            <Text variant="body">Body — טקסט גוף רגיל לקריאה נוחה</Text>
            <Text variant="small">Small — טקסט משני ומטא-דאטה</Text>
            <Text variant="caption">Caption — תוויות קטנות וסטטוס</Text>
            <p className="ds-financial">₪12,400.00 — Financial</p>
          </div>
        </section>

        {/* Buttons */}
        <section className="ds-showcase__section">
          <Text variant="h2" className="ds-showcase__section-title">
            כפתורים (4 סגנונות)
          </Text>
          <div className="ds-showcase__stack">
            <div className="ds-showcase__row">
              <Button variant="primary">Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
            </div>
            <div className="ds-showcase__row">
              <Button variant="primary" disabled>
                Disabled
              </Button>
              <Button
                variant="primary"
                loading={loading}
                onClick={() => {
                  setLoading(true);
                  setTimeout(() => setLoading(false), 1500);
                }}
              >
                {loading ? 'Loading…' : 'Click to load'}
              </Button>
            </div>
            <div className="ds-showcase__row">
              <Button variant="primary" size="sm">Small</Button>
              <Button variant="primary" size="md">Medium</Button>
              <Button variant="primary" size="lg">Large</Button>
            </div>
            <Text variant="caption" tone="muted">Icon — כפתור אייקון</Text>
            <div className="ds-showcase__row">
              <IconButton icon={Bell} variant="outline" aria-label="התראות" />
              <IconButton icon={Plus} variant="primary" aria-label="הוסף" />
              <IconButton icon={Search} variant="secondary" aria-label="חיפוש" />
            </div>
          </div>
        </section>

        {/* FAB — preview only, not fixed in showcase container */}
        <section className="ds-showcase__section">
          <Text variant="h2" className="ds-showcase__section-title">
            FAB
          </Text>
          <div className="ds-showcase__row">
            <button type="button" className="ds-fab ds-fab--extended" style={{ position: 'static' }} aria-label="יצירה">
              <Plus size={24} strokeWidth={2} aria-hidden />
              <span>יצירה חדשה</span>
            </button>
          </div>
        </section>

        {/* Cards */}
        <section className="ds-showcase__section">
          <Text variant="h2" className="ds-showcase__section-title">
            כרטיסים
          </Text>
          <div className="ds-showcase__stack">
            <DefaultCard header={<Text variant="h3">Default Card</Text>}>
              <Text variant="body">כרטיס בסיסי — רדיוס 16px, גבול עדין, צל רך.</Text>
            </DefaultCard>

            <div className="ds-showcase__grid ds-showcase__grid--2">
              <MetricCard
                label="הכנסות החודש"
                value="₪12,400"
                hint="+8% מהחודש שעבר"
                tone="success"
                icon={<Icon icon={DollarSign} tone="success" />}
              />
              <MetricCard
                label="אירועים פעילים"
                value="14"
                tone="primary"
                icon={<Icon icon={Calendar} tone="primary" />}
              />
            </div>

            <StatisticCard
              label="סה״כ הכנסות"
              value="₪48,200"
              delta="up"
              deltaLabel="+12.4%"
              period="לעומת חודש קודם"
              icon={<Icon icon={DollarSign} tone="muted" size="lg" />}
            />

            <ActivityCard
              interactive
              title="טופס חדש התקבל"
              meta="שרה כהן · יום הולדת"
              aside="לפני 5 דק׳"
              icon={<Icon icon={Sparkles} tone="primary" />}
            />

            <ClientCard
              interactive
              name="דנה לוי"
              contact="050-1234567"
              meta="3 אירועים · לקוחה מ‑2024"
              revenue="₪8,200"
              avatar={<Avatar initials="דל" />}
            />

            <SettingsCard
              to="/settings"
              title="הגדרות עסק"
              description="קונספט, תבניות והעדפות"
              icon={<Icon icon={Users} tone="primary" />}
            />
          </div>
        </section>

        {/* Inputs */}
        <section className="ds-showcase__section">
          <Text variant="h2" className="ds-showcase__section-title">
            שדות קלט
          </Text>
          <div className="ds-showcase__stack">
            <Field label="שם מלא" hint="כפי שמופיע בחשבונית">
              <Input placeholder="הקלידו שם" />
            </Field>

            <Field label="סוג שירות">
              <Select
                placeholder="בחרו…"
                options={[
                  { value: 'event', label: 'אירוע' },
                  { value: 'photo', label: 'צילום' },
                  { value: 'coaching', label: 'אימון' },
                ]}
              />
            </Field>

            <Field label="חיפוש">
              <SearchInput
                placeholder="חיפוש לקוחות…"
                startIcon={<Icon icon={Search} tone="muted" />}
              />
            </Field>

            <div className="ds-showcase__grid ds-showcase__grid--2">
              <Field label="תאריך">
                <DateInput />
              </Field>
              <Field label="שעה">
                <TimeInput />
              </Field>
            </div>

            <Toggle label="התראות פוש" checked={toggleOn} onChange={setToggleOn} />
            <Checkbox label="אישור תנאי שימוש" checked={checked} onChange={setChecked} />
          </div>
        </section>

        {/* Badges */}
        <section className="ds-showcase__section">
          <Text variant="h2" className="ds-showcase__section-title">
            תגיות סטטוס (Badge)
          </Text>
          <Text variant="small" tone="secondary" style={{ marginBottom: 12 }}>
            Success · Waiting · Upcoming · Completed · Cancelled
          </Text>
          <div className="ds-showcase__row">
            {BADGE_STATUSES.map((status) => (
              <Badge key={status} variant={status} />
            ))}
          </div>
          <Text variant="caption" tone="muted" style={{ marginTop: 16, marginBottom: 8 }}>
            Legacy variants (ממופים אוטומטית)
          </Text>
          <div className="ds-showcase__row">
            <Badge variant="paid" />
            <Badge variant="pending" />
            <Badge variant="vip" />
            <Badge variant="today" />
            <Badge variant="tomorrow" />
            <Badge variant="this-week" />
          </div>
        </section>

        {/* Empty state */}
        <section className="ds-showcase__section">
          <Text variant="h2" className="ds-showcase__section-title">
            מצב ריק (Empty State)
          </Text>
          <DefaultCard>
            <EmptyState
              icon={Inbox}
              title="אין פעילויות עדיין"
              description="כשיתקבלו טפסים או לידים חדשים, הם יופיעו כאן."
              actionLabel="הוסף מקור"
              actionTo="/sources"
            />
          </DefaultCard>
        </section>

        {/* Divider */}
        <section className="ds-showcase__section">
          <Text variant="h2" className="ds-showcase__section-title">
            מפריד (Divider)
          </Text>
          <Divider />
          <Divider label="או" />
        </section>

        {/* Spacing & radius reference */}
        <section className="ds-showcase__section">
          <Text variant="h2" className="ds-showcase__section-title">
            ריווח · רדיוס · צל
          </Text>
          <Text variant="small" tone="secondary">
            8pt grid: 4 · 8 · 16 · 24 · 32
          </Text>
          <div className="ds-showcase__row" style={{ marginTop: 12 }}>
            {[
              { label: 'Card', radius: 'var(--ds-radius-card)' },
              { label: 'Button', radius: 'var(--ds-radius-button)' },
              { label: 'Badge', radius: 'var(--ds-radius-badge)' },
            ].map(({ label, radius }) => (
              <div
                key={label}
                style={{
                  minWidth: 72,
                  height: 48,
                  padding: '0 12px',
                  background: 'var(--ds-color-bg-elevated)',
                  border: '1px solid var(--ds-color-border)',
                  borderRadius: radius,
                  boxShadow: 'var(--ds-shadow-xs)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 11,
                  fontWeight: 600,
                }}
              >
                {label}
              </div>
            ))}
          </div>
        </section>
      </div>
      <BottomNav />
    </div>
  );
}
