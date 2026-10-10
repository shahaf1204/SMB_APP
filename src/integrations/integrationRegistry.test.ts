import { describe, expect, it, vi } from 'vitest';
import {
  canInitiateHubApiConnect,
  getRegistryEntry,
  hubEntriesByCategory,
  isInvoicingProviderId,
  listHubIntegrations,
} from './integrationRegistry';
import { assertCanConnectProvider } from '../lib/integrations/connectPolicy';
import { connectProvider } from '../lib/integrations/client';

describe('integrationRegistry lifecycle', () => {
  it('morning is live invoicing', () => {
    const m = getRegistryEntry('morning')!;
    expect(m.lifecycleStatus).toBe('live');
    expect(m.subCategory).toBe('finance_invoicing');
    expect(canInitiateHubApiConnect(m)).toBe(true);
  });

  it('google_forms is coming_soon and not API connectable', () => {
    const g = getRegistryEntry('google_forms')!;
    expect(g.lifecycleStatus).toBe('coming_soon');
    expect(canInitiateHubApiConnect(g)).toBe(false);
  });

  it('meta_leads uses route mode to sources', () => {
    const meta = getRegistryEntry('meta_leads')!;
    expect(meta.hubConnectMode).toBe('route');
    expect(meta.managementRoute).toBe('/sources/leads');
  });

  it('forms_app routes to wizard', () => {
    const f = getRegistryEntry('forms_app')!;
    expect(f.managementRoute).toBe('/sources/forms/new');
    expect(f.hubConnectMode).toBe('route');
  });

  it('whatsapp is coming_soon', () => {
    expect(getRegistryEntry('whatsapp_business')!.lifecycleStatus).toBe('coming_soon');
  });

  it('instagram is hidden from hub list', () => {
    const ids = listHubIntegrations().map((e) => e.id);
    expect(ids).not.toContain('instagram');
  });
});

describe('scope filtering', () => {
  it('invoicing scope excludes leads, calendar, communication, payments', () => {
    const entries = listHubIntegrations({ scope: 'invoicing', includeDevOnly: true });
    const ids = entries.map((e) => e.id);
    expect(ids).toContain('morning');
    expect(ids).not.toContain('meta_leads');
    expect(ids).not.toContain('forms_app');
    expect(ids).not.toContain('google_calendar');
    expect(ids).not.toContain('whatsapp_business');
    expect(ids).not.toContain('grow');
  });

  it('payments scope excludes invoicing morning', () => {
    const entries = listHubIntegrations({ scope: 'payments' });
    expect(entries.every((e) => e.subCategory === 'finance_payments')).toBe(true);
    expect(entries.map((e) => e.id)).not.toContain('morning');
  });

  it('hub categories for invoicing only show finance', () => {
    const map = hubEntriesByCategory('invoicing');
    expect([...map.keys()]).toEqual(['finance']);
  });
});

describe('isInvoicingProviderId', () => {
  it('counts morning not grow', () => {
    expect(isInvoicingProviderId('morning')).toBe(true);
    expect(isInvoicingProviderId('grow')).toBe(false);
    expect(isInvoicingProviderId('google_calendar')).toBe(false);
  });
});

describe('connectPolicy', () => {
  it('blocks google_forms connect', () => {
    expect(() => assertCanConnectProvider('google_forms')).toThrow(/בקרוב|לא ניתן/);
  });

  it('blocks whatsapp connect', () => {
    expect(() => assertCanConnectProvider('whatsapp_business')).toThrow();
  });

  it('blocks calendar placeholders', () => {
    expect(() => assertCanConnectProvider('google_calendar')).toThrow();
  });
});

describe('connectProvider — no fake local success', () => {
  it('does not create local connection when API fails for morning', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        text: async () => JSON.stringify({ error: 'server down' }),
      }),
    );
    await expect(
      connectProvider({
        businessId: 'b1',
        userId: 'u1',
        provider: 'morning',
        apiKey: 'id:secret',
      }),
    ).rejects.toThrow();
    vi.unstubAllGlobals();
  });

  it('rejects unsupported provider before fetch', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    await expect(
      connectProvider({
        businessId: 'b1',
        userId: 'u1',
        provider: 'google_forms',
      }),
    ).rejects.toThrow();
    expect(fetchMock).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });
});
