import type { AssistantAction } from '../types/ai';
import type { Category, EventValue } from '../types/models';
function firstRevenueCategoryId(categories: Category[]): string | null {
  const cat = categories.find((c) => c.isActive && c.metricRole === 'revenue');
  return cat?.id ?? null;
}

export interface AssistantActionStore {
  business: { id: string } | null;
  user: { id: string } | null;
  categories: Category[];
  addTask: (title: string, dueDate: string) => void;
  addLead: (lead: {
    name: string;
    phone?: string;
    email?: string;
    source: 'other';
    notes: string;
  }) => void;
  createInvoice: (params: {
    clientName: string;
    clientEmail?: string;
    amount: number;
    eventId?: string;
    notes?: string;
  }) => string;
  addEvent: (
    event: { title: string; eventDate: string; location: string; notes: string },
    values: EventValue[],
  ) => void;
}

export function executeAssistantAction(
  action: AssistantAction,
  store: AssistantActionStore,
): { ok: boolean; message: string } {
  if (!store.business || !store.user) {
    return { ok: false, message: 'יש להתחבר ולהגדיר עסק לפני ביצוע פעולות.' };
  }

  switch (action.type) {
    case 'add_task': {
      const title = String(action.payload.title ?? '').trim();
      const dueDate = String(action.payload.dueDate ?? new Date().toISOString().slice(0, 10));
      if (!title) return { ok: false, message: 'חסר כותרת למשימה.' };
      store.addTask(title, dueDate);
      return { ok: true, message: `נוספה משימה: ${title}` };
    }
    case 'add_lead': {
      const name = String(action.payload.name ?? '').trim();
      if (!name) return { ok: false, message: 'חסר שם לליד.' };
      store.addLead({
        name,
        phone: action.payload.phone ? String(action.payload.phone) : undefined,
        email: action.payload.email ? String(action.payload.email) : undefined,
        source: 'other',
        notes: action.payload.notes ? String(action.payload.notes) : '',
      });
      return { ok: true, message: `נוסף ליד: ${name}` };
    }
    case 'create_invoice': {
      const clientName = String(action.payload.clientName ?? '').trim();
      const amount = Number(action.payload.amount);
      if (!clientName || !Number.isFinite(amount) || amount <= 0) {
        return { ok: false, message: 'חסרים שם לקוח או סכום תקין לחשבונית.' };
      }
      const eventId = action.payload.eventId
        ? String(action.payload.eventId).trim()
        : undefined;
      const id = store.createInvoice({
        clientName,
        amount,
        eventId: eventId || undefined,
        notes: action.payload.notes ? String(action.payload.notes) : '',
      });
      return id
        ? {
            ok: true,
            message: `נוצרה חשבונית ל-${clientName} בסך ${amount} ₪${eventId ? ' (מקושרת לאירוע)' : ''}`,
          }
        : { ok: false, message: 'יצירת החשבונית נכשלה.' };
    }
    case 'add_event': {
      const title = String(action.payload.title ?? '').trim();
      const eventDate = String(
        action.payload.eventDate ?? new Date().toISOString().slice(0, 10),
      );
      if (!title) return { ok: false, message: 'חסר שם לאירוע.' };
      const revenueCatId = firstRevenueCategoryId(store.categories);
      const revenue = Number(action.payload.revenue);
      const values =
        revenueCatId && Number.isFinite(revenue) && revenue > 0
          ? ([{ categoryId: revenueCatId, revenueValue: revenue }] as EventValue[])
          : [];
      store.addEvent(
        {
          title,
          eventDate,
          location: String(action.payload.location ?? ''),
          notes: String(action.payload.notes ?? ''),
        },
        values,
      );
      return { ok: true, message: `נוסף אירוע: ${title} (${eventDate})` };
    }
    default:
      return { ok: false, message: 'פעולה לא נתמכת.' };
  }
}
