export type AssistantPresetCategory = 'queries' | 'actions';

export interface AssistantQueryPreset {
  id: string;
  label: string;
  prompt: string;
  description?: string;
  icon?: string;
}

export interface AssistantActionPreset {
  id: string;
  label: string;
  icon?: string;
  description: string;
  /** בונה את הפקודה לעוזר מתוך שדות הטופס */
  buildPrompt: (values: Record<string, string>) => string | null;
  fields: {
    id: string;
    label: string;
    placeholder: string;
    required?: boolean;
    type?: 'text' | 'number' | 'date' | 'event-select';
  }[];
}

/** שאלות מוכנות — נשלחות כמו שהן לעוזר */
export const ASSISTANT_QUERY_PRESETS: AssistantQueryPreset[] = [
  {
    id: 'finance-month',
    label: 'סיכום חודשי',
    icon: '📆',
    prompt: 'סיכום חודשי',
    description: 'הכנסות, הוצאות, רווח ואירועים החודש',
  },
  {
    id: 'finance-summary',
    label: 'סיכום כספי',
    icon: '🧾',
    prompt: 'סיכום כספי מצטבר',
    description: 'מצטבר לכל העסק (כל האירועים)',
  },
  {
    id: 'today',
    label: 'מה להיום',
    icon: '✅',
    prompt: 'מה להיום?',
    description: 'משימות ותזכורות ליום הנוכחי',
  },
  {
    id: 'next-event',
    label: 'האירוע הקרוב',
    icon: '📍',
    prompt: 'מה האירוע הקרוב?',
    description: 'האירוע העתידי הראשון ביומן',
  },
  {
    id: 'events-week',
    label: 'אירועים השבוע',
    icon: '📅',
    prompt: 'כמה אירועים השבוע?',
    description: 'ב-7 הימים הקרובים',
  },
  {
    id: 'events-upcoming',
    label: 'רשימת אירועים',
    icon: '🗓️',
    prompt: 'מה האירועים הקרובים?',
    description: 'עד 5 אירועים עתידיים',
  },
  {
    id: 'leads-count',
    label: 'לידים פתוחים',
    icon: '📣',
    prompt: 'כמה לידים פתוחים?',
  },
  {
    id: 'invoices-unpaid',
    label: 'חשבוניות לגבייה',
    icon: '💳',
    prompt: 'חשבוניות לגבייה',
    description: 'טיוטות ונשלחו שטרם שולמו',
  },
  {
    id: 'invoices-overdue',
    label: 'חשבוניות באיחור',
    icon: '⚠️',
    prompt: 'חשבוניות באיחור',
  },
  {
    id: 'help',
    label: 'כל האפשרויות',
    icon: '💡',
    prompt: 'עזרה',
    description: 'רשימה מלאה של שאלות ופעולות',
  },
];

/** פעולות עם טופס קצר — נבנית פקודה מדויקת */
export const ASSISTANT_ACTION_PRESETS: AssistantActionPreset[] = [
  {
    id: 'task',
    label: 'הוספת משימה',
    icon: '✏️',
    description: 'תיזכורת בלשונית "היום"',
    fields: [
      { id: 'title', label: 'תיאור המשימה', placeholder: 'לחזור ללקוח', required: true },
      { id: 'dueDate', label: 'תאריך יעד', placeholder: '', required: true, type: 'date' },
    ],
    buildPrompt: (v) => {
      const title = v.title?.trim();
      const dueDate = v.dueDate?.trim();
      if (!title || !dueDate) return null;
      return `הוסף משימה בתאריך ${dueDate} שם ${title}`;
    },
  },
  {
    id: 'lead',
    label: 'הוספת ליד',
    icon: '👤',
    description: 'ליד חדש ברשימת לידים',
    fields: [
      { id: 'name', label: 'שם', placeholder: 'ישראל ישראלי', required: true },
      { id: 'phone', label: 'טלפון (אופציונלי)', placeholder: '050-1234567' },
    ],
    buildPrompt: (v) => {
      const name = v.name?.trim();
      if (!name) return null;
      const phone = v.phone?.trim();
      return phone ? `צור ליד ${name} ${phone}` : `צור ליד ${name}`;
    },
  },
  {
    id: 'invoice',
    label: 'יצירת חשבונית',
    icon: '🧾',
    description: 'קישור לאירוע שכבר התקיים (אופציונלי)',
    fields: [
      {
        id: 'eventId',
        label: 'אירוע (רשימה)',
        placeholder: '',
        type: 'event-select',
      },
      { id: 'client', label: 'שם לקוח', placeholder: 'דני כהן', required: true },
      { id: 'amount', label: 'סכום (₪)', placeholder: '1500', required: true, type: 'number' },
    ],
    buildPrompt: (v) => {
      const client = v.client?.trim();
      const amount = Number(v.amount);
      if (!client || !Number.isFinite(amount) || amount <= 0) return null;
      const eventId = v.eventId?.trim();
      if (eventId) return `צור חשבונית ל${client} ${amount} אירוע ${eventId}`;
      return `צור חשבונית ל${client} ${amount}`;
    },
  },
  {
    id: 'event',
    label: 'הוספת אירוע',
    icon: '📅',
    description: 'שם, תאריך והכנסה צפויה',
    fields: [
      { id: 'title', label: 'שם האירוע', placeholder: 'צילום אירוע', required: true },
      {
        id: 'eventDate',
        label: 'תאריך',
        placeholder: '',
        required: true,
        type: 'date',
      },
      { id: 'revenue', label: 'הכנסה צפויה (₪, אופציונלי)', placeholder: '3000', type: 'number' },
    ],
    buildPrompt: (v) => {
      const title = v.title?.trim();
      const eventDate = v.eventDate?.trim();
      if (!title || !eventDate) return null;
      const rev = v.revenue?.trim();
      if (rev && Number(rev) > 0) {
        return `הוסף אירוע בתאריך ${eventDate} שם ${title} הכנסה ${rev}`;
      }
      return `הוסף אירוע בתאריך ${eventDate} שם ${title}`;
    },
  },
];

export function formatAssistantCatalog(): string {
  const queries = ASSISTANT_QUERY_PRESETS.map((p) => `• ${p.label} — ${p.prompt}`).join('\n');
  const actions = ASSISTANT_ACTION_PRESETS.map((p) => `• ${p.label}`).join('\n');
  return [
    'לחצו על כפתור מהרשימה למעלה, או העתיקו את הניסוח המדויק:',
    '',
    '**שאלות:**',
    queries,
    '',
    '**פעולות (ממלאים בטופס ואז מאשרים):**',
    actions,
  ].join('\n');
}

export const DEFAULT_QUERY_SUGGESTIONS = ASSISTANT_QUERY_PRESETS.slice(0, 4).map(
  (p) => p.prompt,
);
