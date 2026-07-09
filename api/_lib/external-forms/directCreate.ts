import type { SupabaseClient } from '@supabase/supabase-js';
import {
  extractFormsAppSubmissionId,
  parseFormsAppPayload,
} from './formsAppParser';
import { getFormConnection } from './store';

export interface NormalizedFormFields {
  clientName?: string;
  childName?: string;
  clientPhone?: string;
  clientEmail?: string;
  activityDate?: string;
  activityTime?: string;
  location?: string;
  participantsCount?: string;
  packageName?: string;
  notes?: string;
}

interface AppEvent {
  id: string;
  businessId: string;
  userId: string;
  title: string;
  eventDate: string;
  location: string;
  notes: string;
  clientEmail?: string;
  clientPhone?: string;
  source?: string;
  externalFormConnectionId?: string;
  externalSubmissionId?: string;
  externalFormProvider?: string;
}

interface AppLead {
  id: string;
  businessId: string;
  userId: string;
  name: string;
  phone?: string;
  email?: string;
  source: string;
  notes: string;
  status: string;
  createdAt: string;
  externalProvider?: string;
  externalFormId?: string;
  externalFormName?: string;
}

interface AppCategory {
  id: string;
  name: string;
  isActive?: boolean;
  valueType?: string;
  metricRole?: string;
}

interface AppEventValue {
  id: string;
  eventId: string;
  categoryId: string;
  businessId: string;
  userId: string;
  metricRole: string;
  valueText?: string;
  valueDate?: string;
  valueNumber?: number;
  revenueValue?: number;
  expenseValue?: number;
}

interface AppSnapshot {
  business?: { id: string } | null;
  categories?: AppCategory[];
  events?: AppEvent[];
  eventValues?: AppEventValue[];
  leads?: AppLead[];
  externalFormConnections?: Array<{ id: string; formName?: string }>;
  formNotifications?: Array<{
    id: string;
    message: string;
    connectionId: string;
    activityId?: string;
    createdAt: string;
    read: boolean;
  }>;
}

const CLIENT_CATEGORY_NAMES = ['שם לקוח', 'לקוח', 'שם מטופל', 'שם תלמיד', 'שם מתאמן'];

async function getSupabaseAdmin(): Promise<SupabaseClient> {
  const url = process.env.SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) throw new Error('Supabase not configured on server');
  const { createClient } = await import('@supabase/supabase-js');
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function parseEventDate(raw?: string): string {
  if (!raw?.trim()) return new Date().toISOString().slice(0, 10);
  const d = new Date(raw.trim());
  if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  const iso = raw.trim().slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(iso) ? iso : new Date().toISOString().slice(0, 10);
}

function labelIncludes(label: string, terms: string[]): boolean {
  const lower = label.toLowerCase();
  return terms.some((t) => lower.includes(t.toLowerCase()));
}

export function fuzzyMapFormFields(parsed: Record<string, string>): NormalizedFormFields {
  const fields: NormalizedFormFields = {};

  for (const [label, value] of Object.entries(parsed)) {
    const v = value.trim();
    if (!v) continue;

    if (
      labelIncludes(label, ['birthday person', 'שם ילד', 'child name', 'ילד/ה', 'birthday child'])
    ) {
      fields.childName = v;
      continue;
    }
    if (labelIncludes(label, ['phone', 'טלפון', 'mobile', 'נייד'])) {
      fields.clientPhone = v;
      continue;
    }
    if (labelIncludes(label, ['email', 'אימייל', 'e-mail'])) {
      fields.clientEmail = v;
      continue;
    }
    if (labelIncludes(label, ['event date', 'תאריך', 'date'])) {
      fields.activityDate = v;
      continue;
    }
    if (labelIncludes(label, ['event time', 'שעת', 'time', 'hour'])) {
      fields.activityTime = v;
      continue;
    }
    if (labelIncludes(label, ['children', 'participants', 'משתתפ', 'guests', 'מספר'])) {
      fields.participantsCount = v;
      continue;
    }
    if (labelIncludes(label, ['package', 'חביל'])) {
      fields.packageName = v;
      continue;
    }
    if (
      labelIncludes(label, ['where', 'address', 'place', 'location', 'מיקום', 'כתובת', 'מקום'])
    ) {
      fields.location = v;
      continue;
    }
    if (labelIncludes(label, ['theme', 'requests', 'notes', 'הערות', 'בקשות', 'נושא'])) {
      fields.notes = fields.notes ? `${fields.notes}\n${v}` : v;
      continue;
    }
    if (labelIncludes(label, ['parent', 'guardian', 'הורה', 'אפוטרופוס'])) {
      if (!fields.clientName) fields.clientName = v;
      continue;
    }
    if (labelIncludes(label, ['name', 'שם']) && !labelIncludes(label, ['birthday', 'ילד'])) {
      if (!fields.clientName) fields.clientName = v;
    }
  }

  if (!fields.clientName && fields.childName) {
    fields.clientName = fields.childName;
  }

  return fields;
}

