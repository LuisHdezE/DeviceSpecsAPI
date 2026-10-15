# DSA-002B2 · Cloud Firestore quota ledger

Decision (2026-10-15): Cloud Firestore is the durable, shared counter store for DeviceSpecsAPI on Google Cloud Run. MySQL/PostgreSQL are **not** part of this architecture.

`FirestoreQuotaLedger` uses `runTransaction` and document reads before all writes. It reserves all provider windows or none. A deterministic SHA-256 ID derived from [providerId, windowId] prevents collisions and unsafe Firestore path characters. New documented periods use new window IDs, never reset a live counter. Config mismatch is denied. Every window requires a safety reserve of **8**, yielding max(0, limit - 8) permitted attempts. Database failures propagate and must fail closed. Provider HTTP calls must run **after** a successful transaction, never within a retriable transaction callback.

## Integration boundary

The adapter exposes small structural Firestore interfaces and accepts an injected Firestore client with compatible `collection().doc()` and `runTransaction()` API. This PR intentionally does not initialize credentials or enable providers. A future composition-root change must install the Firestore SDK, use Cloud Run workload identity / Application Default Credentials, and instantiate the adapter; no service account JSON keys belong in the repository. Cloud Firestore database/project creation, IAM minimum privileges and billing/free-tier limits must be confirmed before deployment.

## Tests and remaining gates

Unit tests exercise reserve=8, 150 concurrent calls sharing a fake store, multi-window denial, policy mismatch, window renewal and datastore errors. The fake serializes all transactions; it is **not** an emulator or real multi-process test. Before production: run Firestore emulator integration tests and independent-client contention tests, verify SDK types, CI and Firestore limits/costs; configure project and database explicitly. Never substitute InMemoryQuotaLedger in Cloud Run. No merges or deployments without explicit approval.
