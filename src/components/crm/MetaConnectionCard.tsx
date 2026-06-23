import { FormEvent, useState } from 'react';
import type { MetaConnection } from '../../types/crm';
import {
  disconnectMetaConnection,
  getMetaOAuthUrl,
  getMetaWebhookUrl,
  saveMetaConnectionPending,
} from '../../lib/crm/metaConnection';

interface MetaConnectionCardProps {
  connection: MetaConnection | null;
  loading: boolean;
  userId: string;
  businessId: string;
  onUpdated: () => void;
}

export function MetaConnectionCard({
  connection,
  loading,
  userId,
  businessId,
  onUpdated,
}: MetaConnectionCardProps) {
  const [showManage, setShowManage] = useState(false);
  const [pageId, setPageId] = useState('');
  const [pageName, setPageName] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const metaAppId = import.meta.env.VITE_META_APP_ID?.trim();
  const webhookUrl = getMetaWebhookUrl();
  const isConnected = Boolean(connection?.isActive);

  const handleConnect = () => {
    if (metaAppId) {
      const redirectUri = `${window.location.origin}/auth`;
      window.location.href = getMetaOAuthUrl(metaAppId, redirectUri);
      return;
    }
    setShowManage(true);
  };

  const handleSavePending = async (e: FormEvent) => {
    e.preventDefault();
    if (!pageId.trim() || !pageName.trim()) {
      setMsg('יש למלא מזהה עמוד ושם עמוד');
      return;
    }
    setBusy(true);
    setMsg(null);
    const saved = await saveMetaConnectionPending(userId, businessId, pageId, pageName);
    setBusy(false);
    if (!saved) {
      setMsg('לא הצלחנו לשמור — ודא/י ש-Supabase CRM מוגדר (supabase/crm.sql)');
      return;
    }
    setMsg('העמוד נשמר. השלימ/י הגדרת Webhook ב-Meta Developer Console.');
    setShowManage(false);
    onUpdated();
  };

  const handleDisconnect = async () => {
    if (!connection || !window.confirm('לנתק את חיבור Meta?')) return;
    setBusy(true);
    await disconnectMetaConnection(connection.id);
    setBusy(false);
    onUpdated();
  };

  if (loading) {
    return (
      <section className="card crm-meta-card">
        <p className="crm-meta-title">חיבור Meta</p>
        <p className="page-subtitle" style={{ margin: 0 }}>
          טוען…
        </p>
      </section>
    );
  }

  if (!isConnected) {
    return (
      <section className="card crm-meta-card">
        <p className="crm-meta-title">Meta Lead Ads (מתקדם)</p>
        <p className="crm-meta-desc">
          חיבור אוטומטי מפייסבוק ואינסטגרם — לשלב שיש לקוח עם עמוד ו-Lead Ads. אפשר לדלג
          ולהשתמש ב-Google Sheets או הוספה ידנית.
        </p>
        {connection && !connection.isActive && (
          <p className="crm-meta-hint">
            עמוד «{connection.pageName}» נשמר — ממתין להשלמת OAuth / Webhook.
          </p>
        )}
        {msg && <p className="crm-meta-msg">{msg}</p>}
        <button type="button" className="btn btn-primary" style={{ width: '100%' }} onClick={handleConnect}>
          חיבור Meta
        </button>
        {showManage && (
          <form onSubmit={(e) => void handleSavePending(e)} className="crm-meta-form">
            <div className="field">
              <label htmlFor="meta-page-id">מזהה עמוד (Page ID)</label>
              <input
                id="meta-page-id"
                value={pageId}
                onChange={(e) => setPageId(e.target.value)}
                placeholder="123456789"
              />
            </div>
            <div className="field">
              <label htmlFor="meta-page-name">שם העמוד</label>
              <input
                id="meta-page-name"
                value={pageName}
                onChange={(e) => setPageName(e.target.value)}
                placeholder="שם העסק בפייסבוק"
              />
            </div>
            <p className="crm-meta-webhook">
              Webhook URL להדבקה ב-Meta:
              <br />
              <code>{webhookUrl}</code>
            </p>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={busy}>
              {busy ? 'שומר…' : 'שמירת עמוד'}
            </button>
          </form>
        )}
      </section>
    );
  }

  return (
    <section className="card crm-meta-card crm-meta-card--connected">
      <p className="crm-meta-title">מחובר ל-Meta</p>
      <p className="crm-meta-desc">
        {connection?.pageName
          ? `עמוד: ${connection.pageName}`
          : 'לידים חדשים ייכנסו אוטומטית מהטפסים הפעילים שלך.'}
      </p>
      <button
        type="button"
        className="btn btn-ghost"
        style={{ width: '100%' }}
        onClick={() => setShowManage((v) => !v)}
      >
        ניהול חיבור
      </button>
      {showManage && (
        <div className="crm-meta-form">
          <p className="crm-meta-webhook">
            Webhook: <code>{webhookUrl}</code>
          </p>
          <button
            type="button"
            className="btn btn-ghost"
            style={{ width: '100%', color: 'var(--color-error)' }}
            disabled={busy}
            onClick={() => void handleDisconnect()}
          >
            ניתוק חיבור
          </button>
        </div>
      )}
    </section>
  );
}
