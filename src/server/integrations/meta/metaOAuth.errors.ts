export type MetaOAuthErrorCode =
  | 'user_cancelled'
  | 'invalid_state'
  | 'state_expired'
  | 'state_consumed'
  | 'state_user_mismatch'
  | 'oauth_exchange_failed'
  | 'page_discovery_failed'
  | 'no_pages_available'
  | 'invalid_page_selection'
  | 'page_subscription_failed'
  | 'authorization_failed'
  | 'attempt_expired'
  | 'attempt_consumed'
  | 'attempt_not_found'
  | 'attempt_access_denied'
  | 'stale_attempt'
  | 'configuration_error'
  | 'page_already_connected';

export class MetaOAuthError extends Error {
  constructor(
    readonly code: MetaOAuthErrorCode,
    message?: string,
  ) {
    super(message ?? code);
    this.name = 'MetaOAuthError';
  }
}

export function safeMetaOAuthUserMessage(code: MetaOAuthErrorCode): string {
  const messages: Record<MetaOAuthErrorCode, string> = {
    user_cancelled: 'חיבור Meta בוטל.',
    invalid_state: 'בקשת OAuth לא תקינה. נסו שוב.',
    state_expired: 'פג תוקף בקשת OAuth. נסו שוב.',
    state_consumed: 'בקשת OAuth כבר נוצלה.',
    state_user_mismatch: 'בקשת OAuth לא תואמת למשתמש.',
    oauth_exchange_failed: 'החלפת קוד OAuth נכשלה.',
    page_discovery_failed: 'לא הצלחנו לטעון עמודים מ-Meta.',
    no_pages_available: 'לא נמצאו עמודים זמינים בחשבון Meta.',
    invalid_page_selection: 'העמוד שנבחר אינו מורשה.',
    page_subscription_failed: 'הרשמת Webhook לעמוד נכשלה.',
    authorization_failed: 'ההרשאה נדחתה.',
    attempt_expired: 'פג תוקף חיבור Meta. התחילו מחדש.',
    attempt_consumed: 'חיבור Meta כבר הושלם.',
    attempt_not_found: 'בקשת חיבור לא נמצאה.',
    attempt_access_denied: 'אין גישה לבקשת חיבור זו.',
    stale_attempt: 'בקשת חיבור ישנה — יש חיבור עדכני יותר.',
    configuration_error: 'השרת לא מוגדר לחיבור Meta.',
    page_already_connected: 'עמוד Meta זה כבר מחובר לעסק אחר במערכת.',
  };
  return messages[code];
}

const SECRET_PATTERNS: Array<(s: string) => string> = [
  (s) => s.replace(/access_token=[^&\s'"]+/gi, 'access_token=[REDACTED]'),
  (s) => s.replace(/client_secret=[^&\s'"]+/gi, 'client_secret=[REDACTED]'),
  (s) => s.replace(/Bearer\s+[A-Za-z0-9._-]+/gi, 'Bearer [REDACTED]'),
  (s) => s.replace(/EAA[A-Za-z0-9]+/g, 'EAA[REDACTED]'),
  (s) => s.replace(/pages_payload_encrypted[^,\s]*/gi, 'pages_payload_encrypted=[REDACTED]'),
];

/** Safe for last_error, API JSON, and redirects — never persist/query tokens. */
export function sanitizeMetaPersistedError(raw: string): string {
  let out = raw;
  for (const fn of SECRET_PATTERNS) {
    out = fn(out);
  }
  return out.slice(0, 500);
}
