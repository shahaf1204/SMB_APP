import { sortCategories } from '../../categories';
import type { Category, Event } from '../../../types/models';
import type { LeadConversionDraft, LeadConversionTargetModel } from './types';

const CLIENT_CATEGORY_NAMES = ['שם לקוח', 'לקוח', 'שם מטופל', 'שם תלמיד'];

export function buildEventFromConversionDraft(
  draft: LeadConversionDraft,
  businessId: string,
  userId: string,
  leadId: string,
  conversionTarget: LeadConversionTargetModel,
): Omit<Event, 'id'> {
  const notes = [draft.notes?.trim(), draft.activityTime ? `שעה: ${draft.activityTime}` : '']
    .filter(Boolean)
    .join('\n');

  return {
    businessId,
    userId,
    title: draft.title.trim(),
    eventDate: draft.activityDate?.trim() || new Date().toISOString().slice(0, 10),
    location: draft.location?.trim() ?? '',
    notes,
    ...(draft.clientEmail ? { clientEmail: draft.clientEmail.trim() } : {}),
    ...(draft.clientPhone ? { clientPhone: draft.clientPhone.trim() } : {}),
    source: 'manual',
    sourceLeadId: leadId,
    creationSource: 'lead_conversion',
    conversionTarget,
  };
}

export function buildCategoryInputsForConversion(
  categories: Category[],
  draft: LeadConversionDraft,
): Record<string, string> {
  const categoryInputs: Record<string, string> = {};
  const clientName = draft.clientName.trim();
  for (const cat of sortCategories(categories.filter((c) => c.isActive))) {
    if (CLIENT_CATEGORY_NAMES.some((n) => cat.name.includes(n))) {
      categoryInputs[cat.id] = clientName;
    }
  }
  return categoryInputs;
}
