/** Forms.app nested webhook payload parser (client-safe, no mock data). */

export interface FormsAppQuestion {
  _id?: string;
  question?: string;
  qt?: string;
  type?: string;
}

export interface FormsAppAnswerItem {
  q?: string;
  qt?: string;
  fn?: { f?: string; l?: string };
  d?: string;
  ti?: { h?: number | string; m?: number | string };
  n?: number | string;
  c?: Array<{ t?: string; v?: string }>;
  a?: { a1?: string; a2?: string; city?: string; state?: string; zip?: string };
  t?: string;
  p?: string;
  e?: string;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function questionType(question: FormsAppQuestion, answer: FormsAppAnswerItem): string {
  return String(answer.qt ?? question.qt ?? question.type ?? '').toLowerCase();
}

function pad2(value: number | string | undefined): string {
  return String(value ?? '0').padStart(2, '0');
}

export function extractFormsAppAnswerValue(
  answer: FormsAppAnswerItem,
  qt: string,
): string {
  switch (qt) {
    case 'fullname':
    case 'name': {
      const fn = answer.fn;
      if (fn) {
        const parts = [fn.f, fn.l].map((v) => v?.trim()).filter(Boolean);
        if (parts.length) return parts.join(' ');
      }
      break;
    }
    case 'date':
      if (answer.d) return String(answer.d).trim();
      break;
    case 'time': {
      const ti = answer.ti;
      if (ti) return `${pad2(ti.h)}:${pad2(ti.m)}`;
      break;
    }
    case 'number':
    case 'quantity':
      if (answer.n != null && answer.n !== '') return String(answer.n).trim();
      break;
    case 'singlechoice':
    case 'dropdown':
    case 'radiobutton':
    case 'yesno':
      if (Array.isArray(answer.c) && answer.c.length > 0) {
        const choice = answer.c[0];
        const text = choice?.t ?? choice?.v;
        if (text != null) return String(text).trim();
      }
      break;
    case 'address': {
      const addr = answer.a;
      if (addr) {
        if (addr.a1?.trim()) return addr.a1.trim();
        const parts = [addr.a1, addr.a2, addr.city, addr.state, addr.zip]
          .map((v) => v?.trim())
          .filter(Boolean);
        if (parts.length) return parts.join(', ');
      }
      break;
    }
    case 'longtext':
    case 'shorttext':
    case 'text':
    case 'paragraph':
      if (answer.t != null) return String(answer.t).trim();
      break;
    case 'phone':
    case 'tel':
      if (answer.p != null) return String(answer.p).trim();
      if (answer.t != null) return String(answer.t).trim();
      break;
    case 'email':
      if (answer.e != null) return String(answer.e).trim();
      if (answer.t != null) return String(answer.t).trim();
      break;
    default:
      break;
  }

  if (answer.t != null && String(answer.t).trim()) return String(answer.t).trim();
  if (answer.n != null && answer.n !== '') return String(answer.n).trim();
  if (answer.p != null) return String(answer.p).trim();
  if (answer.e != null) return String(answer.e).trim();
  if (answer.d != null) return String(answer.d).trim();
  if (Array.isArray(answer.c) && answer.c[0]?.t) return String(answer.c[0].t).trim();

  return '';
}

export function extractFormsAppSubmissionId(payload: unknown): string | undefined {
  const root = asRecord(payload);
  if (!root) return undefined;

  const answer = asRecord(root.answer ?? root.Answer ?? root.submission);
  const candidates = [
    answer?._id,
    answer?.id,
    root._id,
    root.id,
    root.submission_id,
    root.submissionId,
  ];

  for (const c of candidates) {
    if (typeof c === 'string' && c.trim()) return c.trim();
    if (typeof c === 'number') return String(c);
  }
  return undefined;
}

export function parseFormsAppNestedPayload(payload: unknown): Record<string, string> {
  const root = asRecord(payload);
  if (!root) return {};

  const form = asRecord(root.form ?? root.Form);
  const answerRoot = asRecord(root.answer ?? root.Answer ?? root.submission);

  const questionsRaw = form?.questions;
  const answersRaw = answerRoot?.answers;

  if (!Array.isArray(questionsRaw) || !Array.isArray(answersRaw)) {
    return {};
  }

  const questionById = new Map<string, FormsAppQuestion>();
  for (const item of questionsRaw) {
    const q = item as FormsAppQuestion;
    const id = q._id?.trim();
    if (id) questionById.set(id, q);
  }

  const fields: Record<string, string> = {};

  for (const item of answersRaw) {
    const answer = item as FormsAppAnswerItem;
    const questionId = answer.q?.trim();
    if (!questionId) continue;

    const question = questionById.get(questionId);
    const label = question?.question?.trim() || questionId;
    const qt = questionType(question ?? {}, answer);
    const value = extractFormsAppAnswerValue(answer, qt);
    if (value) fields[label] = value;
  }

  return fields;
}

/** Parse Forms.app payload — nested structure first, flat fallback for simulate button payloads. */
export function parseFormsAppPayload(payload: unknown): Record<string, string> {
  const nested = parseFormsAppNestedPayload(payload);
  if (Object.keys(nested).length > 0) return nested;
  return {};
}
