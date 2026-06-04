import type { AssistantAction } from '../types/ai';
import { formatAssistantCatalog } from './assistantPresets';
import type { AssistantContextSnapshot } from './assistantContext';
import { formatMonthlySummary, formatMoney } from './assistantContext';

export interface SmartAssistantReply {
  text: string;
  pendingAction?: AssistantAction;
  suggestions?: string[];
}

/** מחר בפורמט YYYY-MM-DD — לברירת מחדל בטופס אירוע */
export function defaultEventDateIso(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

/** היום — ברירת מחדל לתאריך משימה */
export function defaultTaskDueDateIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function parseRelativeDate(text: string): string {
  const t = text.trim();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (/היום/.test(t)) return today.toISOString().slice(0, 10);
  if (/מחרתיים/.test(t)) {
    const d = new Date(today);
    d.setDate(d.getDate() + 2);
    return d.toISOString().slice(0, 10);
  }
  if (/מחר/.test(t)) {
    const d = new Date(today);
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  }
  const iso = t.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const dmy = t.match(/(\d{1,2})[./](\d{1,2})[./](\d{2,4})/);
  if (dmy) {
    const y = dmy[3].length === 2 ? `20${dmy[3]}` : dmy[3];
    const m = dmy[2].padStart(2, '0');
    const day = dmy[1].padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
  return today.toISOString().slice(0, 10);
}

function extractAmount(text: string): number | null {
  const m = text.match(/(\d[\d,]*)\s*(?:₪|שקל|ש"ח)?/);
  if (!m) return null;
  const n = Number(m[1].replace(/,/g, ''));
  return Number.isFinite(n) ? n : null;
}

function buildAddEventReply(
  title: string,
  eventDate: string,
  amount: number | null,
): SmartAssistantReply {
  const safeTitle = title.trim() || 'אירוע חדש';
  return {
    text: `אוסיף אירוע «${safeTitle}» בתאריך ${eventDate}${amount != null && amount > 0 ? ` עם הכנסה ${amount} ₪` : ''} — לאשר?`,
    pendingAction: {
      type: 'add_event',
      label: `אירוע: ${safeTitle}`,
      payload: {
        title: safeTitle,
        eventDate,
        revenue: amount != null && amount > 0 ? amount : undefined,
      },
    },
  };
}

/** פעולות — לפני שאילתות, כדי שלא יבלבלו מילות מפתח כמו "אירוע" / "משימה" */
function tryParseAddEvent(q: string): SmartAssistantReply | null {
  const structured = q.match(
    /(?:הוסף|צור)\s*אירוע\s+בתאריך\s*(\S+)\s+שם\s+(.+?)(?:\s+הכנסה\s+(\d[\d,]*))?\s*$/i,
  );
  if (structured) {
    const eventDate = parseRelativeDate(structured[1]);
    const title = structured[2].trim();
    const amount = structured[3] ? Number(structured[3].replace(/,/g, '')) : null;
    if (title.length >= 1) {
      return buildAddEventReply(title, eventDate, amount);
    }
  }

  if (!/(?:הוסף|צור)\s*אירוע/i.test(q)) return null;

  const eventMatch = q.match(/(?:הוסף|צור)\s*(?:אירוע)\s*[:\-]?\s*(.+)/i);
  if (!eventMatch) return null;

  const rest = eventMatch[1].trim();
  const eventDate = parseRelativeDate(rest);
  let working = rest
    .replace(/\d{4}-\d{2}-\d{2}/g, ' ')
    .replace(/\d{1,2}[./]\d{1,2}[./]\d{2,4}/g, ' ')
    .replace(/היום|מחרתיים|מחר/g, ' ')
    .trim();

  const amount = extractAmount(working);
  if (amount != null) {
    working = working.replace(String(amount), '').replace(/₪|שקל|הכנסה/g, '').trim();
  }
  const title = working.replace(/\s+/g, ' ').trim() || 'אירוע חדש';

  return buildAddEventReply(title, eventDate, amount);
}

function tryParseAddTask(q: string): SmartAssistantReply | null {
  const structured = q.match(
    /(?:הוסף|צור|תזכיר)\s*משימה\s+בתאריך\s*(\S+)\s+שם\s+(.+?)\s*$/i,
  );
  if (structured) {
    const dueDate = parseRelativeDate(structured[1]);
    const title = structured[2].trim();
    if (title.length >= 1) {
      return {
        text: `אוסיף משימה «${title}» לתאריך ${dueDate} — לאשר?`,
        pendingAction: {
          type: 'add_task',
          label: `משימה: ${title}`,
          payload: { title, dueDate },
        },
      };
    }
  }

  const taskMatch = q.match(/(?:הוסף|צור|תזכיר)\s*(?:משימה)\s*[:\-]?\s*(.+)/i);
  if (!taskMatch) return null;
  const title = taskMatch[1].trim();
  if (title.length < 2) return null;
  const dueDate = parseRelativeDate(q);
  return {
    text: `אוסיף משימה «${title}» לתאריך ${dueDate} — לאשר?`,
    pendingAction: {
      type: 'add_task',
      label: `משימה: ${title}`,
      payload: { title, dueDate },
    },
  };
}

function tryParseAddLead(q: string): SmartAssistantReply | null {
  const leadMatch = q.match(/(?:הוסף|צור)\s*(?:ליד)\s*[:\-]?\s*(.+)/i);
  if (!leadMatch) return null;
  const rest = leadMatch[1].trim();
  const phone = rest.match(/0\d[\d\-]{7,}/)?.[0];
  const name = phone ? rest.replace(phone, '').trim() : rest;
  if (name.length < 2) return null;
  return {
    text: `אוסיף ליד: ${name}${phone ? ` (${phone})` : ''} — לאשר?`,
    pendingAction: {
      type: 'add_lead',
      label: `ליד: ${name}`,
      payload: { name, phone },
    },
  };
}

function tryParseAddInvoice(q: string): SmartAssistantReply | null {
  const invMatch = q.match(
    /(?:הוסף|צור)\s*(?:חשבונית)\s*(?:ל|עבור)?\s*([^0-9₪]+?)\s+(\d[\d,]*)(?:\s+אירוע\s+(\S+))?\s*$/i,
  );
  if (!invMatch) return null;
  const clientName = invMatch[1].trim();
  const amount = Number(invMatch[2].replace(/,/g, ''));
  const eventId = invMatch[3]?.trim();
  if (!clientName || amount <= 0) return null;
  const eventNote = eventId ? ' (מקושרת לאירוע)' : '';
  return {
    text: `איצור חשבונית ל-${clientName} בסך ${amount} ₪${eventNote} — לאשר?`,
    pendingAction: {
      type: 'create_invoice',
      label: `חשבונית: ${clientName}`,
      payload: { clientName, amount, eventId },
    },
  };
}

export function replyWithSmartAssistant(
  message: string,
  ctx: AssistantContextSnapshot,
): SmartAssistantReply {
  const q = message.trim();
  const lower = q.toLowerCase();

  if (!q) {
    return {
      text: 'בחרו שאלה או פעולה מהרשימה למעלה. אפשר גם לכתוב בניסוח המדויק שמופיע שם.',
    };
  }

  if (/עזרה|מה אתה|מה את|אפשרויות|פקודות|רשימת פעולות|מה אפשר/.test(lower)) {
    return {
      text: [
        'אני העוזר החינמי — עובד במכשיר שלך, בלי תשלום ובלי שליחה לענן.',
        '',
        formatAssistantCatalog(),
        '',
        'לשיחה חופשית וחכמה יותר — חברו ב**הגדרות → עוזר AI בתשלום**.',
      ].join('\n'),
    };
  }

  const addEvent = tryParseAddEvent(q);
  if (addEvent) return addEvent;
  const addTask = tryParseAddTask(q);
  if (addTask) return addTask;
  const addLead = tryParseAddLead(q);
  if (addLead) return addLead;
  const addInvoice = tryParseAddInvoice(q);
  if (addInvoice) return addInvoice;

  const asksMonth =
    /סיכום חודשי|סיכום החודש|סיכום כספי החודש/.test(lower) ||
    /(?:החודש|חודשי|החודש הנוכחי|החודש נוכחי)/.test(lower) ||
    /רווח החודש|הכנסות החודש|הוצאות החודש|מצב החודש/.test(lower) ||
    /^מה ההכנסות$|^מה ההוצאות$|^מה הרווח$/.test(lower.trim());

  const asksCumulative =
    /סיכום כספי|מצב כספי|סיכום פיננסי|סיכום מצטבר|מצטבר|לכל העסק|כל הזמנים/.test(
      lower,
    );

  if (asksCumulative && !asksMonth) {
    const { revenue, expense, profit } = ctx.totalsAllTime;
    return {
      text: `סיכום מצטבר לכל העסק (${ctx.businessName}): הכנסות ${formatMoney(revenue)}, הוצאות ${formatMoney(expense)}, רווח ${formatMoney(profit)}. (מכל האירועים, כמו בדשבורד התחתון)`,
    };
  }

  if (
    asksMonth ||
    (/(?:מה|כמה|סיכום|מצב)/.test(lower) &&
      /(?:רווח|הכנס|הוצא|כספ)/.test(lower) &&
      /חודש/.test(lower))
  ) {
    return { text: formatMonthlySummary(ctx) };
  }

  if (/מה האירוע הקרוב|האירוע הבא|האירוע הקרוב/.test(lower)) {
    if (!ctx.nextEvent) {
      return { text: 'אין אירוע עתידי רשום. אפשר להוסיף אירוע בלשונית אירוע או בפעולות.' };
    }
    return {
      text: `האירוע הקרוב: ${ctx.nextEvent.title} — ${ctx.nextEvent.date}.`,
    };
  }

  if (/כמה אירועים השבוע|אירועים השבוע|אירועים ב-7/.test(lower)) {
    return {
      text:
        ctx.eventsNext7Days > 0
          ? `ב-7 הימים הקרובים רשומים ${ctx.eventsNext7Days} אירועים.`
          : 'אין אירועים ב-7 הימים הקרובים.',
    };
  }

  if (/כמה אירועים החודש|אירועים החודש/.test(lower)) {
    return {
      text: `בחודש הנוכחי רשומים ${ctx.eventsThisMonth} אירועים.`,
    };
  }

  if (/חשבוניות לגבייה|ממתינות לגבייה|חשבוניות פתוחות|לא שולמו/.test(lower)) {
    if (ctx.unpaidInvoices === 0) {
      return { text: 'אין חשבוניות פתוחות לגבייה — הכל שולם או עדיין לא הונפק.' };
    }
    return {
      text: `יש ${ctx.unpaidInvoices} חשבוניות שטרם שולמו (טיוטה או נשלחה), בסך ${formatMoney(ctx.unpaidInvoicesTotal)}.`,
    };
  }

  if (/כמה לידים|לידים פתוחים|לידים במעקב|לידים ממתינים|יש לידים/.test(lower)) {
    return {
      text:
        ctx.openLeads > 0
          ? `יש ${ctx.openLeads} לידים במעקב (חדש או בטיפול).`
          : 'אין כרגע לידים פתוחים במעקב.',
    };
  }

  if (/חשבוניות באיחור|באיחור/.test(lower)) {
    return {
      text:
        ctx.overdueInvoices > 0
          ? `יש ${ctx.overdueInvoices} חשבוניות באיחור. מומלץ לעבור ללשונית חשבוניות.`
          : 'אין חשבוניות באיחור כרגע.',
    };
  }

  if (/(?:היום|משימ|מה לעשות|דחוף|מה המשימות)/.test(lower)) {
    if (ctx.todayTasks.length === 0) {
      return {
        text: 'אין משימות דחופות רשומות להיום. אפשר להוסיף משימה בלשונית "היום" או לבקש כאן.',
      };
    }
    return {
      text: `להיום:\n• ${ctx.todayTasks.join('\n• ')}`,
    };
  }

  if (/מה האירועים|אירועים קרובים|אירועים בשבוע|מה ביומן|האירועים הקרובים/.test(lower)) {
    if (ctx.upcomingEvents.length === 0) {
      return {
        text: 'אין אירועים עתידיים רשומים. אפשר להוסיף בלשונית אירוע או בפעולות למטה.',
      };
    }
    const lines = ctx.upcomingEvents.map((e) => `• ${e.title} — ${e.date}`);
    return {
      text: `אירועים קרובים:\n${lines.join('\n')}`,
    };
  }

  return {
    text: [
      'לא זיהיתי את הבקשה. העוזר החינמי מבין בעיקר את הכפתורים והניסוחים מהרשימה למעלה.',
      '',
      'לפעולות: פתחו «פעולות במערכת» → «הוספת אירוע» (שם, תאריך, הכנסה).',
      '',
      'לשיחה חופשית — חברו AI בתשלום בהגדרות.',
    ].join('\n'),
  };
}
