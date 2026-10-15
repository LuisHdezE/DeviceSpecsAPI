# DSA-002B2 · MySQL cPanel quota ledger

**Decision:** Use a dedicated MySQL/InnoDB database on the user's hosting for provider quota counters and billing windows only. The service is independent of FixPhone and other consumers. No device specifications or consumer business data are stored here.

**Implemented on PR #7:** MySQL-dialect ledger algorithm using an injected transaction runner; ordered row locking via SELECT FOR UPDATE; insert-if-absent and all-or-nothing update; migration SQL and unit tests.

**Not ready for production:** mysql2/promise driver, actual pooled transaction runner, credentials through secrets, MySQL/MariaDB version verification, real integration tests on two separate connections, network connectivity from Cloud Run, TLS validation and safe egress are pending. Fail closed on connectivity issues; do not fall back to in-memory counters. Do not enable external providers before these checks.

## Deployment safety

The supplied screenshot shows cPanel Remote Database Access and an already listed IP. It does NOT prove that this address is Cloud Run's egress IP or that remote connections, TLS or credentials work.

Cloud Run's outbound IP is not guaranteed static by default. Do not authorize wildcard '%' or use an arbitrary IP from the screenshot. A stable and allowlisted egress path may require additional Google Cloud infrastructure with billing implications; verify this against the zero-cost requirement before provisioning anything.

Create separate least-privilege database/user with SELECT, INSERT, UPDATE privileges for counters; apply migration with an admin account. Keep DB host, user and password in runtime secrets, never git. Test that InnoDB transaction isolation and row locking are supported on the specific hosting version. Add strict timeouts, minimal pool connections, and TLS with certificate validation.

MySQL is only an internal infrastructure adapter. Public REST endpoints and response semantics must remain storage-agnostic.
