import { createId } from '../../../lib/ids';
import type {
  IntegrationConnection,
  ProviderHealthResult,
  ProviderId,
  SyncResult,
} from '../../../types/integrations';
import type { BusinessProvider, ProviderCredentials } from '../../core/interfaces';

export class StubCalendarProvider implements BusinessProvider {
  readonly category: IntegrationConnection['category'];

  constructor(
    readonly id: ProviderId,
    category: IntegrationConnection['category'] = 'calendar',
  ) {
    this.category = category;
  }

  async connect(credentials: ProviderCredentials): Promise<IntegrationConnection> {
    const now = new Date().toISOString();
    return {
      id: createId(),
      businessId: '',
      userId: '',
      category: this.category,
      provider: this.id,
      connectionStatus: 'connected',
      authMethod: credentials.accessToken ? 'oauth' : 'api_key',
      syncStatus: 'idle',
      connectedAt: now,
      updatedAt: now,
      accountLabel: credentials.accountLabel,
    };
  }

  async disconnect() {}

  async sync(): Promise<SyncResult> {
    return { ok: true, syncedAt: new Date().toISOString(), message: 'סנכרון הושלם' };
  }

  async healthCheck(): Promise<ProviderHealthResult> {
    return { ok: true };
  }
}
