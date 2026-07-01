import type { Invoice } from '../../types/models';

/** Read invoice fields with legacy fallbacks */
export function getExternalProvider(inv: Invoice): string | undefined {
  return inv.externalProvider ?? inv.provider;
}

export function getExternalInvoiceId(inv: Invoice): string | undefined {
  return inv.externalInvoiceId ?? inv.providerDocumentId;
}

export function getExternalDocumentNumber(inv: Invoice): string | undefined {
  return inv.externalDocumentNumber ?? inv.providerInvoiceNumber;
}

export function getExternalPdfUrl(inv: Invoice): string | undefined {
  return inv.externalPdfUrl ?? inv.officialPdfUrl;
}

export function getPaymentLink(inv: Invoice): string | undefined {
  return inv.paymentLink ?? inv.paymentUrl;
}

export function normalizePaymentStatus(
  status?: Invoice['paymentStatus'],
): Invoice['paymentStatus'] {
  if (!status || status === 'none') return 'unpaid';
  return status;
}

export function mapDocumentToInvoicePatch(
  providerId: string,
  doc: {
    externalInvoiceId?: string;
    externalDocumentNumber?: string;
    externalPdfUrl?: string;
    paymentLink?: string;
    providerDocumentId?: string;
    providerInvoiceNumber?: string;
    officialPdfUrl?: string;
    paymentUrl?: string;
  },
): Partial<Invoice> {
  const externalInvoiceId = doc.externalInvoiceId ?? doc.providerDocumentId;
  const externalDocumentNumber = doc.externalDocumentNumber ?? doc.providerInvoiceNumber;
  const externalPdfUrl = doc.externalPdfUrl ?? doc.officialPdfUrl;
  const paymentLink = doc.paymentLink ?? doc.paymentUrl;

  return {
    externalProvider: providerId,
    externalInvoiceId,
    externalDocumentNumber,
    externalPdfUrl,
    paymentLink,
    provider: providerId,
    providerDocumentId: externalInvoiceId,
    providerInvoiceNumber: externalDocumentNumber,
    officialPdfUrl: externalPdfUrl,
    paymentUrl: paymentLink,
    syncStatus: 'synced',
    syncError: undefined,
    paymentStatus: paymentLink ? 'pending' : 'unpaid',
    providerSyncedAt: new Date().toISOString(),
  };
}

export function mapPaymentLinkToInvoicePatch(link: {
  paymentLink?: string;
  paymentUrl?: string;
  externalTransactionId?: string;
  providerTransactionId?: string;
}): Partial<Invoice> {
  const paymentLink = link.paymentLink ?? link.paymentUrl;
  const paymentTransactionId = link.externalTransactionId ?? link.providerTransactionId;
  return {
    paymentLink,
    paymentUrl: paymentLink,
    paymentTransactionId,
    paymentStatus: 'pending',
  };
}
