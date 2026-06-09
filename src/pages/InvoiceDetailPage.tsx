import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { BottomNav } from '../components/BottomNav';
import { formatCurrency } from '../lib/finance';
import { invoiceMailtoHref, resolveInvoiceClientEmail } from '../lib/invoices';
import { useAppStore } from '../store/useAppStore';

export function InvoiceDetailPage() {
  const { id } = useParams();
  const business = useAppStore((s) => s.business)!;
  const events = useAppStore((s) => s.events);
  const invoices = useAppStore((s) => s.invoices);
  const updateInvoiceStatus = useAppStore((s) => s.updateInvoiceStatus);
  const updateInvoice = useAppStore((s) => s.updateInvoice);
  const invoice = invoices.find((i) => i.id === id);
  const [emailDraft, setEmailDraft] = useState('');

  useEffect(() => {
    if (!invoice) return;
    const fromEvent = invoice.eventId
      ? events.find((e) => e.id === invoice.eventId)?.clientEmail
      : undefined;
    setEmailDraft(invoice.clientEmail ?? fromEvent ?? '');
  }, [invoice, events]);

  const invoiceForContact = invoice
    ? {
        ...invoice,
        clientEmail: emailDraft.trim() || invoice.clientEmail,
      }
    : null;
  const clientEmail = invoiceForContact
    ? resolveInvoiceClientEmail(invoiceForContact, events)
    : undefined;
  const mailtoHref = invoiceForContact
    ? invoiceMailtoHref(invoiceForContact, business, events)
    : null;

  if (!invoice) {
    return (
      <div className="page">
        <p>חשבונית לא נמצאה</p>
        <Link to="/invoices">חזרה</Link>
      </div>
    );
  }

  const handlePrint = () => window.print();

  const saveClientEmail = () => {
    const trimmed = emailDraft.trim();
    const current = invoice.clientEmail ?? '';
    if (trimmed !== current) {
      updateInvoice(invoice.id, { clientEmail: trimmed });
    }
  };

  return (
    <div className="app-shell">
      <div className="page">
        <div className="no-print" style={{ marginBottom: '0.75rem' }}>
          <Link to="/invoices">← חזרה לחשבוניות</Link>
        </div>

        <article className="invoice-print card">
          <header className="invoice-print-header">
            <h1>{business.name}</h1>
            <p>חשבונית מס׳ {invoice.invoiceNumber}</p>
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
          <footer className="invoice-print-footer">
            <p>תודה על העסקה!</p>
          </footer>
        </article>

        <div className="no-print" style={{ marginTop: '1rem' }}>
          <div className="field">
            <label htmlFor="inv-client-email">אימייל לקוח</label>
            <input
              id="inv-client-email"
              type="email"
              value={emailDraft}
              onChange={(e) => setEmailDraft(e.target.value)}
              onBlur={saveClientEmail}
              placeholder="לדוגמה: client@example.com"
              autoComplete="email"
            />
            <p className="field-hint">
              ניתן להוסיף או לעדכן כאן — נשמר בחשבונית לשליחה במייל
            </p>
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
          <button type="button" className="btn btn-primary" onClick={handlePrint}>
            הדפסה / שמירה כ-PDF
          </button>
          {mailtoHref ? (
            <a
              href={mailtoHref}
              className="btn btn-ghost"
              style={{ marginTop: '0.5rem', display: 'inline-block' }}
              onClick={() => {
                saveClientEmail();
                if (invoice.status === 'draft') {
                  updateInvoiceStatus(invoice.id, 'sent');
                }
              }}
            >
              שליחה לאימייל הלקוח
            </a>
          ) : (
            <p className="empty-state" style={{ marginTop: '0.75rem', fontSize: '0.85rem' }}>
              להפעלת שליחה במייל — הזיני אימייל לקוח בשדה למעלה
            </p>
          )}
        </div>
      </div>
      <div className="no-print">
        <BottomNav />
      </div>
    </div>
  );
}
