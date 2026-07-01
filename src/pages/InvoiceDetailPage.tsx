import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { BottomNav } from '../components/BottomNav';
import { formatCurrency } from '../lib/finance';
import {
  getExternalDocumentNumber,
  getExternalPdfUrl,
  getExternalProvider,
  getPaymentLink,
  normalizePaymentStatus,
} from '../lib/integrations/invoiceHelpers';
import {
  buildIntegrationLog,
  buildInvoicePatchFromDocument,
  buildInvoicePatchFromPaymentLink,
  buildPaymentTransaction,
  createInvoicePaymentLink,
  getActiveFinanceConnection,
  issueOfficialInvoice,
  providerDisplayName,
} from '../lib/integrations/service';
import { whatsAppShareUrl } from '../lib/integrations/client';
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
  const addIntegrationLog = useAppStore((s) => s.addIntegrationLog);
  const upsertPaymentTransaction = useAppStore((s) => s.upsertPaymentTransaction);
  const invoice = invoices.find((i) => i.id === id);
  const [emailDraft, setEmailDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [copyOk, setCopyOk] = useState(false);

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
  const providerName = getExternalProvider(invoice)
    ? providerDisplayName(getExternalProvider(invoice)!)
    : financeConn
      ? providerDisplayName(financeConn.providerId)
      : null;
  const docNumber = getExternalDocumentNumber(invoice) ?? String(invoice.invoiceNumber);
  const pdfUrl = getExternalPdfUrl(invoice);
  const paymentLink = getPaymentLink(invoice);
  const paymentStatus = normalizePaymentStatus(invoice.paymentStatus);
  const hasExternalDoc = Boolean(getExternalInvoiceId(invoice));

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
      const doc = await issueOfficialInvoice({
        connection: financeConn,
        businessId: business.id,
        invoice,
      });
      updateInvoice(invoice.id, {
        ...buildInvoicePatchFromDocument(financeConn.providerId, doc),
        status: 'sent',
      });
      addIntegrationLog(
        buildIntegrationLog({
          businessId: business.id,
          connectionId: financeConn.id,
          providerId: financeConn.providerId,
          action: 'createInvoice',
          status: 'success',
          message: `הופקה חשבונית ${doc.externalDocumentNumber ?? doc.providerInvoiceNumber}`,
        }),
      );
      setActionMsg('חשבונית רשמית הופקה בהצלחה');
    } catch (e) {
      updateInvoice(invoice.id, { syncStatus: 'failed', syncError: e instanceof Error ? e.message : 'שגיאה' });
      setActionMsg(e instanceof Error ? e.message : 'שגיאה');
    } finally {
      setBusy(false);
    }
  };

  const handlePaymentLink = async () => {
    if (!financeConn || !hasExternalDoc) return;
    setBusy(true);
    try {
      const link = await createInvoicePaymentLink({ connection: financeConn, invoice });
      updateInvoice(invoice.id, buildInvoicePatchFromPaymentLink(link));
      upsertPaymentTransaction(
        buildPaymentTransaction({
          businessId: business.id,
          invoiceId: invoice.id,
          providerId: financeConn.providerId,
          link,
          amount: invoice.amount,
        }),
      );
      addIntegrationLog(
        buildIntegrationLog({
          businessId: business.id,
          connectionId: financeConn.id,
          providerId: financeConn.providerId,
          action: 'createPaymentLink',
          status: 'success',
          message: 'קישור תשלום נוצר',
        }),
      );
      setActionMsg('קישור תשלום נוצר');
    } catch (e) {
      setActionMsg(e instanceof Error ? e.message : 'שגיאה');
    } finally {
      setBusy(false);
    }
  };

  const copyPaymentLink = async () => {
    if (!paymentLink) return;
    try {
      await navigator.clipboard.writeText(paymentLink);
      setCopyOk(true);
      setTimeout(() => setCopyOk(false), 2000);
    } catch {
      setActionMsg('לא הצלחנו להעתיק — העתיקו ידנית');
    }
  };

  const paymentLinkText = paymentLink
    ? `שלום ${invoice.clientName}, קישור לתשלום עבור חשבונית ${docNumber}: ${paymentLink}`
    : '';

  return (
    <div className="app-shell">
      <div className="page">
        <div className="no-print" style={{ marginBottom: '0.75rem' }}>
          <Link to="/invoices">← חזרה לחשבוניות</Link>
        </div>

        {providerName && <p className="provider-badge-inline">ספק: {providerName}</p>}
        {invoice.syncStatus === 'synced' && (
          <p className="field-hint">מסמך רשמי מסונכרן עם הספק</p>
        )}
        {paymentStatus === 'paid' && (
          <p className="field-hint" style={{ color: 'var(--color-success-dark)' }}>
            ✓ התשלום התקבל
            {invoice.paidAt && ` · ${new Date(invoice.paidAt).toLocaleDateString('he-IL')}`}
          </p>
        )}

        <article className="invoice-print card">
          <header className="invoice-print-header">
            <h1>{business.name}</h1>
            <p>חשבונית מס׳ {docNumber}</p>
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
            <>
              <p className="field-hint">חברי ספק חשבוניות כדי להפיק מסמך רשמי</p>
              <Link to="/settings/connections" className="btn btn-primary" style={{ width: '100%' }}>
                חיבור ספק
              </Link>
            </>
          ) : (
            <>
              {!hasExternalDoc && (
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={busy}
                  onClick={() => void handlePushToProvider()}
                >
                  הפקת חשבונית רשמית
                </button>
              )}
              {hasExternalDoc && !paymentLink && (
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={busy}
                  onClick={() => void handlePaymentLink()}
                >
                  יצירת קישור לתשלום
                </button>
              )}
              {paymentLink && (
                <>
                  <button type="button" className="btn btn-ghost" onClick={() => void copyPaymentLink()}>
                    {copyOk ? 'הועתק ✓' : 'העתקת קישור'}
                  </button>
                  <a
                    href={whatsAppShareUrl('', paymentLinkText)}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-ghost"
                  >
                    שליחה בוואטסאפ
                  </a>
                  <a href={paymentLink} target="_blank" rel="noreferrer" className="btn btn-ghost">
                    פתיחת קישור תשלום
                  </a>
                </>
              )}
              {pdfUrl && (
                <a href={pdfUrl} target="_blank" rel="noreferrer" className="btn btn-ghost">
                  פתיחת מסמך רשמי
                </a>
              )}
            </>
          )}

          {actionMsg && <p className="field-hint">{actionMsg}</p>}
          {invoice.syncError && <p className="import-feedback">{invoice.syncError}</p>}

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

function getExternalInvoiceId(invoice: {
  externalInvoiceId?: string;
  providerDocumentId?: string;
}) {
  return invoice.externalInvoiceId ?? invoice.providerDocumentId;
}
