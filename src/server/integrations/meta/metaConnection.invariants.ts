/** Client-safe connection row shape for invariant checks. */
export interface MetaConnectionInvariantInput {
  connectionStatus: string;
  isActive: boolean;
  webhookSubscribedAt: string | null;
}

/**
 * connected ⇒ active + webhook subscription timestamp.
 * Failure states must not be active or subscribed.
 */
export function assertMetaConnectionInvariants(row: MetaConnectionInvariantInput): void {
  if (row.connectionStatus === 'connected') {
    if (!row.isActive) {
      throw new Error('Invariant: connected requires is_active=true');
    }
    if (!row.webhookSubscribedAt) {
      throw new Error('Invariant: connected requires webhook_subscribed_at');
    }
    return;
  }

  if (row.connectionStatus === 'error' || row.connectionStatus === 'reconnect_required') {
    if (row.isActive) {
      throw new Error('Invariant: error/reconnect_required requires is_active=false');
    }
  }

  if (row.connectionStatus === 'connecting' && row.isActive) {
    throw new Error('Invariant: connecting must not be active');
  }

  if (
    (row.connectionStatus === 'error' ||
      row.connectionStatus === 'connecting' ||
      row.connectionStatus === 'disconnected') &&
    row.webhookSubscribedAt
  ) {
    throw new Error('Invariant: webhook_subscribed_at only when connected');
  }
}
