import type { Event } from '../../types/models';
import { EXTERNAL_FORM_PROVIDER_LABELS } from '../../types/externalForms';

export function isExternalFormEvent(event: Event): boolean {
  return event.source === 'external_form';
}

export function externalFormEventBadge(event: Event): string | null {
  if (!isExternalFormEvent(event)) return null;
  if (event.externalFormProvider && event.externalFormProvider in EXTERNAL_FORM_PROVIDER_LABELS) {
    return EXTERNAL_FORM_PROVIDER_LABELS[
      event.externalFormProvider as keyof typeof EXTERNAL_FORM_PROVIDER_LABELS
    ];
  }
  return 'נוצר מטופס';
}
