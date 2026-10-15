export interface QuotaWindow {
  readonly providerId: string;
  readonly windowId: string;
  readonly limit: number;
  readonly reserve: number;
  readonly resetAt: Date;
}
export type QuotaDecision =
  | { readonly allowed: true; readonly consumed: number; readonly remaining: number }
  | { readonly allowed: false; readonly reason: 'reserved' | 'invalid_window' | 'expired'; readonly resetAt?: Date };
export interface QuotaLedger {
  /** All-or-nothing atomic reservation across all windows and instances. */
  reserve(windows: readonly QuotaWindow[], cost: number, at: Date): Promise<QuotaDecision>;
}
export function operationalLimit(w: QuotaWindow): number {
  if (!Number.isSafeInteger(w.limit) || w.limit < 0 ||
      !Number.isSafeInteger(w.reserve) || w.reserve < 0) throw new Error('Invalid quota window');
  return Math.max(0, w.limit - w.reserve);
}
