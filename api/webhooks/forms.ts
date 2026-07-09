import type { VercelRequest, VercelResponse } from '@vercel/node';

/** Self-contained Forms.app webhook — no local imports (Vercel-safe). POST always returns 200. */
export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method === 'GET') {
    res.status(200).json({ ok: true, route: 'forms-webhook' });
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'Method not allowed' });
    return;
  }

  try {
    const body = await processWebhook(req);
    res.status(200).json(body);
  } catch (e) {
    console.error('[FORMS_WEBHOOK_FATAL]', e);
    res.status(200).json({
      ok: false,
      error: e instanceof Error ? e.message : 'Webhook handler failed',
    });
  }
}

function queryParam(
  query: Record<string, string | string[] | undefined>,
  key: string,
): string | undefined {
  const q = query[key];
  if (typeof q === 'string') return q;
  if (Array.isArray(q)) return q[0];
  return undefined;
}

async function processWebhook(req: VercelRequest): Promise<Record<string, unknown>> {
  if (req.body == null || typeof req.body !== 'object' || Array.isArray(req.body)) {
    return { ok: false, error: 'Invalid payload — expected JSON object' };
  }

  const connectionId = queryParam(
    req.query as Record<string, string | string[] | undefined>,
    'connectionId',
  )?.trim();
  const secret = queryParam(
    req.query as Record<string, string | string[] | undefined>,
    'secret',
  );

  if (!connectionId) {
    return { ok: false, error: 'Missing connectionId' };
  }

  const url = process.env.SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) {
    return { ok: false, error: 'Supabase not configured on server' };
  }

  const { createClient } = await import('@supabase/supabase-js');
  const sb = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: connRow, error: connError } = await sb
    .from('external_form_connections')
    .select('*')
    .eq('id', connectionId)
    .maybeSingle();

  if (connError) return { ok: false, error: connError.message };
  if (!connRow) return { ok: false, error: 'Connection not found' };
  if (!connRow.is_active) return { ok: false, error: 'Connection inactive' };
  if (connRow.secret_key && secret !== connRow.secret_key) {
    return { ok: false, error: 'Invalid secret key' };
  }

  const parsedFields = parseFormsAppPayload(req.body);
  const normalized = fuzzyMapFormFields(parsedFields);

  const clientName = normalized.clientName?.trim() || normalized.childName?.trim();
  if (!clientName) {
    return { ok: false, error: 'Missing client name in submission', parsedFields };
  }

  const ownerId = connRow.owner_id as string;
  const businessId = connRow.business_id as string;
  const formName = connRow.form_name as string;
  const externalSubmissionId = extractSubmissionId(req.body);

  const { data: row, error: loadError } = await sb
    .from('app_snapshots')
    .select('snapshot, display_name')
    .eq('user_id', ownerId)
    .maybeSingle();

  if (loadError) return { ok: false, error: loadError.message };

  type AppEvent = {
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
  };

  type AppLead = {
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
  };

  const snapshot = (row?.snapshot ?? {
    business: { id: businessId },
    categories: [],
    events: [],
    eventValues: [],
    leads: [],
    formNotifications: [],
  }) as {
    events?: AppEvent[];
    leads?: AppLead[];
    eventValues?: unknown[];
    formNotifications?: Array<{
      id: string;
      message: string;
      connectionId: string;
      activityId?: string;
      createdAt: string;
      read: boolean;
    }>;
    categories?: Array<{ id: string; name: string; isActive?: boolean; metricRole?: string }>;
  };

  const events = snapshot.events ?? [];
  const leads = snapshot.leads ?? [];

  if (
    externalSubmissionId &&
    events.some((e) => e.externalSubmissionId === externalSubmissionId)
  ) {
    const existing = events.find((e) => e.externalSubmissionId === externalSubmissionId)!;
    return { ok: true, duplicate: true, activityId: existing.id };
  }

  const now = new Date().toISOString();
  const activityId = crypto.randomUUID();
  const event: AppEvent = {
    id: activityId,
    businessId,
    userId: ownerId,
    title: buildActivityTitle(normalized),
    eventDate: parseEventDate(normalized.activityDate),
    location: normalized.location?.trim() ?? '',
    notes: buildActivityNotes(normalized),
    ...(normalized.clientEmail?.trim() ? { clientEmail: normalized.clientEmail.trim() } : {}),
    ...(normalized.clientPhone?.trim() ? { clientPhone: normalized.clientPhone.trim() } : {}),
    source: 'external_form',
    externalFormConnectionId: connectionId,
    externalSubmissionId,
    externalFormProvider: connRow.provider,
  };

  const existingLead = leads.find(
    (l) =>
      l.name.trim() === clientName.trim() ||
      (normalized.clientPhone &&
        l.phone?.replace(/\D/g, '') === normalized.clientPhone.replace(/\D/g, '')),
  );

  let clientId: string;
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
      businessId,
      userId: ownerId,
      name: clientName,
      phone: normalized.clientPhone?.trim(),
      email: normalized.clientEmail?.trim(),
      source: 'website',
      notes: `נוצר מטופס: ${formName}`,
      status: 'new',
      createdAt: now,
    });
  }

  events.unshift(event);
  const notifications = snapshot.formNotifications ?? [];
  notifications.unshift({
    id: crypto.randomUUID(),
    message: `פעילות חדשה מטופס: ${event.title}`,
    connectionId,
    activityId,
    createdAt: now,
    read: false,
  });

  const { error: saveError } = await sb.from('app_snapshots').upsert({
    user_id: ownerId,
    display_name: row?.display_name ?? '',
    snapshot: {
      ...snapshot,
      events,
      leads,
      formNotifications: notifications.slice(0, 50),
    },
    updated_at: now,
  });

  if (saveError) return { ok: false, error: saveError.message };

  return { ok: true, clientId, activityId, title: event.title, normalized, parsedFields };
}

