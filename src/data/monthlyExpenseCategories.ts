import type { MonthlyExpenseCategoryId } from '../types/models';

export const MONTHLY_EXPENSE_CATEGORIES: Array<{
  id: MonthlyExpenseCategoryId;
  label: string;
}> = [
  { id: 'rent', label: 'שכירות / חדר' },
  { id: 'marketing', label: 'פרסום ושיווק' },
  { id: 'subscriptions', label: 'מנויים ותוכנות' },
  { id: 'travel', label: 'נסיעות ודלק' },
  { id: 'equipment', label: 'ציוד וחומרים' },
  { id: 'professional', label: 'שירותים מקצועיים' },
  { id: 'other', label: 'אחר' },
];

export const EXPENSE_TRACKING_MODE_OPTIONS: Array<{
  id: 'per_activity' | 'monthly' | 'both';
  label: string;
  desc: string;
}> = [
  {
    id: 'per_activity',
    label: 'לפי פעילות',
    desc: 'הוצאה ספציפית לכל אירוע או פעילות',
  },
  {
    id: 'monthly',
    label: 'הוצאות חודשיות',
    desc: 'דיווח פעם בחודש — שכירות, פרסום, מנויים וכו׳',
  },
  {
    id: 'both',
    label: 'שניהם',
    desc: 'הוצאות ישירות בפעילות + הוצאות כלליות חודשיות',
  },
];

export function monthlyExpenseCategoryLabel(id: MonthlyExpenseCategoryId): string {
  return MONTHLY_EXPENSE_CATEGORIES.find((c) => c.id === id)?.label ?? id;
}
