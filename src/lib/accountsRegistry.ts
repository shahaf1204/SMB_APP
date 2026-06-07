const REGISTRY_KEY = 'smb-accounts-registry';

export interface AccountRecord {
  email: string;
  displayName: string;
  userId: string;
  createdAt: string;
}

function loadRegistry(): AccountRecord[] {
  try {
    const raw = localStorage.getItem(REGISTRY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as AccountRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveRegistry(records: AccountRecord[]): void {
  try {
    localStorage.setItem(REGISTRY_KEY, JSON.stringify(records));
  } catch {
    /* ignore */
  }
}

export function findAccountByEmail(email: string): AccountRecord | null {
  const mail = email.trim().toLowerCase();
  if (!mail) return null;
  return loadRegistry().find((r) => r.email === mail) ?? null;
}

export function registerAccount(record: Omit<AccountRecord, 'createdAt'>): boolean {
  const mail = record.email.trim().toLowerCase();
  if (!mail) return false;
  const registry = loadRegistry();
  if (registry.some((r) => r.email === mail)) return false;
  registry.push({
    ...record,
    email: mail,
    displayName: record.displayName.trim(),
    createdAt: new Date().toISOString(),
  });
  saveRegistry(registry);
  return true;
}

export function ensureAccountInRegistry(user: {
  id: string;
  displayName: string;
  email?: string;
}): void {
  const mail = user.email?.trim().toLowerCase();
  if (!mail) return;
  const existing = findAccountByEmail(mail);
  if (existing) {
    if (existing.displayName !== user.displayName.trim() || existing.userId !== user.id) {
      const registry = loadRegistry().map((r) =>
        r.email === mail
          ? { ...r, displayName: user.displayName.trim(), userId: user.id }
          : r,
      );
      saveRegistry(registry);
    }
    return;
  }
  registerAccount({
    email: mail,
    displayName: user.displayName.trim(),
    userId: user.id,
  });
}

export function updateAccountDisplayName(email: string, displayName: string): void {
  const mail = email.trim().toLowerCase();
  const registry = loadRegistry().map((r) =>
    r.email === mail ? { ...r, displayName: displayName.trim() } : r,
  );
  saveRegistry(registry);
}
