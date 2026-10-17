import { describe, expect, it } from 'vitest';
import { FirestoreQuotaLedger, type FirestoreQuotaDatabase, type FirestoreDocumentRef, type FirestoreTransaction } from '../../src/infrastructure/quotas/firestoreQuotaLedger.js';
import type { QuotaWindow } from '../../src/domain/quotas/quota.js';

const now = new Date('2026-10-15T12:00:00Z');
const window = (windowId = 'day-20261015', limit = 15): QuotaWindow => ({
  providerId: 'gsmarena', windowId, limit, reserve: 8, resetAt: new Date('2026-10-16T00:00:00Z'),
});

/** A shared serializable fake, exercising read-before-write and transaction rollback. */
class FakeFirestore implements FirestoreQuotaDatabase {
  readonly records = new Map<string, Record<string, unknown>>();
  private queue: Promise<void> = Promise.resolve();
  readonly collection = (path: string) => ({ doc: (id: string) => ({ id: path + '/' + id, get: async () => this.snapshot(path + '/' + id) }) });
  private snapshot(id: string) {
    const data = this.records.get(id);
    return { exists: !!data, data: () => data ? { ...data } : undefined };
  }
  runTransaction<T>(work: (tx: FirestoreTransaction) => Promise<T>): Promise<T> {
    const task = this.queue.then(async () => {
      let writing = false;
      const writes: Array<() => void> = [];
      const tx: FirestoreTransaction = {
        get: async ref => {
          if (writing) throw new Error('Reads after writes are disallowed');
          return this.snapshot((ref as FirestoreDocumentRef & { id: string }).id);
        },
        create: (ref, data) => {
          writing = true;
          const id = (ref as FirestoreDocumentRef & { id: string }).id;
          writes.push(() => { if (this.records.has(id)) throw new Error('already exists'); this.records.set(id, { ...data }); });
          return tx;
        },
        update: (ref, data) => {
          writing = true;
          const id = (ref as FirestoreDocumentRef & { id: string }).id;
          writes.push(() => this.records.set(id, { ...this.records.get(id), ...data }));
          return tx;
        },
      };
      const result = await work(tx);
      for (const write of writes) write();
      return result;
    });
    this.queue = task.then(() => undefined, () => undefined);
    return task;
  }
}

describe('FirestoreQuotaLedger', () => {
  it('fails closed for invalid, duplicate, expired, and unreserved windows', async () => {
    const db = new FakeFirestore(), ledger = new FirestoreQuotaLedger(db);
    expect((await ledger.reserve([], 1, now)).allowed).toBe(false);
    expect((await ledger.reserve([window(), window()], 1, now)).allowed).toBe(false);
    expect((await ledger.reserve([{ ...window(), reserve: 0 }], 1, now)).allowed).toBe(false);
    expect((await ledger.reserve([{ ...window(), resetAt: now }], 1, now)).allowed).toBe(false);
    expect((await ledger.reserve([window()], 0, now)).allowed).toBe(false);
    expect(db.records.size).toBe(0);
  });

  it('keeps eight requests in reserve and prevents overbooking across instances', async () => {
    const db = new FakeFirestore(), one = new FirestoreQuotaLedger(db), two = new FirestoreQuotaLedger(db);
    const answers = await Promise.all(Array.from({ length: 150 }, (_, i) =>
      (i % 2 ? one : two).reserve([window()], 1, now)));
    expect(answers.filter(a => a.allowed)).toHaveLength(7);
    expect(answers.filter(a => !a.allowed)).toHaveLength(143);
    expect([...db.records.values()][0]?.consumed).toBe(7);
  });

  it('rejects all windows without partial debits if one window is exhausted', async () => {
    const db = new FakeFirestore(), ledger = new FirestoreQuotaLedger(db);
    const day = window('day'), month = window('month', 9);
    expect((await ledger.reserve([day, month], 1, now)).allowed).toBe(true);
    expect((await ledger.reserve([day, month], 1, now)).allowed).toBe(false);
    expect([...db.records.values()].map(r => r.consumed)).toEqual([1, 1]);
  });

  it('rejects policy changes on existing windows without decrementing counters', async () => {
    const db = new FakeFirestore(), ledger = new FirestoreQuotaLedger(db);
    expect((await ledger.reserve([window()], 1, now)).allowed).toBe(true);
    expect((await ledger.reserve([window('day-20261015', 16)], 1, now)).allowed).toBe(false);
    expect([...db.records.values()][0]?.consumed).toBe(1);
  });

  it('allows a new verified period to start a fresh counter', async () => {
    const db = new FakeFirestore(), ledger = new FirestoreQuotaLedger(db);
    await ledger.reserve([window('day-20261015')], 1, now);
    const next = { ...window('day-20261016'), resetAt: new Date('2026-10-17T00:00:00Z') };
    expect((await ledger.reserve([next], 1, new Date('2026-10-16T12:00:00Z'))).allowed).toBe(true);
    expect(db.records.size).toBe(2);
  });

  it('does not partially debit a fresh window when an existing window denies', async () => {
    const db = new FakeFirestore(), ledger = new FirestoreQuotaLedger(db);
    const exhausted = window('exhausted', 9);
    expect((await ledger.reserve([exhausted], 1, now)).allowed).toBe(true);
    const before = new Map(db.records);
    expect((await ledger.reserve([window('fresh'), exhausted], 1, now)).allowed).toBe(false);
    expect(db.records.size).toBe(before.size);
    expect([...db.records.values()][0]?.consumed).toBe(1);
  });

  it('denies impossible counters safely without a write', async () => {
    const db = new FakeFirestore(), ledger = new FirestoreQuotaLedger(db);
    await ledger.reserve([window()], 1, now);
    const [key] = db.records.keys();
    if (!key) throw new Error('Missing seeded quota');
    db.records.set(key, { ...db.records.get(key), consumed: Number.MAX_SAFE_INTEGER });
    expect((await ledger.reserve([window()], 1, now)).allowed).toBe(false);
    expect(db.records.get(key)?.consumed).toBe(Number.MAX_SAFE_INTEGER);
  });

  it('propagates datastore errors instead of granting quota', async () => {
    const db = new FakeFirestore();
    db.runTransaction = async () => { throw new Error('firestore unavailable'); };
    await expect(new FirestoreQuotaLedger(db).reserve([window()], 1, now)).rejects.toThrow('firestore unavailable');
  });
});
