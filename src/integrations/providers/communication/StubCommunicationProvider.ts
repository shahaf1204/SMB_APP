import { createId } from '../../../lib/ids';
import type {
  IntegrationConnection,
  ProviderHealthResult,
  ProviderId,
  SyncResult,
} from '../../../types/integrations';
import type { CommunicationProvider, ConnectParams } from '../../core/IntegrationProvider';

const NAMES: Partial<Record<ProviderId, string>> = {
  whatsapp_business: 'WhatsApp Business',
  gmail: 'Gmail',
  outlook_mail: 'Outlook Mail',
};

export class StubCommunicationProvider implements CommunicationProvider {
  readonly category = 'communication' as const;

  constructor(
    readonly providerId: ProviderId,
    readonly providerName: string = NAMES[providerId as ProviderId] ?? providerId,
  ) {}

  async connect(params: ConnectParams): Promise<IntegrationConnection> {
    const now = new Date().toISOString();
    return {
      id: createId(),
      businessId: params.businessId,
      ownerId: params.ownerId,
      providerId: this.providerId,
      providerName: this.providerName,
      category: 'communication',
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

  async testConnection(): Promise<ProviderHealthResult> {
    return { ok: false, message: `${this.providerName} — בקרוב` };
  }

  async sync(): Promise<SyncResult> {
    return { ok: true, syncedAt: new Date().toISOString(), message: 'בקרוב' };
  }

  getConnectionStatus() {
    return 'disconnected' as const;
  }

  async sendMessage(_connectionId: string, _params: { to: string; body: string }) {
    return { messageId: `msg_${createId().slice(0, 8)}` };
  }
}
