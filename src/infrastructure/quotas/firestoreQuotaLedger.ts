import { createHash } from 'node:crypto';
import { operationalLimit, type QuotaDecision, type QuotaLedger, type QuotaWindow } from '../../domain/quotas/quota.js';

type Snapshot = { exists: boolean; data(): Record<string, unknown> | undefined };
export interface FirestoreDocumentRef {
  get(): Promise<Snapshot>;
}
export interface FirestoreTransaction {
  get(ref: FirestoreDocumentRef): Promise<Snapshot>;
  create(ref: FirestoreDocumentRef, data: Record<string, unknown>): FirestoreTransaction;
  update(ref: FirestoreDocumentRef, data: Record<string, unknown>): FirestoreTransaction;
}
export interface FirestoreQuotaDatabase {
  collection(path: string): { doc(id: string): FirestoreDocumentRef };
  runTransaction<T>(work: (tx: FirestoreTransaction) => Promise<T>): Promise<T>;
}

type Stored = { consumed: number; resetAtMs: number; limit: number; reserve: number };
const validStored = (v: Record<string, unknown> | undefined): v is Stored =>
  !!v && Number.isSafeInteger(v.consumed) && (v.consumed as number) >= 0 &&
  Number.isSafeInteger(v.resetAtMs) && Number.isSafeInteger(v.limit) && Number.isSafeInteger(v.reserve);

/** Shared Cloud Firestore transaction: read ALL windows before writing ANY window. */
export class FirestoreQuotaLedger implements QuotaLedger {
  constructor(private readonly db: FirestoreQuotaDatabase) {}

  async reserve(windows: readonly QuotaWindow[], cost: number, at: Date): Promise<QuotaDecision> {
    if (!windows.length || !Number.isSafeInteger(cost) || cost <= 0 || !Number.isFinite(at.getTime()))
      return { allowed: false, reason: 'invalid_window' };
    const seen = new Set<string>();
    const sorted = [...windows].sort((a, b) => a.providerId.localeCompare(b.providerId) || a.windowId.localeCompare(b.windowId));
    for (const w of sorted) {
      const key = JSON.stringify([w.providerId, w.windowId]);
      if (seen.has(key) || !w.providerId.trim() || !w.windowId.trim() ||
        !Number.isFinite(w.resetAt.getTime()) || !Number.isSafeInteger(w.resetAt.getTime()) ||
        w.reserve !== 8 || w.providerId.length > 128 || w.windowId.length > 256)
        return { allowed: false, reason: 'invalid_window' };
      seen.add(key);
      try { operationalLimit(w); } catch { return { allowed: false, reason: 'invalid_window' }; }
      if (w.resetAt.getTime() <= at.getTime()) return { allowed: false, reason: 'expired', resetAt: w.resetAt };
    }

    // Firestore retries transaction callbacks on conflicts. Never do external HTTP inside one.
    // Errors propagate: callers MUST fail closed, never fall back to memory.
    return this.db.runTransaction(async tx => {
      const rows: Array<{ ref: FirestoreDocumentRef; stored: Stored | null; window: QuotaWindow; cap: number }> = [];
      for (const w of sorted) {
        const id = createHash('sha256').update(JSON.stringify([w.providerId, w.windowId])).digest('hex');
        const ref = this.db.collection('provider_quota_windows').doc(id);
        const snap = await tx.get(ref);
        const value = snap.exists ? snap.data() : undefined;
        if (snap.exists && (!validStored(value) || value.resetAtMs !== w.resetAt.getTime() ||
          value.limit !== w.limit || value.reserve !== w.reserve))
          return { allowed: false, reason: 'invalid_window' } as const;
        rows.push({ ref, stored: snap.exists ? value as Stored : null, window: w, cap: operationalLimit(w) });
      }

      const denied = rows.find(r => (r.stored?.consumed ?? 0) + cost > r.cap);
      if (denied) return { allowed: false, reason: 'reserved', resetAt: denied.window.resetAt } as const;
      for (const r of rows) {
        const consumed = (r.stored?.consumed ?? 0) + cost;
        if (r.stored) tx.update(r.ref, { consumed });
        else tx.create(r.ref, {
          providerId: r.window.providerId, windowId: r.window.windowId,
          consumed, resetAtMs: r.window.resetAt.getTime(),
          limit: r.window.limit, reserve: r.window.reserve,
        });
      }
      return {
        allowed: true,
        consumed: Math.max(...rows.map(r => (r.stored?.consumed ?? 0) + cost)),
        remaining: Math.min(...rows.map(r => r.cap - (r.stored?.consumed ?? 0) - cost)),
      } as const;
    });
  }
}