function buildActivityTitle(fields: NormalizedFormFields): string {
  const child = fields.childName?.trim();
  const client = fields.clientName?.trim();
  const pkg = fields.packageName?.trim();
  const name = child || client || 'לקוח';
  if (pkg) return `${pkg} - ${name}`;
  return `אירוע יום הולדת - ${name}`;
}

function buildActivityNotes(fields: NormalizedFormFields): string {
  const lines: string[] = [];
  if (fields.childName?.trim()) lines.push(`ילד/ה: ${fields.childName.trim()}`);
  if (fields.participantsCount?.trim()) lines.push(`משתתפים: ${fields.participantsCount.trim()}`);
  if (fields.packageName?.trim()) lines.push(`חבילה: ${fields.packageName.trim()}`);
  if (fields.activityTime?.trim()) lines.push(`שעה: ${fields.activityTime.trim()}`);
  if (fields.notes?.trim()) lines.push(fields.notes.trim());
  lines.push('מקור: Forms.app');
  return lines.join('\n');
}

function findExistingLead(
  leads: AppLead[],
  name: string,
  phone?: string,
  email?: string,
): AppLead | undefined {
  const normPhone = phone?.replace(/\D/g, '');
  const normEmail = email?.trim().toLowerCase();
  if (normPhone) {
    const byPhone = leads.find((l) => l.phone?.replace(/\D/g, '') === normPhone);
    if (byPhone) return byPhone;
  }
  if (normEmail) {
    const byEmail = leads.find((l) => l.email?.trim().toLowerCase() === normEmail);
    if (byEmail) return byEmail;
  }
  return leads.find((l) => l.name.trim() === name.trim());
}

function buildEventValues(
  event: AppEvent,
  categories: AppCategory[],
  clientName: string,
): AppEventValue[] {
  return categories
    .filter((c) => c.isActive !== false)
    .map((category) => {
      const base: AppEventValue = {
        id: crypto.randomUUID(),
        eventId: event.id,
        categoryId: category.id,
        businessId: event.businessId,
        userId: event.userId,
        metricRole: category.metricRole ?? 'neutral',
      };
      if (CLIENT_CATEGORY_NAMES.some((n) => category.name.includes(n))) {
        return { ...base, valueText: clientName };
      }
      return base;
    });
}

