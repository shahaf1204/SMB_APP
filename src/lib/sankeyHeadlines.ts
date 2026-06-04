import { formatCurrency } from './finance';

export function buildSankeyHeadline(revenue: number, expense: number, profit: number): string {
  if (revenue <= 0) return 'אין הכנסות בתקופה שנבחרה';
  if (profit >= 0) {
    return `מתוך ${formatCurrency(revenue)} הכנסות נשארו ${formatCurrency(profit)} כרווח`;
  }
  return `מתוך ${formatCurrency(revenue)} הכנסות · הוצאות ${formatCurrency(expense)}`;
}

export function buildCumulativeSankeyHeadline(
  revenue: number,
  expense: number,
  profit: number,
): string {
  if (revenue <= 0) return 'אין הכנסות מצטברות בעסק';
  if (profit >= 0) {
    return `מתוך ${formatCurrency(revenue)} הכנסות מצטברות נשארו ${formatCurrency(profit)} כרווח`;
  }
  return `מתוך ${formatCurrency(revenue)} הכנסות מצטברות · הוצאות ${formatCurrency(expense)}`;
}
