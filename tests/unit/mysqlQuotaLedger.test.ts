import { describe, expect, it, vi } from 'vitest';
import { MysqlQuotaLedger, type MysqlTransactionRunner } from '../../src/infrastructure/quotas/mysqlQuotaLedger.js';
import type { QuotaWindow } from '../../src/domain/quotas/quota.js';

const quota: QuotaWindow = { providerId: 'gsmarena', windowId: 'day-20261015', limit: 15, reserve: 8, resetAt: new Date('2026-10-16T00:00:00Z') };
const now = new Date('2026-10-15T12:00:00Z');

describe('MysqlQuotaLedger', () => {
  it('never opens a transaction for missing windows', async () => {
    const transaction = vi.fn();
    const ledger = new MysqlQuotaLedger({ transaction } as unknown as MysqlTransactionRunner);
    expect((await ledger.reserve([], 1, now)).allowed).toBe(false);
    expect(transaction).not.toHaveBeenCalled();
  });

  it('rejects duplicate and expired windows before database access', async () => {
    const transaction = vi.fn();
    const ledger = new MysqlQuotaLedger({ transaction } as unknown as MysqlTransactionRunner);
    expect((await ledger.reserve([quota, quota], 1, now)).allowed).toBe(false);
    expect((await ledger.reserve([{ ...quota, resetAt: now }], 1, now)).allowed).toBe(false);
    expect(transaction).not.toHaveBeenCalled();
  });

  it('rejects unexpected quota policy without UPDATE', async () => {
    const statements: string[] = [];
    const runner: MysqlTransactionRunner = {
      transaction: async work => work({
        execute: async <T extends Record<string, unknown>>(sql: string): Promise<readonly T[]> => {
          statements.push(sql);
          const rows = sql.startsWith('SELECT')
            ? [{ consumed: 0, reset_at_ms: quota.resetAt.getTime(), limit_value: 16, reserve_value: 8 }]
            : [];
          return rows as unknown as readonly T[];
        },
      }),
    };
    expect((await new MysqlQuotaLedger(runner).reserve([quota], 1, now)).allowed).toBe(false);
    expect(statements.some(sql => sql.startsWith('UPDATE'))).toBe(false);
  });

  it('debits one attempt under the seven-request operational cap', async () => {
    const statements: string[] = [];
    const runner: MysqlTransactionRunner = {
      transaction: async work => work({
        execute: async <T extends Record<string, unknown>>(sql: string): Promise<readonly T[]> => {
          statements.push(sql);
          const rows = sql.startsWith('SELECT')
            ? [{ consumed: 6, reset_at_ms: quota.resetAt.getTime(), limit_value: 15, reserve_value: 8 }]
            : [];
          return rows as unknown as readonly T[];
        },
      }),
    };
    const answer = await new MysqlQuotaLedger(runner).reserve([quota], 1, now);
    expect(answer.allowed).toBe(true);
    expect(statements.filter(sql => sql.startsWith('UPDATE'))).toHaveLength(1);
  });
});