interface NormalizedFormFields {
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

function fuzzyMapFormFields(parsed: Record<string, string>): NormalizedFormFields {
  const fields: NormalizedFormFields = {};
  for (const [label, value] of Object.entries(parsed)) {
    const v = value.trim();
    if (!v) continue;
    if (labelIncludes(label, ['birthday person', 'שם ילד', 'child name', 'ילד/ה'])) {
      fields.childName = v;
      continue;
    }
    if (labelIncludes(label, ['phone', 'טלפון', 'mobile', 'נייד'])) {
      fields.clientPhone = v;
      continue;
    }
    if (labelIncludes(label, ['email', 'אימייל'])) {
      fields.clientEmail = v;
      continue;
    }
    if (labelIncludes(label, ['event date', 'תאריך', 'date'])) {
      fields.activityDate = v;
      continue;
    }
    if (labelIncludes(label, ['event time', 'שעת', 'time'])) {
      fields.activityTime = v;
      continue;
    }
    if (labelIncludes(label, ['participants', 'משתתפ', 'guests', 'מספר'])) {
      fields.participantsCount = v;
      continue;
    }
    if (labelIncludes(label, ['package', 'חביל'])) {
      fields.packageName = v;
      continue;
    }
    if (labelIncludes(label, ['location', 'מיקום', 'כתובת', 'מקום', 'address'])) {
      fields.location = v;
      continue;
    }
    if (labelIncludes(label, ['notes', 'הערות', 'בקשות', 'theme'])) {
      fields.notes = fields.notes ? `${fields.notes}\n${v}` : v;
      continue;
    }
    if (labelIncludes(label, ['parent', 'guardian', 'הורה'])) {
      if (!fields.clientName) fields.clientName = v;
      continue;
    }
    if (labelIncludes(label, ['name', 'שם']) && !labelIncludes(label, ['ילד'])) {
      if (!fields.clientName) fields.clientName = v;
    }
  }
  if (!fields.clientName && fields.childName) fields.clientName = fields.childName;
  return fields;
}

function buildActivityTitle(fields: NormalizedFormFields): string {
  const name = fields.childName?.trim() || fields.clientName?.trim() || 'לקוח';
  const pkg = fields.packageName?.trim();
  return pkg ? `${pkg} - ${name}` : `אירוע יום הולדת - ${name}`;
}

function buildActivityNotes(fields: NormalizedFormFields): string {
  const lines: string[] = [];
  if (fields.childName?.trim()) lines.push(`ילד/ה: ${fields.childName.trim()}`);
  if (fields.participantsCount?.trim()) lines.push(`משתתפים: ${fields.participantsCount.trim()}`);
  if (fields.activityTime?.trim()) lines.push(`שעה: ${fields.activityTime.trim()}`);
  if (fields.notes?.trim()) lines.push(fields.notes.trim());
  lines.push('מקור: Forms.app');
  return lines.join('\n');
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function extractSubmissionId(payload: unknown): string | undefined {
  const root = asRecord(payload);
  if (!root) return undefined;
  const answer = asRecord(root.answer ?? root.Answer ?? root.submission);
  for (const c of [answer?._id, answer?.id, root._id, root.id, root.submission_id]) {
    if (typeof c === 'string' && c.trim()) return c.trim();
  }
  return undefined;
}

function parseFormsAppPayload(payload: unknown): Record<string, string> {
  const root = asRecord(payload);
  if (!root) return {};

  const form = asRecord(root.form ?? root.Form);
  const answerRoot = asRecord(root.answer ?? root.Answer ?? root.submission);
  const questionsRaw = form?.questions;
  const answersRaw = answerRoot?.answers;

  if (!Array.isArray(questionsRaw) || !Array.isArray(answersRaw)) {
    return flattenFields(payload);
  }

  const questionById = new Map<string, { question?: string; qt?: string; type?: string }>();
  for (const item of questionsRaw) {
    const q = item as { _id?: string; question?: string; qt?: string; type?: string };
    if (q._id?.trim()) questionById.set(q._id.trim(), q);
  }

  const fields: Record<string, string> = {};
  for (const item of answersRaw) {
    const answer = item as Record<string, unknown>;
    const questionId = typeof answer.q === 'string' ? answer.q.trim() : '';
    if (!questionId) continue;
    const question = questionById.get(questionId);
    const label = question?.question?.trim() || questionId;
    const value = extractAnswerValue(answer, question ?? {});
    if (value) fields[label] = value;
  }

  if (Object.keys(fields).length > 0) return fields;
  return flattenFields(payload);
}

function extractAnswerValue(
  answer: Record<string, unknown>,
  question: { qt?: string; type?: string },
): string {
  const qt = String(answer.qt ?? question.qt ?? question.type ?? '').toLowerCase();
  const fn = answer.fn as { f?: string; l?: string } | undefined;
  if ((qt === 'fullname' || qt === 'name') && fn) {
    return [fn.f, fn.l].filter(Boolean).join(' ').trim();
  }
  if (qt === 'date' && answer.d) return String(answer.d).trim();
  if (qt === 'phone' || qt === 'tel') {
    return String(answer.p ?? answer.t ?? '').trim();
  }
  if (qt === 'email') return String(answer.e ?? answer.t ?? '').trim();
  if (answer.t != null) return String(answer.t).trim();
  if (answer.n != null) return String(answer.n).trim();
  if (answer.p != null) return String(answer.p).trim();
  return '';
}

function flattenFields(payload: unknown, prefix = ''): Record<string, string> {
  const out: Record<string, string> = {};
  if (payload == null) return out;
  if (typeof payload === 'string' || typeof payload === 'number' || typeof payload === 'boolean') {
    if (prefix) out[prefix] = String(payload);
    return out;
  }
  if (Array.isArray(payload)) {
    payload.forEach((item, i) => {
      Object.assign(out, flattenFields(item, prefix ? `${prefix}[${i}]` : String(i)));
    });
    return out;
  }
  if (typeof payload === 'object') {
    for (const [key, value] of Object.entries(payload as Record<string, unknown>)) {
      Object.assign(out, flattenFields(value, prefix ? `${prefix}.${key}` : key));
    }
  }
  return out;
}
