import type { IncomingMessage } from 'http';

/** Read the unmodified request body bytes (required for Meta signature verification). */
export async function readRawRequestBody(req: IncomingMessage): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}
