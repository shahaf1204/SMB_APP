/** Morning (Green Invoice) API — server-side only */

import type { FinanceInvoiceInput } from './financeProvider.interface';

export const MORNING_SANDBOX_BASE = 'https://sandbox.d.greeninvoice.co.il/api/v1';
export const MORNING_PRODUCTION_BASE = 'https://api.greeninvoice.co.il/api/v1';

export interface MorningAuth {
  id: string;
  secret: string;
  baseUrl: string;
}

export interface MorningInvoiceResult {
  externalInvoiceId: string;
  externalDocumentNumber: string;
  externalPdfUrl: string;
  paymentLink?: string;
  status: 'sent';
  providerDocumentId: string;
  providerInvoiceNumber: string;
  officialPdfUrl: string;
  paymentUrl?: string;
}

export function parseMorningApiKey(raw: string): { id: string; secret: string } {
  const trimmed = raw.trim();
  const colon = trimmed.indexOf(':');
  if (colon <= 0) {
    throw new Error('פורmat שגוי — הדביקו API Key ID ו-Secret בפורmat id:secret');
  }
  const id = trimmed.slice(0, colon).trim();
  const secret = trimmed.slice(colon + 1).trim();
  if (!id || !secret) {
    throw new Error('נדרשים גם API Key ID וגם Secret');
  }
  return { id, secret };
}

async function fetchMorningToken(baseUrl: string, id: string, secret: string): Promise<string> {
  const res = await fetch(`${baseUrl}/account/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, secret }),
  });

  const data = (await res.json().catch(() => ({}))) as {
    token?: string;
    error?: { message?: string };
    message?: string;
  };

  if (!res.ok || !data.token) {
    const msg = data.error?.message ?? data.message ?? `אימות נכשל (${res.status})`;
    throw new Error(msg);
  }

  return data.token;
}

export async function resolveMorningAuth(apiKey: string): Promise<MorningAuth> {
  const { id, secret } = parseMorningApiKey(apiKey);
  let lastError = 'אימות נכשל';

  for (const baseUrl of [MORNING_SANDBOX_BASE, MORNING_PRODUCTION_BASE]) {
    try {
      await fetchMorningToken(baseUrl, id, secret);
      return { id, secret, baseUrl };
    } catch (e) {
      lastError = e instanceof Error ? e.message : lastError;
    }
  }

  throw new Error(
    `${lastError}. בחשבון חינמי (Production) אין מפתח API — הירשמו ל-Sandbox ב-lp.sandbox.d.greeninvoice.co.il/join וצרו מפתח שם.`,
  );
}

export async function testMorningAuth(auth: MorningAuth): Promise<{
  ok: boolean;
  message: string;
  businessName?: string;
  latencyMs?: number;
}> {
  const start = Date.now();
  const token = await fetchMorningToken(auth.baseUrl, auth.id, auth.secret);

  const res = await fetch(`${auth.baseUrl}/account`, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  });

  const data = (await res.json().catch(() => ({}))) as {
    name?: string;
    business?: { name?: string };
    error?: { message?: string };
  };

  if (!res.ok) {
    return {
      ok: false,
      message: data.error?.message ?? `בדיקת חיבור נכשלה (${res.status})`,
      latencyMs: Date.now() - start,
    };
  }

  const businessName = data.business?.name ?? data.name;
  const envLabel = auth.baseUrl.includes('sandbox') ? 'Sandbox' : 'Production';

  return {
    ok: true,
    message: businessName
      ? `מחובר ל-${businessName} (${envLabel})`
      : `החיבור תקין (${envLabel})`,
    businessName,
    latencyMs: Date.now() - start,
  };
}

export async function createMorningInvoice(
  auth: MorningAuth,
  invoice: FinanceInvoiceInput,
): Promise<MorningInvoiceResult> {
  const token = await fetchMorningToken(auth.baseUrl, auth.id, auth.secret);
  const today = new Date().toISOString().slice(0, 10);
  const dueDate = invoice.dueDate.slice(0, 10);

  const body: Record<string, unknown> = {
    type: 320,
    date: today,
    dueDate,
    lang: 'he',
    currency: 'ILS',
    vatType: 0,
    rounding: true,
    client: {
      name: invoice.clientName,
      emails: invoice.clientEmail?.trim() ? [invoice.clientEmail.trim()] : [],
      add: true,
    },
    income: [
      {
        description: invoice.notes?.trim() || `חשבונית עבור ${invoice.clientName}`,
        quantity: 1,
        price: invoice.amount,
        currency: 'ILS',
        vatType: 0,
      },
    ],
    payment: [
      {
        type: 4,
        date: today,
        price: invoice.amount,
        currency: 'ILS',
      },
    ],
  };

  if (invoice.notes?.trim()) {
    body.remarks = invoice.notes.trim();
  }

  const res = await fetch(`${auth.baseUrl}/documents`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const data = (await res.json().catch(() => ({}))) as {
    id?: string;
    number?: string | number;
    url?: { origin?: string; he?: string };
    error?: { message?: string };
    message?: string;
  };

  if (!res.ok || !data.id) {
    throw new Error(data.error?.message ?? data.message ?? `הפקת חשבונית נכשלה (${res.status})`);
  }

  let pdfUrl = data.url?.he ?? data.url?.origin ?? '';

  if (!pdfUrl) {
    try {
      const linksRes = await fetch(`${auth.baseUrl}/documents/${data.id}/download/links`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const links = (await linksRes.json().catch(() => ({}))) as {
        he?: string;
        origin?: string;
      };
      pdfUrl = links.he ?? links.origin ?? '';
    } catch {
      /* optional */
    }
  }

  const docNum = String(data.number ?? data.id);

  return {
    externalInvoiceId: data.id,
    externalDocumentNumber: docNum,
    externalPdfUrl: pdfUrl,
    status: 'sent',
    providerDocumentId: data.id,
    providerInvoiceNumber: docNum,
    officialPdfUrl: pdfUrl,
  };
}

export function morningAuthFromStored(apiKey: string, apiBaseUrl?: string): MorningAuth {
  const { id, secret } = parseMorningApiKey(apiKey);
  return {
    id,
    secret,
    baseUrl: apiBaseUrl ?? MORNING_PRODUCTION_BASE,
  };
}
