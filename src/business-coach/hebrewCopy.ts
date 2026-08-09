export function packageCountPhrase(count: number): string {
  if (count === 1) return 'כרטיסייה אחת';
  if (count === 2) return '2 כרטיסיות';
  return `${count} כרטיסיות`;
}

export function sessionCountPhrase(count: number): string {
  if (count === 1) return 'מפגש אחד';
  if (count === 2) return '2 מפגשים';
  return `${count} מפגשים`;
}

export function clientNameWithPrefix(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return 'הלקוח';
  return trimmed;
}

export function expiringTitle(count: number): string {
  if (count === 1) return 'כרטיסייה אחת עומדת לפוג';
  if (count === 2) return '2 כרטיסיות עומדות לפוג בקרוב';
  return `${count} כרטיסיות עומדות לפוג בקרוב`;
}

export function nearCompletionTitle(count: number): string {
  if (count === 1) return '';
  if (count === 2) return '2 כרטיסיות קרובות לסיום';
  return `${count} כרטיסיות קרובות לסיום`;
}

export function nearCompletionSingleTitle(remaining: number, clientName: string): string {
  return `נותרו רק ${sessionCountPhrase(remaining)} ל${clientNameWithPrefix(clientName)}`;
}

export function expiredUnusedTitle(count: number): string {
  if (count === 1) return 'כרטיסייה פגה עם מפגשים שלא נוצלו';
  return `${packageCountPhrase(count)} פגו עם מפגשים שלא נוצלו`;
}
