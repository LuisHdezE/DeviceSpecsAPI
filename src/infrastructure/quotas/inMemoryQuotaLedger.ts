import { operationalLimit, type QuotaDecision, type QuotaLedger, type QuotaWindow } from '../../domain/quotas/quota.js';
/** TEST ONLY. Never use on Cloud Run: counters are not shared or durable. */
export class InMemoryQuotaLedger implements QuotaLedger {
  private readonly counts = new Map<string, { resetAt: number; consumed: number }>();
  private queue: Promise<void> = Promise.resolve();
  reserve(windows: readonly QuotaWindow[], cost: number, at: Date): Promise<QuotaDecision> {
    const task = this.queue.then(() => this.locked(windows, cost, at));
    this.queue = task.then(() => undefined, () => undefined);
    return task;
  }
  private locked(windows: readonly QuotaWindow[], cost: number, at: Date): QuotaDecision {
    if (!windows.length || !Number.isSafeInteger(cost) || cost <= 0 || !Number.isFinite(at.getTime()))
      return { allowed: false, reason: 'invalid_window' };
    const rows: Array<{ key: string; reset: number; count: number; cap: number }> = [];
    const seen = new Set<string>();
    for (const w of windows) {
      if (!w.providerId.trim() || !w.windowId.trim() || !Number.isFinite(w.resetAt.getTime()))
        return { allowed: false, reason: 'invalid_window' };
      const key = JSON.stringify([w.providerId, w.windowId]);
      if (seen.has(key)) return { allowed: false, reason: 'invalid_window' };
      seen.add(key);
      const existing = this.counts.get(key);
      const reset = w.resetAt.getTime();
      if (reset <= at.getTime()) return { allowed: false, reason: 'expired', resetAt: w.resetAt };
      if (existing && existing.resetAt > at.getTime() && existing.resetAt !== reset)
        return { allowed: false, reason: 'invalid_window' };
      rows.push({ key, reset, count: existing && existing.resetAt > at.getTime() ? existing.consumed : 0, cap: operationalLimit(w) });
    }
    const blocked = rows.find(r => r.count + cost > r.cap);
    if (blocked) return { allowed: false, reason: 'reserved', resetAt: new Date(blocked.reset) };
    for (const row of rows) this.counts.set(row.key, { resetAt: row.reset, consumed: row.count + cost });
    return { allowed: true,
      consumed: Math.max(...rows.map(r => r.count + cost)),
      remaining: Math.min(...rows.map(r => r.cap - r.count - cost)) };
  }
}
