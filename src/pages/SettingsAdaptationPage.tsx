import { ChevronLeft, FolderTree, Layers, Route, Sparkles, Tags } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BottomNav } from '../components/BottomNav';

const ADAPTATION_LINKS = [
  {
    to: '/onboarding?mode=edit',
    label: 'עדכון התאמת העסק',
    desc: 'סוג עסק, צורת עבודה, קטגוריות וסיכום',
    icon: Sparkles,
  },
  {
    to: '/settings/operating-model',
    label: 'צורת העבודה של העסק',
    desc: 'מודל ראשי ומודלים נוספים',
    icon: Layers,
  },
  {
    to: '/categories',
    label: 'קטגוריות ושדות',
    desc: 'עריכה, סדר ותפקידי מetric',
    icon: Tags,
  },
  {
    to: '/settings/business',
    label: 'תהליכי עבודה ותבניות',
    desc: 'תבניות אירוע, הוצאות והגדרות נוספות',
    icon: Route,
  },
  {
    to: '/settings/business',
    label: 'שמות ומונחים באפליקציה',
    desc: 'מונחים נגזרים מצורת העבודה — ניתן לשנות בהמשך',
    icon: FolderTree,
  },
] as const;

const ADAPTATION_NOTICE =
  'השינוי יעדכן המלצות וברירות מחדל, אך לא ימחק פעילויות או קטגוריות קיימות.';

export function SettingsAdaptationPage() {
  return (
    <div className="app-shell">
      <div className="page">
        <Link to="/settings" className="back-link">
          ← הגדרות
        </Link>
        <h1 className="page-title">התאמת העסק</h1>
        <p className="page-subtitle">{ADAPTATION_NOTICE}</p>

        <ul className="hub-card-list hub-card-list--lg">
          {ADAPTATION_LINKS.map(({ to, label, desc, icon: Icon }) => (
            <li key={`${to}-${label}`}>
              <Link to={to} className="hub-card hub-card--lg">
                <span className="hub-card-icon hub-card-icon--lg" aria-hidden>
                  <Icon size={24} strokeWidth={1.75} />
                </span>
                <span className="hub-card-body">
                  <strong>{label}</strong>
                  <span className="hub-card-desc">{desc}</span>
                </span>
                <ChevronLeft size={20} className="hub-card-chevron" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <BottomNav />
    </div>
  );
}
