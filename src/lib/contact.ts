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
