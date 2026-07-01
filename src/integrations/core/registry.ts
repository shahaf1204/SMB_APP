import type { FinanceProviderId, ProviderId } from '../../types/integrations';
import type { FinanceProvider, IntegrationProvider } from './IntegrationProvider';
import { cardcomProvider } from '../providers/finance/cardcomProvider';
import { growProvider } from '../providers/finance/growProvider';
import { icountProvider } from '../providers/finance/icountProvider';
import { mockFinanceProvider } from '../providers/finance/mockFinanceProvider';
import { morningProvider } from '../providers/finance/morningProvider';
import { StubCalendarProvider } from '../providers/calendar/StubCalendarProvider';
import { StubCommunicationProvider } from '../providers/communication/StubCommunicationProvider';
import { StubLeadsProvider } from '../providers/leads/StubLeadsProvider';

const CALENDAR_NAMES: Record<string, string> = {
  google_calendar: 'Google Calendar',
  outlook_calendar: 'Outlook Calendar',
  apple_calendar: 'Apple Calendar',
};

const calendarProviders = {
  google_calendar: new StubCalendarProvider('google_calendar', CALENDAR_NAMES.google_calendar),
  outlook_calendar: new StubCalendarProvider('outlook_calendar', CALENDAR_NAMES.outlook_calendar),
  apple_calendar: new StubCalendarProvider('apple_calendar', CALENDAR_NAMES.apple_calendar),
};

const financeProviders: Record<FinanceProviderId, FinanceProvider> = {
  mock_finance: mockFinanceProvider,
  mock: mockFinanceProvider,
  morning: morningProvider,
  icount: icountProvider,
  grow: growProvider,
  cardcom: cardcomProvider,
  meshulam: morningProvider,
  tranzila: morningProvider,
  pelecard: morningProvider,
};

const leadsProviders = {
  meta_leads: new StubLeadsProvider('meta_leads', 'Meta Leads'),
};

const communicationProviders = {
  whatsapp_business: new StubCommunicationProvider('whatsapp_business'),
  gmail: new StubCommunicationProvider('gmail'),
  outlook_mail: new StubCommunicationProvider('outlook_mail'),
};

export function getFinanceProvider(id: FinanceProviderId | 'mock'): FinanceProvider {
  const key = id === 'mock' ? 'mock_finance' : id;
  const p = financeProviders[key as FinanceProviderId];
  if (!p) throw new Error(`Unknown finance provider: ${id}`);
  return p;
}

export function getIntegrationProvider(id: ProviderId): IntegrationProvider {
  if (id in financeProviders) return financeProviders[id as FinanceProviderId];
  if (id in calendarProviders) return calendarProviders[id as keyof typeof calendarProviders];
  if (id in leadsProviders) return leadsProviders[id as keyof typeof leadsProviders];
  if (id in communicationProviders) return communicationProviders[id as keyof typeof communicationProviders];
  throw new Error(`Unknown provider: ${id}`);
}

export function isFinanceProviderId(id: ProviderId): id is FinanceProviderId {
  return id in financeProviders;
}

export function listFinanceProviders(): FinanceProvider[] {
  return [mockFinanceProvider, morningProvider, icountProvider, growProvider, cardcomProvider];
}
