import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { BottomNav } from '../components/BottomNav';
import { getCatalogEntry } from '../integrations/catalog';
import { formatCurrency } from '../lib/finance';
import {
  createProviderPaymentLink,
  getActiveFinanceConnection,
  pushInvoiceToProvider,
  whatsAppShareUrl,
} from '../lib/integrations/client';
import { invoiceMailtoHref, resolveInvoiceClientEmail } from '../lib/invoices';
import { useAppStore } from '../store/useAppStore';

export function InvoiceDetailPage() {
  const { id } = useParams();
  const business = useAppStore((s) => s.business)!;
  const events = useAppStore((s) => s.events);
  const invoices = useAppStore((s) => s.invoices);
  const connections = useAppStore((s) => s.integrationConnections);
  const updateInvoiceStatus = useAppStore((s) => s.updateInvoiceStatus);
  const updateInvoice = useAppStore((s) => s.updateInvoice);
  const invoice = invoices.find((i) => i.id === id);
  const [emailDraft, setEmailDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  const financeConn = getActiveFinanceConnection(connections, business.id);

  useEffect(() => {
    if (!invoice) return;
    const fromEvent = invoice.eventId
      ? events.find((e) => e.id === invoice.eventId)?.clientEmail
      : undefined;
    setEmailDraft(invoice.clientEmail ?? fromEvent ?? '');
  }, [invoice, events]);

  if (!invoice) {
    return (
      <div className="page">
        <p>חשבונית לא נמצאה</p>
        <Link to="/invoices">חזרה</Link>
      </div>
    );
  }

  const invoiceForContact = {
    ...invoice,
    clientEmail: emailDraft.trim() || invoice.clientEmail,
  };
  const clientEmail = resolveInvoiceClientEmail(invoiceForContact, events);
  const mailtoHref = invoiceMailtoHref(invoiceForContact, business, events);
  const providerName = invoice.provider
    ? getCatalogEntry(invoice.provider)?.nameHe
    : financeConn
      ? getCatalogEntry(financeConn.provider)?.nameHe
      : null;

  const saveClientEmail = () => {
    const trimmed = emailDraft.trim();
    if (trimmed !== (invoice.clientEmail ?? '')) {
      updateInvoice(invoice.id, { clientEmail: trimmed });
    }
  };

  const handlePushToProvider = async () => {
    if (!financeConn) return;
    setBusy(true);
    setActionMsg(null);
    try {
      const result = await pushInvoiceToProvider({
        businessId: business.id,
        connectionId: financeConn.id,
        provider: financeConn.provider,
        invoice: {
          clientName: invoice.clientName,
          clientEmail: invoice.clientEmail,
          amount: invoice.amount,
          dueDate: invoice.dueDate,
          notes: invoice.notes,
        },
      });
      updateInvoice(invoice.id, {
        provider: financeConn.provider,
        providerDocumentId: result.providerDocumentId,
        providerInvoiceNumber: result.providerInvoiceNumber,
        officialPdfUrl: result.officialPdfUrl,
        paymentUrl: result.paymentUrl,
        paymentStatus: result.paymentUrl ? 'pending' : 'none',
        providerSyncedAt: new Date().toISOString(),
        status: 'sent',
      });
      setActionMsg('חשבונית הופקה אצל הספק');
    } catch (e) {
      setActionMsg(e instanceof Error ? e.message : 'שגיאה');
    } finally {
      setBusy(false);
    }
  };

  const handlePaymentLink = async () => {
    if (!financeConn || !invoice.providerDocumentId) return;
    setBusy(true);
    try {
      const result = await createProviderPaymentLink({
        connectionId: financeConn.id,
        provider: financeConn.provider,
        providerDocumentId: invoice.providerDocumentId,
        amount: invoice.amount,
      });
      updateInvoice(invoice.id, {
        paymentUrl: result.paymentUrl,
        paymentTransactionId: result.providerTransactionId,
        paymentStatus: 'pending',
      });
      setActionMsg('קישור תשלום נוצר');
    } catch (e) {
      setActionMsg(e instanceof Error ? e.message : 'שגיאה');
    } finally {
      setBusy(false);
    }
  };

  const paymentLinkText = invoice.paymentUrl
    ? `שלום ${invoice.clientName}, קישור לתשלום: ${invoice.paymentUrl}`
    : '';

  return (
    <div className="app-shell">
      <div className="page">
        <div className="no-print" style={{ marginBottom: '0.75rem' }}>
          <Link to="/invoices">← חזרה לחשבוניות</Link>
        </div>

        {providerName && (
          <p className="provider-badge-inline">ספק: {providerName}</p>
        )}

        <article className="invoice-print card">
          <header className="invoice-print-header">
            <h1>{business.name}</h1>
            <p>
              חשבונית מס׳{' '}
              {invoice.providerInvoiceNumber ?? invoice.invoiceNumber}
            </p>
            <p>תאריך הפקה: {new Date(invoice.issuedAt).toLocaleDateString('he-IL')}</p>
            <p>לתשלום עד: {new Date(invoice.dueDate).toLocaleDateString('he-IL')}</p>
          </header>
          <section>
            <p>
              <strong>לכבוד:</strong> {invoice.clientName}
            </p>
            {clientEmail && (
              <p>
                <strong>אימייל:</strong> {clientEmail}
              </p>
            )}
            <p className="invoice-print-amount">
              <strong>סכום לתשלום:</strong> {formatCurrency(invoice.amount)}
            </p>
            {invoice.notes && <p>{invoice.notes}</p>}
          </section>
        </article>

        <div className="no-print invoice-actions-panel">
          {!financeConn ? (
            <Link to="/settings/connections" className="btn btn-primary" style={{ width: '100%' }}>
              חברו ספק חשבוניות
            </Link>
          ) : (
            <>
              {!invoice.providerDocumentId && (
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={busy}
                  onClick={() => void handlePushToProvider()}
                >
                  הפקה אצל {providerName}
                </button>
              )}
              {invoice.providerDocumentId && !invoice.paymentUrl && (
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={busy}
                  onClick={() => void handlePaymentLink()}
                >
                  צור קישור תשלום
                </button>
              )}
              {invoice.officialPdfUrl && (
                <a
                  href={invoice.officialPdfUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-ghost"
                >
                  פתיחת PDF רשמי
                </a>
              )}
              {invoice.paymentUrl && (
                <>
                  <a href={invoice.paymentUrl} target="_blank" rel="noreferrer" className="btn btn-ghost">
                    פתיחת קישור תשלום
                  </a>
                  <a
                    href={whatsAppShareUrl('', paymentLinkText)}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-ghost"
                  >
                    שליחה בוואטסאפ
                  </a>
                </>
              )}
            </>
          )}

          {actionMsg && <p className="field-hint">{actionMsg}</p>}

          <div className="field" style={{ marginTop: '0.75rem' }}>
            <label htmlFor="inv-client-email">אימייל לקוח</label>
            <input
              id="inv-client-email"
              type="email"
              value={emailDraft}
              onChange={(e) => setEmailDraft(e.target.value)}
              onBlur={saveClientEmail}
            />
          </div>
          <div className="field">
            <label htmlFor="inv-status">סטטוס</label>
            <select
              id="inv-status"
              value={invoice.status}
              onChange={(e) =>
                updateInvoiceStatus(invoice.id, e.target.value as typeof invoice.status)
              }
            >
              <option value="draft">טיוטה</option>
              <option value="sent">נשלחה</option>
              <option value="paid">שולמה</option>
            </select>
          </div>
          <button type="button" className="btn btn-ghost" onClick={() => window.print()}>
            הדפסה / PDF
          </button>
          {mailtoHref && (
            <a href={mailtoHref} className="btn btn-ghost" onClick={saveClientEmail}>
              שליחה במייל
            </a>
          )}
        </div>
      </div>
      <div className="no-print">
        <BottomNav />
      </div>
    </div>
  );
}
