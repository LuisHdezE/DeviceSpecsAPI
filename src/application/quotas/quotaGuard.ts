import type { QuotaDecision, QuotaLedger, QuotaWindow } from '../../domain/quotas/quota.js';
export class QuotaGuard {
  constructor(private readonly ledger: QuotaLedger, private readonly now: () => Date) {}
  async allowAttempt(windows: readonly QuotaWindow[], cost = 1): Promise<QuotaDecision> {
    if (windows.length === 0 || !Number.isSafeInteger(cost) || cost <= 0)
      return { allowed: false, reason: 'invalid_window' };
    const seen = new Set<string>();
    for (const w of windows) {
      const key = JSON.stringify([w.providerId, w.windowId]);
      if (!w.providerId.trim() || !w.windowId.trim() || !Number.isFinite(w.resetAt.getTime()) || seen.has(key))
        return { allowed: false, reason: 'invalid_window' };
      seen.add(key);
    }
    return this.ledger.reserve(windows, cost, this.now());
  }
}
