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
  const invoice = invoices.find((i) => i.id === id);
  const clientEmail = invoice ? resolveInvoiceClientEmail(invoice, events) : undefined;
  const mailtoHref = invoice ? invoiceMailtoHref(invoice, business, events) : null;

  if (!invoice) {
    return (
      <div className="page">
        <p>חשבונית לא נמצאה</p>
        <Link to="/invoices">חזרה</Link>
      </div>
    );
  }

  const handlePrint = () => window.print();

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
                if (invoice.status === 'draft') {
                  updateInvoiceStatus(invoice.id, 'sent');
                }
              }}
            >
              שליחה לאימייל הלקוח
            </a>
          ) : (
            <p className="empty-state" style={{ marginTop: '0.75rem', fontSize: '0.85rem' }}>
              להוספת שליחה במייל — הזינו אימייל לקוח בעת יצירת האירוע או ערכו את האירוע המקושר.
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
