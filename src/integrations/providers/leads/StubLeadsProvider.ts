import { createId } from '../../../lib/ids';
import type { IntegrationConnection, ProviderId } from '../../../types/integrations';
import type { ConnectParams, LeadsProvider } from '../../core/IntegrationProvider';

export class StubLeadsProvider implements LeadsProvider {
  readonly category = 'leads' as const;

  constructor(readonly providerId: ProviderId, readonly providerName: string) {}

  async connect(params: ConnectParams): Promise<IntegrationConnection> {
    const now = new Date().toISOString();
    return {
      id: createId(),
      businessId: params.businessId,
      ownerId: params.ownerId,
      providerId: this.providerId,
      providerName: this.providerName,
      category: 'leads',
      status: 'connected',
      mode: params.mode ?? 'sandbox',
      authMethod: 'oauth',
      syncStatus: 'idle',
      createdAt: now,
      updatedAt: now,
      connectedAt: now,
    };
  }

  async disconnect(_connectionId: string): Promise<void> {}

  async testConnection() {
    return { ok: false, message: `${this.providerName} — בקרוב` };
  }

  async sync() {
    return { ok: true, syncedAt: new Date().toISOString(), message: 'בקרוב' };
  }

  getConnectionStatus() {
    return 'disconnected' as const;
  }

  async importLeads() {
    return { count: 0 };
  }
}