export async function directCreateFromFormsWebhook(params: {
  connectionId: string;
  secret?: string;
  rawPayload: unknown;
}): Promise<{ status: number; body: Record<string, unknown> }> {
  const conn = await getFormConnection(params.connectionId);
  if (!conn) {
    return { status: 200, body: { ok: false, error: 'Connection not found' } };
  }
  if (!conn.isActive) {
    return { status: 200, body: { ok: false, error: 'Connection inactive' } };
  }
  if (conn.secretKey && params.secret !== conn.secretKey) {
    return { status: 200, body: { ok: false, error: 'Invalid secret key' } };
  }

  let parsedFields: Record<string, string> = {};
  let normalized: NormalizedFormFields = {};

  try {
    parsedFields = parseFormsAppPayload(params.rawPayload);
    normalized = fuzzyMapFormFields(parsedFields);
    console.log('[FORMS_PAYLOAD_PARSED]', {
      connectionId: params.connectionId,
      labels: Object.keys(parsedFields),
      normalized,
    });
  } catch (e) {
    console.error('[FORMS_PARSE_ERROR]', e);
    return {
      status: 200,
      body: {
        ok: false,
        error: e instanceof Error ? e.message : 'Payload parse failed',
      },
    };
  }

  const clientName = normalized.clientName?.trim() || normalized.childName?.trim();
  if (!clientName) {
    return {
      status: 200,
      body: { ok: false, error: 'Missing client name in submission', parsedFields },
    };
  }

  const externalSubmissionId = extractFormsAppSubmissionId(params.rawPayload);
  const sb = await getSupabaseAdmin();

  const { data: row, error: loadError } = await sb
    .from('app_snapshots')
    .select('snapshot, display_name')
    .eq('user_id', conn.ownerId)
    .maybeSingle();

  if (loadError) {
    console.error('[FORMS_PARSE_ERROR]', loadError);
    return { status: 200, body: { ok: false, error: loadError.message } };
  }

  const snapshot = (row?.snapshot ?? {
    business: { id: conn.businessId },
    categories: [],
    events: [],
    eventValues: [],
    leads: [],
    formNotifications: [],
  }) as AppSnapshot;
  const events = snapshot.events ?? [];
  const leads = snapshot.leads ?? [];
  const categories = snapshot.categories ?? [];

  if (
    externalSubmissionId &&
    events.some((e) => e.externalSubmissionId === externalSubmissionId)
  ) {
    const existing = events.find((e) => e.externalSubmissionId === externalSubmissionId)!;
    return {
      status: 200,
      body: {
        ok: true,
        duplicate: true,
        clientId: findExistingLead(leads, clientName, normalized.clientPhone, normalized.clientEmail)?.id ?? null,
        activityId: existing.id,
      },
    };
  }

  const activityId = crypto.randomUUID();
  const now = new Date().toISOString();
  const event: AppEvent = {
    id: activityId,
    businessId: conn.businessId,
    userId: conn.ownerId,
    title: buildActivityTitle(normalized),
    eventDate: parseEventDate(normalized.activityDate),
    location: normalized.location?.trim() ?? '',
    notes: buildActivityNotes(normalized),
    ...(normalized.clientEmail?.trim() ? { clientEmail: normalized.clientEmail.trim() } : {}),
    ...(normalized.clientPhone?.trim() ? { clientPhone: normalized.clientPhone.trim() } : {}),
    source: 'external_form',
    externalFormConnectionId: conn.id,
    externalSubmissionId,
    externalFormProvider: conn.provider,
  };

  const eventValues = buildEventValues(event, categories, clientName);

  let clientId: string;
  const existingLead = findExistingLead(
    leads,
    clientName,
    normalized.clientPhone,
    normalized.clientEmail,
  );

  if (existingLead) {
    clientId = existingLead.id;
    if (normalized.clientPhone?.trim() && !existingLead.phone) {
      existingLead.phone = normalized.clientPhone.trim();
    }
    if (normalized.clientEmail?.trim() && !existingLead.email) {
      existingLead.email = normalized.clientEmail.trim();
    }
  } else {
    clientId = crypto.randomUUID();
    leads.unshift({
      id: clientId,
      businessId: conn.businessId,
      userId: conn.ownerId,
      name: clientName,
      phone: normalized.clientPhone?.trim(),
      email: normalized.clientEmail?.trim(),
      source: 'website',
      notes: `נוצר מטופס: ${conn.formName}`,
      status: 'new',
      createdAt: now,
      externalProvider: 'website',
      externalFormId: conn.id,
      externalFormName: conn.formName,
    });
  }

  events.unshift(event);
  const notifications = snapshot.formNotifications ?? [];
  notifications.unshift({
    id: crypto.randomUUID(),
    message: `פעילות חדשה מטופס: ${event.title}`,
    connectionId: conn.id,
    activityId,
    createdAt: now,
    read: false,
  });

  const updatedSnapshot: AppSnapshot = {
    ...snapshot,
    events,
    eventValues: [...(snapshot.eventValues ?? []), ...eventValues],
    leads,
    formNotifications: notifications.slice(0, 50),
  };

  const { error: saveError } = await sb.from('app_snapshots').upsert({
    user_id: conn.ownerId,
    display_name: row?.display_name ?? '',
    snapshot: updatedSnapshot,
    updated_at: now,
  });

  if (saveError) {
    console.error('[FORMS_PARSE_ERROR]', saveError);
    return { status: 200, body: { ok: false, error: saveError.message } };
  }

  console.log('[FORMS_SUBMISSION_STORED]', {
    connectionId: conn.id,
    activityId,
    clientId,
    externalSubmissionId: externalSubmissionId ?? null,
  });

  return {
    status: 200,
    body: {
      ok: true,
      clientId,
      activityId,
      title: event.title,
      normalized,
      parsedFields,
    },
  };
}
