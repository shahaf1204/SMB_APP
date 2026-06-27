import type { Category } from '../types/models';

export function sortCategories(categories: Category[]): Category[] {
  return [...categories].sort((a, b) => {
    const ao = a.sortOrder ?? Number.MAX_SAFE_INTEGER;
    const bo = b.sortOrder ?? Number.MAX_SAFE_INTEGER;
    if (ao !== bo) return ao - bo;
    return a.name.localeCompare(b.name, 'he');
  });
}

/** Assign sortOrder to legacy categories that were saved before ordering existed. */
export function normalizeCategorySortOrders(categories: Category[]): Category[] {
  if (categories.length === 0) return categories;
  const needsMigration = categories.some((c) => typeof c.sortOrder !== 'number');
  if (!needsMigration) return sortCategories(categories);

  const active = categories.filter((c) => c.isActive);
  const inactive = categories.filter((c) => !c.isActive);
  const activeWithOrder = active.map((c, i) => ({ ...c, sortOrder: i }));
  const inactiveWithOrder = inactive.map((c, i) => ({
    ...c,
    sortOrder: activeWithOrder.length + i,
  }));
  return sortCategories([...activeWithOrder, ...inactiveWithOrder]);
}

export function nextCategorySortOrder(categories: Category[]): number {
  if (categories.length === 0) return 0;
  return Math.max(...categories.map((c) => c.sortOrder ?? 0)) + 1;
}

export function withCategorySortOrders<T extends Omit<Category, 'id' | 'sortOrder'>>(
  defs: T[],
): Array<T & { sortOrder: number }> {
  return defs.map((c, i) => ({ ...c, sortOrder: i }));
}
