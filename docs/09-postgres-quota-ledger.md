# DSA-002B2 · PostgreSQL ledger

Implemented: PostgreSQL SQL migration and ledger using an injected transaction runner, multi-window ordered row locks, insertion with ON CONFLICT, policy mismatch fail-closed and atomic updates. Unit tests validate defensive behavior.

**Not production ready yet:** no PostgreSQL driver/pool or migration runner wired into app bootstrap; integration tests against a real PostgreSQL server and distinct connections, database provisioning, migration execution and CI checks are still required. Do not expose live providers or claim inter-instance safety verified until these complete.

The injected TransactionRunner must obtain one transaction-scoped connection, use BEGIN, roll back on thrown errors, COMMIT only once on completion, and close/release the connection in finally. Transaction isolation READ COMMITTED with SELECT FOR UPDATE is required at minimum. Retryable deadlocks, connection loss and DB unavailability must fail closed, never fall back to InMemoryQuotaLedger. No sensitive credentials in repository.

Operational note: changes of quota policy within an active window will produce invalid_window and require explicit migration/rollover. Window IDs identify one billing window uniquely.
