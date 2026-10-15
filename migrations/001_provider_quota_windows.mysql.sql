-- MySQL 8+/MariaDB with InnoDB; deploy only after verification.
-- A window_id must uniquely represent a documented quota period.
CREATE TABLE IF NOT EXISTS provider_quota_windows (
  provider_id VARCHAR(100) NOT NULL,
  window_id VARCHAR(150) NOT NULL,
  reset_at_ms BIGINT NOT NULL,
  limit_value INT NOT NULL,
  reserve_value INT NOT NULL,
  consumed INT NOT NULL DEFAULT 0,
  PRIMARY KEY (provider_id, window_id),
  CONSTRAINT chk_limit_value CHECK (limit_value >= 0),
  CONSTRAINT chk_reserve_value CHECK (reserve_value >= 0),
  CONSTRAINT chk_consumed CHECK (consumed >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
