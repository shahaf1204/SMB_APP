export function phoneTelLink(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  return `tel:${digits}`;
}

export function whatsAppLink(phone: string, message?: string): string {
  let digits = phone.replace(/\D/g, '');
  if (digits.startsWith('0')) digits = `972${digits.slice(1)}`;
  const text = message ? `?text=${encodeURIComponent(message)}` : '';
  return `https://wa.me/${digits}${text}`;
}

export function emailLink(email: string): string {
  return `mailto:${email}`;
}

/** mailto עם subject/body — encodeURIComponent (לא URLSearchParams) כדי שלא יופיעו + במקום רווחים */
export function mailtoWithBody(
  to: string,
  options: { subject?: string; body?: string },
): string {
  const parts: string[] = [];
  if (options.subject) {
    parts.push(`subject=${encodeURIComponent(options.subject)}`);
  }
  if (options.body) {
    const normalizedBody = options.body.replace(/\n/g, '\r\n');
    parts.push(`body=${encodeURIComponent(normalizedBody)}`);
  }
  const query = parts.length ? `?${parts.join('&')}` : '';
  return `mailto:${to}${query}`;
}
