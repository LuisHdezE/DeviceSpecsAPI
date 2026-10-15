import { operationalLimit, type QuotaDecision, type QuotaLedger, type QuotaWindow } from '../../domain/quotas/quota.js';

export interface MysqlSession {
  execute<T extends Record<string, unknown>>(sql: string, params: readonly unknown[]): Promise<readonly T[]>;
}
export interface MysqlTransactionRunner {
  /** Must run BEGIN/COMMIT/ROLLBACK using ONE connection from a shared MySQL/InnoDB database. */
  transaction<T>(work: (session: MysqlSession) => Promise<T>): Promise<T>;
}
type StoredWindow = { consumed: number | string; reset_at_ms: number | string; limit_value: number; reserve_value: number };

/** Quota reservation algorithm. Requires transactional MySQL 8+/InnoDB. */
export class MysqlQuotaLedger implements QuotaLedger {
  constructor(private readonly database: MysqlTransactionRunner) {}

  async reserve(windows: readonly QuotaWindow[], cost: number, at: Date): Promise<QuotaDecision> {
    if (!windows.length || !Number.isSafeInteger(cost) || cost <= 0 || !Number.isFinite(at.getTime()))
      return { allowed: false, reason: 'invalid_window' };
    const ordered = [...windows].sort((a, b) =>
      a.providerId.localeCompare(b.providerId) || a.windowId.localeCompare(b.windowId));
    const seen = new Set<string>();
    for (const w of ordered) {
      const key = JSON.stringify([w.providerId, w.windowId]);
      if (seen.has(key) || !w.providerId.trim() || !w.windowId.trim() ||
          !Number.isFinite(w.resetAt.getTime())) return { allowed: false, reason: 'invalid_window' };
      seen.add(key);
      operationalLimit(w);
      if (w.resetAt.getTime() <= at.getTime()) return { allowed: false, reason: 'expired', resetAt: w.resetAt };
    }
    return this.database.transaction(async (db) => {
      const rows: Array<{ window: QuotaWindow; consumed: number; cap: number }> = [];
      for (const w of ordered) {
        await db.execute(
          'INSERT IGNORE INTO provider_quota_windows (provider_id, window_id, reset_at_ms, limit_value, reserve_value, consumed) VALUES (?, ?, ?, ?, ?, 0)',
          [w.providerId, w.windowId, w.resetAt.getTime(), w.limit, w.reserve],
        );
        const found = await db.execute<StoredWindow>(
          'SELECT consumed, reset_at_ms, limit_value, reserve_value FROM provider_quota_windows WHERE provider_id = ? AND window_id = ? FOR UPDATE',
          [w.providerId, w.windowId],
        );
        const row = found[0];
        if (!row || Number(row.reset_at_ms) !== w.resetAt.getTime() ||
            Number(row.limit_value) !== w.limit || Number(row.reserve_value) !== w.reserve)
          return { allowed: false, reason: 'invalid_window' } as const;
        rows.push({ window: w, consumed: Number(row.consumed), cap: operationalLimit(w) });
      }
      const denied = rows.find(r => !Number.isSafeInteger(r.consumed) ||
        r.consumed < 0 || r.consumed + cost > r.cap);
      if (denied) return { allowed: false, reason: 'reserved', resetAt: denied.window.resetAt } as const;
      for (const r of rows) {
        await db.execute(
          'UPDATE provider_quota_windows SET consumed = consumed + ? WHERE provider_id = ? AND window_id = ?',
          [cost, r.window.providerId, r.window.windowId],
        );
      }
      return {
        allowed: true,
        consumed: Math.max(...rows.map(r => r.consumed + cost)),
        remaining: Math.min(...rows.map(r => r.cap - r.consumed - cost)),
      } as const;
    });
  }
}
