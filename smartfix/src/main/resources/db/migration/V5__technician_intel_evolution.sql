-- SmartFix Technician Intelligence evolution (run manually if not using Flyway, or enable Flyway in Spring Boot)
-- Safe re-run: uses IF NOT EXISTS where supported

ALTER TABLE repair_cases
    ADD COLUMN IF NOT EXISTS inspection_notes TEXT;

CREATE INDEX IF NOT EXISTS idx_repair_cases_status ON repair_cases (repair_status);
CREATE INDEX IF NOT EXISTS idx_repair_cases_repair_date ON repair_cases (repair_date DESC);
CREATE INDEX IF NOT EXISTS idx_repair_cases_device_type ON repair_cases (device_type);
CREATE INDEX IF NOT EXISTS idx_repair_cases_brand ON repair_cases (brand);
CREATE INDEX IF NOT EXISTS idx_repair_cases_returned ON repair_cases (returned_after_repair);

-- Optional normalized analytics (populate later via batch job if desired)
CREATE TABLE IF NOT EXISTS repair_pattern_history (
    id              BIGSERIAL PRIMARY KEY,
    pattern_key     VARCHAR(512) NOT NULL,
    device_type     VARCHAR(100),
    support_count   INT NOT NULL DEFAULT 0,
    return_count    INT NOT NULL DEFAULT 0,
    last_seen       TIMESTAMP NOT NULL DEFAULT NOW(),
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (pattern_key, device_type)
);

CREATE TABLE IF NOT EXISTS component_failure_history (
    id                      BIGSERIAL PRIMARY KEY,
    repair_case_id          BIGINT NOT NULL REFERENCES repair_cases (case_id) ON DELETE CASCADE,
    part_name               VARCHAR(255) NOT NULL,
    returned_after_repair   BOOLEAN NOT NULL DEFAULT FALSE,
    recorded_at             TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cfh_case ON component_failure_history (repair_case_id);
CREATE INDEX IF NOT EXISTS idx_cfh_part ON component_failure_history (part_name);

CREATE TABLE IF NOT EXISTS repair_statistics (
    id                BIGSERIAL PRIMARY KEY,
    stat_key          VARCHAR(128) NOT NULL,
    stat_scope        VARCHAR(64) NOT NULL,
    metric_value      DOUBLE PRECISION NOT NULL,
    sample_size       INT NOT NULL,
    period_start      DATE,
    period_end        DATE,
    updated_at        TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (stat_key, stat_scope, period_start, period_end)
);
