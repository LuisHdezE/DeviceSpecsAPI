import { operationalLimit, type QuotaDecision, type QuotaLedger, type QuotaWindow } from '../../domain/quotas/quota.js';

export interface SqlClient {
  query<T extends Record<string, unknown>>(sql: string, values?: readonly unknown[]): Promise<{ rows: T[] }>;
}
export interface TransactionRunner {
  transaction<T>(work: (client: SqlClient) => Promise<T>): Promise<T>;
}
type StoredWindow = { consumed: number; reset_at_ms: number; limit_value: number; reserve_value: number };

/**
 * Production ledger SQL algorithm. Requires a real PostgreSQL-backed
 * TransactionRunner that uses one DB connection for BEGIN/COMMIT/ROLLBACK.
 * Never substitute a non-transactional client.
 */
export class PostgresQuotaLedger implements QuotaLedger {
  constructor(private readonly database: TransactionRunner) {}

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
        // ON CONFLICT handles concurrent first creation; followed by row lock.
        await db.query(
          'INSERT INTO provider_quota_windows (provider_id, window_id, reset_at_ms, limit_value, reserve_value, consumed) VALUES ($1,$2,$3,$4,$5,0) ON CONFLICT (provider_id, window_id) DO NOTHING',
          [w.providerId, w.windowId, w.resetAt.getTime(), w.limit, w.reserve],
        );
        const result = await db.query<StoredWindow>(
          'SELECT consumed, reset_at_ms, limit_value, reserve_value FROM provider_quota_windows WHERE provider_id=$1 AND window_id=$2 FOR UPDATE',
          [w.providerId, w.windowId],
        );
        const row = result.rows[0];
        if (!row || Number(row.reset_at_ms) !== w.resetAt.getTime() ||
            Number(row.limit_value) !== w.limit || Number(row.reserve_value) !== w.reserve)
          return { allowed: false, reason: 'invalid_window' } as const;
        rows.push({ window: w, consumed: Number(row.consumed), cap: operationalLimit(w) });
      }
      const denied = rows.find(r => !Number.isSafeInteger(r.consumed) ||
        r.consumed < 0 || r.consumed + cost > r.cap);
      if (denied) return { allowed: false, reason: 'reserved', resetAt: denied.window.resetAt } as const;

      for (const r of rows) {
        await db.query('UPDATE provider_quota_windows SET consumed=consumed+$3 WHERE provider_id=$1 AND window_id=$2',
          [r.window.providerId, r.window.windowId, cost]);
      }
      return {
        allowed: true, consumed: Math.max(...rows.map(r => r.consumed + cost)),
        remaining: Math.min(...rows.map(r => r.cap - r.consumed - cost)),
      } as const;
    });
  }
}
