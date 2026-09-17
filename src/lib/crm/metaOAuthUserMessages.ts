/** User-facing Hebrew messages for Meta connection — no technical vocabulary. */

const ERROR_MESSAGES: Record<string, string> = {
  user_cancelled: 'החיבור בוטל. אפשר לנסות שוב מתי שתרצי.',
  invalid_state: 'לא הצלחנו להמשיך את החיבור. אפשר להתחיל מחדש.',
  state_expired: 'תהליך החיבור פג. אפשר להתחיל מחדש.',
  state_consumed: 'תהליך החיבור כבר הושלם או שפג. אפשר להתחיל מחדש.',
  oauth_exchange_failed: 'לא הצלחנו להשלים את החיבור כרגע. נסי שוב.',
  page_discovery_failed: 'לא הצלחנו לטעון את עמודי העסק. נסי שוב.',
  no_pages_available:
    'לא נמצאו עמודי Facebook זמינים בחשבון. ודא/י שיש לך הרשאה לנהל עמוד עסק.',
  invalid_page_selection: 'לא ניתן לבחור את העמוד הזה. בחרי עמוד אחר או התחילי מחדש.',
  page_subscription_failed: 'לא הצלחנו להשלים את החיבור כרגע. נסי שוב.',
  page_already_connected: 'העמוד הזה כבר מחובר לעסק אחר במערכת.',
  authorization_failed: 'לא הצלחנו לאמת את החיבור. נסי שוב.',
  attempt_expired: 'תהליך החיבור פג. אפשר להתחיל מחדש.',
  attempt_consumed: 'תהליך החיבור כבר הושלם. אפשר לרענן את העמוד.',
  attempt_not_found: 'לא נמצא תהליך חיבור פעיל. אפשר להתחיל מחדש.',
  attempt_access_denied: 'אין הרשאה להמשיך את החיבור הזה.',
  stale_attempt: 'יש כבר חיבור עדכני יותר. רענני את העמוד.',
  business_access_denied: 'אין הרשאה לחבר את העסק הזה.',
  business_snapshot_missing: 'יש להשלים הגדרת העסק לפני חיבור Facebook ו-Instagram.',
  authorization_required: 'יש להתחבר לחשבון לפני חיבור Facebook ו-Instagram.',
  invalid_token: 'פג תוקף ההתחברות. התחברי מחדש ונסי שוב.',
  configuration_error: 'החיבור אינו זמין כרגע. נסי שוב מאוחר יותר.',
  oauth_start_failed: 'לא הצלחנו להתחיל את החיבור. נסי שוב.',
  attempt_load_failed: 'לא הצלחנו להמשיך את החיבור. אפשר להתחיל מחדש.',
  page_selection_failed: 'לא הצלחנו להשלים את החיבור. נסי שוב.',
  not_authenticated: 'יש להתחבר לחשבון לפני חיבור Facebook ו-Instagram.',
};

const GENERIC_ERROR =
  'משהו לא הצליח בחיבור. אפשר לנסות שוב או להתחיל מחדש.';

export function mapMetaOAuthErrorToUserMessage(errorCodeOrText: string | undefined): string {
  if (!errorCodeOrText?.trim()) return GENERIC_ERROR;
  const key = errorCodeOrText.trim();
  if (ERROR_MESSAGES[key]) return ERROR_MESSAGES[key];
  if (/^[a-z_]+$/i.test(key) && key.includes('_')) {
    return GENERIC_ERROR;
  }
  return GENERIC_ERROR;
}

export const META_CONNECTION_COPY = {
  title: 'Facebook ו-Instagram',
  benefit:
    'חברי את Facebook ו-Instagram לעסק כדי שלידים חדשים מהפרסומים שלך ייכנסו אוטומטית למערכת.',
  afterConnectHint:
    'לידים חדשים מהמקורות הנתמכים יופיעו ברשימת הלידים — ותוכלי להמשיך לנהל אותם מהאפליקציה.',
  ctaConnect: 'חיבור Facebook ו-Instagram',
  ctaReconnect: 'חידוש החיבור',
  ctaSettings: 'הגדרות חיבור',
  ctaTryAgain: 'נסי שוב',
  ctaStartOver: 'התחילי מחדש',
  pageSelectTitle: 'בחרי את עמוד העסק שתרצי לחבר',
  pageSelectHint: 'הלידים מהפרסומים של העמוד הזה יוכלו להיכנס אוטומטית לרשימת הלידים.',
  pageSelectConfirm: 'אישור וחיבור',
  connectedTitle: 'Facebook ו-Instagram מחוברים',
  connectedReady:
    'החיבור פעיל. לידים חדשים מהמקורות הנתמכים של Meta יוכלו להיכנס אוטומטית למערכת.',
  successTitle: 'החיבור הושלם',
  successBody:
    'מהיום לידים חדשים מהמקורות הנתמכים של Facebook ו-Instagram יוכלו להיכנס אוטומטית למערכת.',
  reconnectRequiredTitle: 'צריך לחדש את החיבור ל-Facebook ו-Instagram',
  reconnectRequiredBody: 'החיבור הקיים דורש חידוש — הנתונים שלך נשמרים.',
  connecting: 'מתחברים…',
  loadingPages: 'טוענים את עמודי העסק…',
  optionalNote:
    'חיבור Meta הוא אופציונלי — אפשר להמשיך לנהל לידים גם בלי Facebook ו-Instagram.',
} as const;
