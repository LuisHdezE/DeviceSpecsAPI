-- Apply through an authorized migration runner before enabling a provider.
-- Window identities MUST include the documented billing period; never recycle an ID.
CREATE TABLE IF NOT EXISTS provider_quota_windows (
  provider_id TEXT NOT NULL,
  window_id TEXT NOT NULL,
  reset_at_ms BIGINT NOT NULL CHECK (reset_at_ms > 0),
  limit_value INTEGER NOT NULL CHECK (limit_value >= 0),
  reserve_value INTEGER NOT NULL CHECK (reserve_value >= 0),
  consumed INTEGER NOT NULL DEFAULT 0 CHECK (consumed >= 0),
  PRIMARY KEY (provider_id, window_id)
);
