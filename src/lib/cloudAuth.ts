import {
  cloudSignOut,
  hydrateUserFromCloud,
} from './cloudSync';
import { getSupabase, isSupabaseConfigured } from './supabase';

export type CloudAuthResult =
  | { ok: true }
  | { ok: false; message: string };

function authErrorMessage(message: string): string {
  if (message.includes('Invalid login credentials')) {
    return 'אימייל או סיסמה שגויים';
  }
  if (message.includes('User already registered')) {
    return 'כבר קיים חשבון עם האימייל הזה. עברי ל«התחברות».';
  }
  if (message.includes('Password should be at least')) {
    return 'הסיסמה חייבת להכיל לפחות 6 תווים';
  }
  return message;
}

export async function cloudRegister(
  displayName: string,
  email: string,
  password: string,
): Promise<CloudAuthResult> {
  if (!isSupabaseConfigured()) {
    return { ok: false, message: 'הענן לא מוגדר — פנה/י למנהל המערכת' };
  }

  const supabase = getSupabase();
  const trimmedEmail = email.trim().toLowerCase();
  const trimmedName = displayName.trim();

  const { data, error } = await supabase.auth.signUp({
    email: trimmedEmail,
    password,
    options: {
      data: { display_name: trimmedName },
    },
  });

  if (error) {
    return { ok: false, message: authErrorMessage(error.message) };
  }

  const user = data.user;
  if (!user?.id || !user.email) {
    return {
      ok: false,
      message: 'נדרש אימות אימייל — בדק/י את תיבת הדואר (או כב/י Confirm email ב-Supabase)',
    };
  }

  if (!data.session) {
    const signIn = await supabase.auth.signInWithPassword({
      email: trimmedEmail,
      password,
    });
    if (signIn.error || !signIn.data.session) {
      return {
        ok: false,
        message: 'החשבון נוצר — אשר/י את האימייל ואז התחבר/י',
      };
    }
  }

  try {
    await hydrateUserFromCloud(user.id, trimmedEmail, trimmedName);
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      message: e instanceof Error ? e.message : 'שגיאה בטעינת נתונים',
    };
  }
}

export async function cloudLogin(email: string, password: string): Promise<CloudAuthResult> {
  if (!isSupabaseConfigured()) {
    return { ok: false, message: 'הענן לא מוגדר — פנה/י למנהל המערכת' };
  }

  const supabase = getSupabase();
  const trimmedEmail = email.trim().toLowerCase();

  const { data, error } = await supabase.auth.signInWithPassword({
    email: trimmedEmail,
    password,
  });

  if (error) {
    return { ok: false, message: authErrorMessage(error.message) };
  }

  const user = data.user;
  if (!user?.id || !user.email) {
    return { ok: false, message: 'שגיאת התחברות' };
  }

  const displayName =
    (user.user_metadata?.display_name as string | undefined)?.trim() ||
    trimmedEmail.split('@')[0];

  try {
    await hydrateUserFromCloud(user.id, trimmedEmail, displayName);
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      message: e instanceof Error ? e.message : 'שגיאה בטעינת נתונים',
    };
  }
}

export async function cloudLogout(): Promise<void> {
  await cloudSignOut();
}

export { isSupabaseConfigured };
