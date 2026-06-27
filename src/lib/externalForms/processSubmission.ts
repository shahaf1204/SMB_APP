import { buildEventValuesFromInputs } from '../eventForm';
import { customerKey } from '../customers';
import type {
  ExternalFormConnection,
  ExternalFormSubmission,
  NormalizedFormPayload,
} from '../../types/externalForms';
import { EXTERNAL_FORM_PROVIDER_LABELS } from '../../types/externalForms';
import type { Category, Event, Lead } from '../../types/models';

export interface ProcessSubmissionInput {
  connection: ExternalFormConnection;
  submission: Pick<
    ExternalFormSubmission,
    'id' | 'rawPayload' | 'normalizedPayload' | 'externalSubmissionId'
  >;
  categories: Category[];
  events: Event[];
  leads: Lead[];
  businessId: string;
  userId: string;
}

export interface ProcessSubmissionResult {
  eventId: string;
  clientKey?: string;
  error?: string;
}

const CLIENT_CATEGORY_NAMES = ['שם לקוח', 'לקוח', 'שם מטופל', 'שם תלמיד'];

function parseDate(raw?: string): string {
  if (!raw?.trim()) return new Date().toISOString().slice(0, 10);
  const d = new Date(raw.trim());
  if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  const iso = raw.trim().slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(iso) ? iso : new Date().toISOString().slice(0, 10);
}

function buildNotes(normalized: NormalizedFormPayload, connection: ExternalFormConnection): string {
  const f = normalized.fields;
  const lines: string[] = [];

  if (f.notes?.trim()) lines.push(f.notes.trim());
  if (f.childName) lines.push(`ילד/ה: ${f.childName}`);
  if (f.childAge) lines.push(`גיל: ${f.childAge}`);
  if (f.participantsCount) lines.push(`משתתפים: ${f.participantsCount}`);
  if (f.packageName) lines.push(`חבילה: ${f.packageName}`);
  if (f.activityTime) lines.push(`שעה: ${f.activityTime}`);

  for (const [key, val] of Object.entries(normalized.unmapped)) {
    lines.push(`${key}: ${val}`);
  }

  lines.push(
    `נוצר אוטומטית מטופס: ${connection.formName} (${EXTERNAL_FORM_PROVIDER_LABELS[connection.provider]})`,
  );
  return lines.filter(Boolean).join('\n');
}

export function findExistingClientKey(
  events: Event[],
  leads: Lead[],
  phone?: string,
  email?: string,
  name?: string,
): string | undefined {
  const normPhone = phone?.replace(/\D/g, '');
  const normEmail = email?.trim().toLowerCase();

  if (normPhone) {
    const lead = leads.find((l) => l.phone?.replace(/\D/g, '') === normPhone);
    if (lead) return customerKey(lead.name);
    const ev = events.find((e) => e.clientPhone?.replace(/\D/g, '') === normPhone);
    if (ev && name?.trim()) return customerKey(name.trim());
  }

  if (normEmail) {
    const lead = leads.find((l) => l.email?.trim().toLowerCase() === normEmail);
    if (lead) return customerKey(lead.name);
  }

  if (name?.trim()) return customerKey(name.trim());
  return undefined;
}

export function buildEventFromSubmission(input: ProcessSubmissionInput): {
  event: Omit<Event, 'id'>;
  categoryInputs: Record<string, string>;
  clientKey?: string;
} {
  const { connection, submission, categories } = input;
  const f = submission.normalizedPayload.fields;

  if (!f.clientName?.trim() && !f.activityTitle?.trim()) {
    throw new Error('חסר שם לקוח או שם פעילות — עדכנו את מיפוי השדות');
  }

  const clientName = f.clientName?.trim() ?? 'לקוח חדש';
  const title = f.activityTitle?.trim() || connection.formName || 'פעילות חדשה';
  const eventDate = parseDate(f.activityDate);
  const location = f.location?.trim() ?? '';
  const notes = buildNotes(submission.normalizedPayload, connection);

  const clientKey = findExistingClientKey(
    input.events,
    input.leads,
    f.clientPhone,
    f.clientEmail,
    clientName,
  );

  const categoryInputs: Record<string, string> = {};
  for (const cat of categories.filter((c) => c.isActive)) {
    if (CLIENT_CATEGORY_NAMES.some((n) => cat.name.includes(n))) {
      categoryInputs[cat.id] = clientName;
    }
    if (f.amount && cat.metricRole === 'revenue' && cat.valueType === 'number') {
      categoryInputs[cat.id] = f.amount.replace(/[^\d.]/g, '');
    }
  }

  const event: Omit<Event, 'id'> = {
    businessId: input.businessId,
    userId: input.userId,
    title,
    eventDate,
    location,
    notes,
    ...(f.clientEmail?.trim() ? { clientEmail: f.clientEmail.trim() } : {}),
    ...(f.clientPhone?.trim() ? { clientPhone: f.clientPhone.trim() } : {}),
    source: 'external_form',
    externalFormConnectionId: connection.id,
    externalSubmissionId:
      submission.externalSubmissionId ?? submission.normalizedPayload.externalSubmissionId,
    externalFormProvider: connection.provider,
  };

  return { event, categoryInputs, clientKey };
}

export function previewActivityFromSubmission(
  connection: ExternalFormConnection,
  normalized: NormalizedFormPayload,
): { title: string; clientName: string; date: string; location: string; notes: string } {
  const f = normalized.fields;
  return {
    title: f.activityTitle?.trim() || connection.formName,
    clientName: f.clientName?.trim() || '—',
    date: parseDate(f.activityDate),
    location: f.location?.trim() || '—',
    notes: buildNotes(normalized, connection).slice(0, 200),
  };
}

export function buildEventValuesForSubmission(
  eventId: string,
  businessId: string,
  userId: string,
  categories: Category[],
  categoryInputs: Record<string, string>,
) {
  return buildEventValuesFromInputs(eventId, businessId, userId, categories, categoryInputs, []);
}
