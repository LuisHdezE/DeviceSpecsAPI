import { describe, expect, it, vi } from 'vitest';
import { PostgresQuotaLedger, type TransactionRunner } from '../../src/infrastructure/quotas/postgresQuotaLedger.js';
import type { QuotaWindow } from '../../src/domain/quotas/quota.js';
const w: QuotaWindow = { providerId: 'gsm', windowId: '2026-10-15', limit: 15, reserve: 8, resetAt: new Date('2026-10-16T00:00:00Z') };
const now = new Date('2026-10-15T12:00:00Z');
describe('PostgresQuotaLedger defensive validation', () => {
  it('does not open a transaction without configured windows', async () => {
    const transaction = vi.fn();
    const ledger = new PostgresQuotaLedger({ transaction } as unknown as TransactionRunner);
    expect((await ledger.reserve([], 1, now)).allowed).toBe(false);
    expect(transaction).not.toHaveBeenCalled();
  });
  it('denies expired or duplicate windows before DB access', async () => {
    const transaction = vi.fn();
    const ledger = new PostgresQuotaLedger({ transaction } as unknown as TransactionRunner);
    expect((await ledger.reserve([w, w], 1, now)).allowed).toBe(false);
    expect((await ledger.reserve([{ ...w, resetAt: now }], 1, now)).allowed).toBe(false);
    expect(transaction).not.toHaveBeenCalled();
  });
  it('does not debit if an active window policy is changed', async () => {
    const sql: string[] = [];
    const db: TransactionRunner = {
      transaction: async work => work({ query: async <T extends Record<string, unknown>>(query: string): Promise<{ rows: T[] }> => {
        sql.push(query);
        return { rows: query.startsWith('SELECT') ?
          [{ consumed: 0, reset_at_ms: w.resetAt.getTime(), limit_value: 16, reserve_value: 8 }] : []) as unknown as T[] };
      } }),
    };
    expect((await new PostgresQuotaLedger(db).reserve([w], 1, now)).allowed).toBe(false);
    expect(sql.some(s => s.startsWith('UPDATE'))).toBe(false);
  });
});
