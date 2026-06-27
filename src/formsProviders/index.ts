import type { ExternalFormProviderId } from '../types/externalForms';
import { customWebhookProvider } from './customWebhookProvider';
import { formsAppProvider } from './formsAppProvider';
import type { ExternalFormProvider } from './formsProvider';
import {
  googleFormsProvider,
  jotformProvider,
  tallyProvider,
  typeformProvider,
} from './customWebhookProvider';

const providers: Record<ExternalFormProviderId, ExternalFormProvider> = {
  forms_app: formsAppProvider,
  google_forms: googleFormsProvider,
  typeform: typeformProvider,
  jotform: jotformProvider,
  tally: tallyProvider,
  custom: customWebhookProvider,
};

export function getExternalFormProvider(id: ExternalFormProviderId): ExternalFormProvider {
  return providers[id] ?? customWebhookProvider;
}

export { formsAppProvider, customWebhookProvider };
