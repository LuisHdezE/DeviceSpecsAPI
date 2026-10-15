import { describe, expect, it } from 'vitest';
import { QuotaGuard } from '../../src/application/quotas/quotaGuard.js';
import { InMemoryQuotaLedger } from '../../src/infrastructure/quotas/inMemoryQuotaLedger.js';
import type { QuotaWindow } from '../../src/domain/quotas/quota.js';
const now = new Date('2026-10-15T10:00:00Z');
const window = (id: string, limit: number, reserve = 8, resetAt = new Date('2026-10-16T00:00:00Z')): QuotaWindow =>
  ({ providerId: 'gsmarena', windowId: id, limit, reserve, resetAt });
describe('QuotaGuard', () => {
  it('allows exactly seven out of fifteen', async () => {
    const guard = new QuotaGuard(new InMemoryQuotaLedger(), () => now);
    const results = await Promise.all(Array.from({ length: 20 }, () => guard.allowAttempt([window('day', 15)])));
    expect(results.filter(x => x.allowed)).toHaveLength(7);
  });
  it('reserves all eight if quota is eight', async () => {
    const guard = new QuotaGuard(new InMemoryQuotaLedger(), () => now);
    expect((await guard.allowAttempt([window('day', 8)])).allowed).toBe(false);
  });
  it('atomically rejects when any window is exhausted', async () => {
    const guard = new QuotaGuard(new InMemoryQuotaLedger(), () => now);
    expect((await guard.allowAttempt([window('day', 9), window('month', 8)])).allowed).toBe(false);
    expect((await guard.allowAttempt([window('day', 9)])).allowed).toBe(true);
  });
  it('fails closed for missing windows, costs and duplicates', async () => {
    const guard = new QuotaGuard(new InMemoryQuotaLedger(), () => now);
    expect((await guard.allowAttempt([])).allowed).toBe(false);
    expect((await guard.allowAttempt([window('day', 15)], 0)).allowed).toBe(false);
    expect((await guard.allowAttempt([window('day', 15), window('day', 15)])).allowed).toBe(false);
  });
  it('rejects expired and inconsistent reset windows', async () => {
    const guard = new QuotaGuard(new InMemoryQuotaLedger(), () => now);
    expect((await guard.allowAttempt([window('old', 15, 8, new Date('2026-10-14T00:00:00Z'))])).allowed).toBe(false);
    await guard.allowAttempt([window('day', 15)]);
    expect((await guard.allowAttempt([window('day', 15, 8, new Date('2026-10-17T00:00:00Z'))])).allowed).toBe(false);
  });
  it('enforces quota under 150 concurrent requests', async () => {
    const guard = new QuotaGuard(new InMemoryQuotaLedger(), () => now);
    const results = await Promise.all(Array.from({ length: 150 }, () => guard.allowAttempt([window('day', 23)])));
    expect(results.filter(x => x.allowed)).toHaveLength(15);
  });
});
