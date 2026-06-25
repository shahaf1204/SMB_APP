import type { FinanceProviderId, ProviderId } from '../../types/integrations';
import type { BusinessProvider, FinanceProvider } from './interfaces';
import {
  CardcomFinanceProvider,
  GrowFinanceProvider,
  ICountFinanceProvider,
  MeshulamFinanceProvider,
  MockFinanceProvider,
  MorningFinanceProvider,
  PelecardFinanceProvider,
  TranzilaFinanceProvider,
} from '../providers/finance/FinanceProviders';
import { StubCalendarProvider } from '../providers/calendar/StubCalendarProvider';
import { StubMarketingProvider } from '../providers/marketing/StubMarketingProvider';
import { StubCommunicationProvider } from '../providers/communication/StubCommunicationProvider';

const financeProviders: Record<FinanceProviderId, FinanceProvider> = {
  mock: new MockFinanceProvider(),
  morning: new MorningFinanceProvider(),
  icount: new ICountFinanceProvider(),
  grow: new GrowFinanceProvider(),
  cardcom: new CardcomFinanceProvider(),
  meshulam: new MeshulamFinanceProvider(),
  tranzila: new TranzilaFinanceProvider(),
  pelecard: new PelecardFinanceProvider(),
};

const calendarProviders = {
  google_calendar: new StubCalendarProvider('google_calendar'),
  outlook_calendar: new StubCalendarProvider('outlook_calendar'),
  apple_calendar: new StubCalendarProvider('apple_calendar'),
};

const marketingProviders = {
  meta_leads: new StubMarketingProvider('meta_leads'),
  instagram: new StubMarketingProvider('instagram'),
  google_forms: new StubMarketingProvider('google_forms'),
  typeform: new StubMarketingProvider('typeform'),
};

const communicationProviders = {
  whatsapp_business: new StubCommunicationProvider('whatsapp_business'),
  gmail: new StubCommunicationProvider('gmail'),
  outlook_mail: new StubCommunicationProvider('outlook_mail'),
};

export function getFinanceProvider(id: FinanceProviderId): FinanceProvider {
  const p = financeProviders[id];
  if (!p) throw new Error(`Unknown finance provider: ${id}`);
  return p;
}

export function getBusinessProvider(id: ProviderId): BusinessProvider {
  if (id in financeProviders) return financeProviders[id as FinanceProviderId];
  if (id in calendarProviders) return calendarProviders[id as keyof typeof calendarProviders];
  if (id in marketingProviders) return marketingProviders[id as keyof typeof marketingProviders];
  if (id in communicationProviders) return communicationProviders[id as keyof typeof communicationProviders];
  throw new Error(`Unknown provider: ${id}`);
}

export function isFinanceProvider(id: ProviderId): id is FinanceProviderId {
  return id in financeProviders;
}
