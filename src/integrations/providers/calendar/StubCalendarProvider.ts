import { createId } from '../../../lib/ids';
import type {
  IntegrationConnection,
  ProviderHealthResult,
  ProviderId,
  SyncResult,
} from '../../../types/integrations';
import type { CalendarEventPayload, CalendarProvider, ConnectParams } from '../../core/IntegrationProvider';

export class StubCalendarProvider implements CalendarProvider {
  readonly category = 'calendar' as const;

  constructor(
    readonly providerId: ProviderId,
    readonly providerName: string,
  ) {}

  async connect(params: ConnectParams): Promise<IntegrationConnection> {
    const now = new Date().toISOString();
    return {
      id: createId(),
      businessId: params.businessId,
      ownerId: params.ownerId,
      providerId: this.providerId,
      providerName: this.providerName,
      category: this.category,
      status: 'connected',
      mode: params.mode ?? 'sandbox',
      authMethod: 'oauth',
      syncStatus: 'idle',
      createdAt: now,
      updatedAt: now,
      connectedAt: now,
      accountLabel: params.credentials?.accountLabel,
    };
  }

  async disconnect(_connectionId: string): Promise<void> {}

  async testConnection(): Promise<ProviderHealthResult> {
    return { ok: true, message: `${this.providerName} — חיבור נשמר, OAuth יושק בגרסה הבאה`, latencyMs: 8 };
  }

  async sync(): Promise<SyncResult> {
    return { ok: true, syncedAt: new Date().toISOString(), message: 'בקרוב' };
  }

  getConnectionStatus() {
    return 'disconnected' as const;
  }

  async pushEvent(_connectionId: string, _event: CalendarEventPayload) {
    return { externalId: `cal_${createId().slice(0, 8)}` };
  }
}
