import type {
  ExternalFormConnection,
  FormActivityNotification,
  NormalizedFormPayload,
} from '../../types/externalForms';
import { EXTERNAL_FORM_PROVIDER_LABELS } from '../../types/externalForms';
import type { Event } from '../../types/models';

const GENERIC_CLIENT_NAMES = new Set(['לקוח', 'לקוח חדש', 'client', '—', '-', '']);

export function detectMissingInboundFields(fields: {
  clientName?: string;
  clientPhone?: string;
  location?: string;
}): string[] {
  const missing: string[] = [];
  const name = fields.clientName?.trim() ?? '';
  if (!name || GENERIC_CLIENT_NAMES.has(name)) missing.push('שם לקוח');
  if (!fields.clientPhone?.trim()) missing.push('טלפון');
  if (!fields.location?.trim()) missing.push('מיקום');
  return missing;
}

export function buildFormActivityNotification(params: {
  id: string;
  connection: Pick<ExternalFormConnection, 'id' | 'formName' | 'provider'>;
  activityId: string;
  normalized: NormalizedFormPayload;
  createdAt: string;
}): FormActivityNotification {
  const clientName =
    params.normalized.fields.clientName?.trim() ||
    params.normalized.fields.childName?.trim() ||
    '';
  const clientPhone = params.normalized.fields.clientPhone?.trim();
  const location = params.normalized.fields.location?.trim();
  const missingFields = detectMissingInboundFields({ clientName, clientPhone, location });
  const displayName = clientName || 'לקוח חדש';
  const sourceLabel = EXTERNAL_FORM_PROVIDER_LABELS[params.connection.provider];

  const message =
    missingFields.length > 0
      ? `אירוע חדש מ«${params.connection.formName}»: ${displayName} — חסר: ${missingFields.join(', ')}`
      : `אירוע חדש מ«${params.connection.formName}»: ${displayName}`;

  return {
    id: params.id,
    message,
    connectionId: params.connection.id,
    activityId: params.activityId,
    createdAt: params.createdAt,
    read: false,
    handled: false,
    sourceLabel,
    formName: params.connection.formName,
    clientName: displayName,
    clientPhone: clientPhone || undefined,
    missingFields,
  };
}

/** Fallback when an event arrives from cloud sync without a notification row. */
export function buildFormActivityNotificationFromEvent(params: {
  id: string;
  connectionId: string;
  formName: string;
  sourceLabel: string;
  activityId: string;
  clientName: string;
  clientPhone?: string;
  location?: string;
  createdAt: string;
}): FormActivityNotification {
  const missingFields = detectMissingInboundFields({
    clientName: params.clientName,
    clientPhone: params.clientPhone,
    location: params.location,
  });
  const displayName = params.clientName.trim() || 'לקוח חדש';
  const message =
    missingFields.length > 0
      ? `אירוע חדש מ«${params.formName}»: ${displayName} — חסר: ${missingFields.join(', ')}`
      : `אירוע חדש מ«${params.formName}»: ${displayName}`;

  return {
    id: params.id,
    message,
    connectionId: params.connectionId,
    activityId: params.activityId,
    createdAt: params.createdAt,
    read: false,
    handled: false,
    sourceLabel: params.sourceLabel,
    formName: params.formName,
    clientName: displayName,
    clientPhone: params.clientPhone,
    missingFields,
  };
}

export function getUnreadAutoActivityIds(
  notifications: FormActivityNotification[],
): Set<string> {
  const ids = new Set<string>();
  for (const n of notifications) {
    if (!n.read && !n.handled && n.activityId) ids.add(n.activityId);
  }
  return ids;
}

export function phoneTelUri(phone?: string): string | null {
  const digits = phone?.replace(/\D/g, '') ?? '';
  if (digits.length < 9) return null;
  return `tel:${digits.startsWith('0') ? `+972${digits.slice(1)}` : `+${digits}`}`;
}

export function normalizeLegacyNotification(
  notification: FormActivityNotification,
  event?: Event,
): FormActivityNotification {
  if (notification.missingFields !== undefined) return notification;

  const clientName = notification.clientName ?? event?.title ?? 'לקוח';
  const missingFields = detectMissingInboundFields({
    clientName,
    clientPhone: notification.clientPhone ?? event?.clientPhone,
    location: event?.location,
  });

  return {
    ...notification,
    clientName,
    clientPhone: notification.clientPhone ?? event?.clientPhone,
    missingFields,
    handled: notification.handled ?? false,
  };
}
