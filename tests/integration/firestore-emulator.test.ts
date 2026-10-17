import { createHash, randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { FirestoreQuotaLedger, type FirestoreQuotaDatabase } from '../../src/infrastructure/quotas/firestoreQuotaLedger.js';
import type { QuotaWindow } from '../../src/domain/quotas/quota.js';

const emulatorHost = process.env.FIRESTORE_EMULATOR_HOST;
const describeEmulator = emulatorHost ? describe : describe.skip;

// Requires an explicitly running Firestore emulator and the official SDK.
// Never points to production: the guard rejects absent emulator configuration.
describeEmulator('FirestoreQuotaLedger against real Firestore emulator', () => {
  it('is atomic under concurrent attempts from separate client instances', async () => {
    if (!process.env.FIRESTORE_EMULATOR_HOST) throw new Error('Emulator required');
    const sdkName = '@google-cloud/firestore';
    const { Firestore } = await import(sdkName);
    const projectId = 'demo-devicespecsapi-quota';
    const first = new Firestore({ projectId });
    const second = new Firestore({ projectId });
    const suffix = randomUUID();
    const providerId = 'integration';
    const windowId = 'daily-' + suffix;
    const resetAt = new Date('2030-01-01T00:00:00.000Z');
    const at = new Date('2029-12-31T12:00:00.000Z');
    const quota: QuotaWindow = { providerId, windowId, resetAt, limit: 15, reserve: 8 };
    const a = new FirestoreQuotaLedger(first as unknown as FirestoreQuotaDatabase);
    const b = new FirestoreQuotaLedger(second as unknown as FirestoreQuotaDatabase);
    const id = createHash('sha256').update(JSON.stringify([providerId, windowId])).digest('hex');
    try {
      const results = await Promise.all(Array.from({ length: 30 }, (_, i) =>
        (i % 2 ? a : b).reserve([quota], 1, at)));
      expect(results.filter(r => r.allowed)).toHaveLength(7);
      const stored = await first.collection('provider_quota_windows').doc(id).get();
      expect(stored.data()?.consumed).toBe(7);
    } finally {
      await first.collection('provider_quota_windows').doc(id).delete();
      await Promise.all([first.terminate(), second.terminate()]);
    }
  }, 60000);
});
