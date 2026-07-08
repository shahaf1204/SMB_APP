export function serverLog(tag: string, detail?: Record<string, unknown>): void {
  console.log(`[${tag}]`, detail ?? {});
}

export function serverError(tag: string, detail?: Record<string, unknown>): void {
  console.error(`[${tag}]`, detail ?? {});
}
