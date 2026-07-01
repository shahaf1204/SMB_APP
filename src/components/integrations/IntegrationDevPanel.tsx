import { useState } from 'react';
import type { IntegrationConnection, IntegrationLog } from '../../types/integrations';
import {
  createProviderPaymentLink,
  fetchIntegrationLogs,
  pushInvoiceToProvider,
  simulateIntegrationWebhook,
  testConnectionProvider,
} from '../../lib/integrations/client';
import { buildIntegrationLog } from '../../lib/integrations/service';
import { useAppStore } from '../../store/useAppStore';

interface IntegrationDevPanelProps {
  businessId: string;
  financeConnection?: IntegrationConnection;
}

export function IntegrationDevPanel({ businessId, financeConnection }: IntegrationDevPanelProps) {
  if (!import.meta.env.DEV) return null;

  const invoices = useAppStore((s) => s.invoices);
  const addIntegrationLog = useAppStore((s) => s.addIntegrationLog);
  const applyIntegrationWebhook = useAppStore((s) => s.applyIntegrationWebhook);
  const updateInvoice = useAppStore((s) => s.updateInvoice);
  const upsertPaymentTransaction = useAppStore((s) => s.upsertPaymentTransaction);
  const integrationLogs = useAppStore((s) => s.integrationLogs);

  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [serverLogs, setServerLogs] = useState<IntegrationLog[]>([]);

  const draftInvoice = invoices.find(
    (i) => i.businessId === businessId && !i.externalInvoiceId && !i.providerDocumentId,
  );
  const syncedInvoice = invoices.find(
    (i) =>
      i.businessId === businessId &&
      (i.externalInvoiceId || i.providerDocumentId),
  );

  const log = (action: string, status: 'success' | 'failed', message: string, extra?: object) => {
    addIntegrationLog(
      buildIntegrationLog({
        businessId,
        connectionId: financeConnection?.id,
        providerId: financeConnection?.providerId ?? 'mock_finance',
        action,
        status,
        message,
        rawResponse: extra,
      }),
    );
  };

  const run = async (label: string, fn: () => Promise<void>) => {
    setBusy(true);
    setMsg(null);
    try {
      await fn();
      setMsg(label);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'שגיאה');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="card integration-dev-panel">
      <h2 className="section-title-sm">🔧 פאנל בדיקות (Dev)</h2>
      <p className="field-hint">זמין רק במצב פיתוח — לבדיקת אינטגרציות mock</p>

      <div className="integration-dev-actions">
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          disabled={busy || !financeConnection}
          onClick={() =>
            void run('בדיקת חיבור הצליחה', async () => {
              const r = await testConnectionProvider({
                connectionId: financeConnection!.id,
                businessId,
                provider: financeConnection!.providerId,
              });
              log('testConnection', r.ok ? 'success' : 'failed', r.message ?? '');
              if (!r.ok) throw new Error(r.message);
            })
          }
        >
          בדיקת חיבור
        </button>

        <button
          type="button"
          className="btn btn-ghost btn-sm"
          disabled={busy || !financeConnection || !draftInvoice}
          onClick={() =>
            void run('חשבונית בדיקה נוצרה', async () => {
              const inv = draftInvoice!;
              const doc = await pushInvoiceToProvider({
                businessId,
                connectionId: financeConnection!.id,
                provider: financeConnection!.providerId,
                invoice: {
                  clientName: inv.clientName,
                  clientEmail: inv.clientEmail,
                  amount: inv.amount,
                  dueDate: inv.dueDate,
                  notes: inv.notes,
                },
              });
              updateInvoice(inv.id, {
                externalProvider: financeConnection!.providerId,
                externalInvoiceId: doc.externalInvoiceId ?? doc.providerDocumentId,
                externalDocumentNumber: doc.externalDocumentNumber ?? doc.providerInvoiceNumber,
                externalPdfUrl: doc.externalPdfUrl ?? doc.officialPdfUrl,
                paymentLink: doc.paymentLink ?? doc.paymentUrl,
                syncStatus: 'synced',
                paymentStatus: 'pending',
                status: 'sent',
              });
              log('createInvoice', 'success', `חשבונית ${doc.externalDocumentNumber}`, doc);
            })
          }
        >
          יצירת חשבונית בדיקה
        </button>

        <button
          type="button"
          className="btn btn-ghost btn-sm"
          disabled={busy || !financeConnection || !syncedInvoice}
          onClick={() =>
            void run('קישור תשלום נוצר', async () => {
              const inv = syncedInvoice!;
              const extId = inv.externalInvoiceId ?? inv.providerDocumentId!;
              const link = await createProviderPaymentLink({
                connectionId: financeConnection!.id,
                provider: financeConnection!.providerId,
                providerDocumentId: extId,
                amount: inv.amount,
              });
              updateInvoice(inv.id, {
                paymentLink: link.paymentLink ?? link.paymentUrl,
                paymentTransactionId: link.externalTransactionId ?? link.providerTransactionId,
                paymentStatus: 'pending',
              });
              upsertPaymentTransaction({
                id: link.externalTransactionId ?? link.providerTransactionId ?? crypto.randomUUID(),
                businessId,
                invoiceId: inv.id,
                providerId: financeConnection!.providerId,
                externalTransactionId: link.externalTransactionId ?? link.providerTransactionId ?? '',
                amount: inv.amount,
                currency: 'ILS',
                status: 'pending',
                paymentLink: link.paymentLink ?? link.paymentUrl,
                createdAt: new Date().toISOString(),
              });
              log('createPaymentLink', 'success', 'קישור תשלום', link);
            })
          }
        >
          יצירת קישור תשלום
        </button>

        <button
          type="button"
          className="btn btn-ghost btn-sm"
          disabled={busy || !syncedInvoice}
          onClick={() =>
            void run('תשלום סומן כשולם', async () => {
              const inv = syncedInvoice!;
              const update = await simulateIntegrationWebhook({
                providerId: financeConnection?.providerId ?? 'mock_finance',
                invoiceId: inv.id,
                externalInvoiceId: inv.externalInvoiceId ?? inv.providerDocumentId,
                externalTransactionId: inv.paymentTransactionId,
                event: 'payment.success',
                amount: inv.amount,
              });
              applyIntegrationWebhook(update);
              log('webhook.payment.success', 'success', 'תשלום התקבל', update);
            })
          }
        >
          סימולציית תשלום מוצלח
        </button>

        <button
          type="button"
          className="btn btn-ghost btn-sm"
          disabled={busy || !syncedInvoice}
          onClick={() =>
            void run('תשלום סומן כנכשל', async () => {
              const inv = syncedInvoice!;
              const update = await simulateIntegrationWebhook({
                providerId: financeConnection?.providerId ?? 'mock_finance',
                invoiceId: inv.id,
                externalInvoiceId: inv.externalInvoiceId ?? inv.providerDocumentId,
                externalTransactionId: inv.paymentTransactionId,
                event: 'payment.failed',
              });
              applyIntegrationWebhook(update);
              log('webhook.payment.failed', 'failed', 'התשלום נכשל', update);
            })
          }
        >
          סימולציית תשלום נכשל
        </button>

        <button
          type="button"
          className="btn btn-ghost btn-sm"
          disabled={busy}
          onClick={() =>
            void run('לוגים נטענו', async () => {
              const { logs } = await fetchIntegrationLogs({ businessId });
              setServerLogs(logs);
            })
          }
        >
          טעינת לוגים מהשרת
        </button>
      </div>

      {msg && <p className="field-hint">{msg}</p>}

      <div className="integration-log-list">
        <h3 className="section-title-sm">לוגים מקומיים</h3>
        {integrationLogs.length === 0 ? (
          <p className="empty-state" style={{ padding: '0.5rem' }}>
            אין לוגים
          </p>
        ) : (
          <ul>
            {integrationLogs.slice(0, 8).map((l) => (
              <li key={l.id}>
                <strong>{l.action}</strong> — {l.message}{' '}
                <span className="text-muted">({l.status})</span>
              </li>
            ))}
          </ul>
        )}
        {serverLogs.length > 0 && (
          <>
            <h3 className="section-title-sm">לוגים מהשרת</h3>
            <ul>
              {serverLogs.slice(0, 8).map((l) => (
                <li key={l.id}>
                  <strong>{l.action}</strong> — {l.message}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </section>
  );
}
