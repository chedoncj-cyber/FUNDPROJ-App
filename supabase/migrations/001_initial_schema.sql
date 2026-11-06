-- ============================================================
-- FUNDPROJ APP — Supabase / PostgreSQL Database Schema
-- Version: 1.0.0 | Date: 2026-11-05
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- INDIVIDUALS / MEMBERS
-- ============================================================
CREATE TABLE individuals (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fundproj_id     VARCHAR(10) UNIQUE NOT NULL,   -- Format: FP-00001
    first_name      VARCHAR(100) NOT NULL,
    last_name       VARCHAR(100) NOT NULL,
    email           VARCHAR(255) UNIQUE,
    phone           VARCHAR(30),
    role            VARCHAR(20) NOT NULL DEFAULT 'contributor'
                    CHECK (role IN ('contributor','owner','admin','vendor','student')),
    status          VARCHAR(20) NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active','inactive','suspended')),
    stripe_customer_id  VARCHAR(50),
    gocardless_customer_id VARCHAR(50),
    metadata        JSONB,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-assign fundproj_id (FP-00001, FP-00002, ...)
CREATE SEQUENCE fundproj_id_seq START 1;

CREATE OR REPLACE FUNCTION assign_fundproj_id()
RETURNS TRIGGER AS $$
BEGIN
    NEW.fundproj_id := 'FP-' || LPAD(nextval('fundproj_id_seq')::TEXT, 5, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_assign_fundproj_id
BEFORE INSERT ON individuals
FOR EACH ROW
WHEN (NEW.fundproj_id IS NULL OR NEW.fundproj_id = '')
EXECUTE FUNCTION assign_fundproj_id();

-- Always alphabetical view (last_name, first_name)
CREATE VIEW individuals_alphabetical AS
SELECT * FROM individuals
ORDER BY last_name ASC, first_name ASC;

-- ============================================================
-- PROJECTS
-- ============================================================
CREATE TABLE projects (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_code    VARCHAR(50) UNIQUE NOT NULL,   -- e.g. PROJ-WEDDING-001
    name            VARCHAR(200) NOT NULL,
    description     TEXT,
    project_type    VARCHAR(30) NOT NULL DEFAULT 'custom'
                    CHECK (project_type IN ('school','wedding','holiday','savings','custom')),
    target_amount   NUMERIC(15,2) NOT NULL,
    currency        CHAR(3) NOT NULL DEFAULT 'GBP',
    start_date      DATE NOT NULL,
    end_date        DATE,
    status          VARCHAR(20) NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active','funded','closed','paused')),
    visibility      VARCHAR(10) NOT NULL DEFAULT 'private'
                    CHECK (visibility IN ('private','public')),
    owner_id        UUID REFERENCES individuals(id),
    contribution_link VARCHAR(100) UNIQUE,
    metadata        JSONB,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- PROJECT MEMBERS (allocations)
-- ============================================================
CREATE TABLE project_members (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    individual_id   UUID NOT NULL REFERENCES individuals(id) ON DELETE CASCADE,
    target_amount   NUMERIC(15,2),          -- Individual's allocation in this project
    contribution_frequency VARCHAR(20) DEFAULT 'monthly'
                    CHECK (contribution_frequency IN ('weekly','monthly','quarterly','one-off')),
    enrolled_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status          VARCHAR(20) NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active','paused','completed','withdrawn')),
    UNIQUE (project_id, individual_id)
);

-- ============================================================
-- PAYMENT LEDGER (all transactions from all platforms)
-- ============================================================
CREATE TABLE payment_ledger (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    individual_id   UUID NOT NULL REFERENCES individuals(id),
    project_id      UUID NOT NULL REFERENCES projects(id),
    amount          NUMERIC(15,2) NOT NULL,
    currency        CHAR(3) NOT NULL DEFAULT 'GBP',
    payment_date    DATE NOT NULL,
    platform        VARCHAR(20) NOT NULL
                    CHECK (platform IN ('changoapp','stripe','gocardless','paypal','flutterwave','square','manual')),
    platform_ref    VARCHAR(100) UNIQUE NOT NULL,  -- Platform's own transaction ID
    status          VARCHAR(20) NOT NULL DEFAULT 'completed'
                    CHECK (status IN ('completed','pending','failed','refunded')),
    sync_batch_id   UUID,                           -- Which SFTP sync run created this
    raw_payload     JSONB,                          -- Original platform data
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payment_ledger_individual  ON payment_ledger(individual_id);
CREATE INDEX idx_payment_ledger_project     ON payment_ledger(project_id);
CREATE INDEX idx_payment_ledger_date        ON payment_ledger(payment_date);
CREATE INDEX idx_payment_ledger_platform    ON payment_ledger(platform);

-- ============================================================
-- UNMATCHED PAYMENTS (platform ref unknown / no matching member)
-- ============================================================
CREATE TABLE unmatched_payments (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    platform        VARCHAR(20) NOT NULL,
    platform_ref    VARCHAR(100) UNIQUE NOT NULL,
    member_ref_raw  VARCHAR(100),               -- What the platform sent
    amount          NUMERIC(15,2),
    currency        CHAR(3),
    payment_date    DATE,
    raw_payload     JSONB,
    resolved        BOOLEAN NOT NULL DEFAULT FALSE,
    resolved_at     TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- SUBSCRIPTIONS (recurring contributions)
-- ============================================================
CREATE TABLE subscriptions (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    individual_id       UUID NOT NULL REFERENCES individuals(id),
    project_id          UUID NOT NULL REFERENCES projects(id),
    platform            VARCHAR(20) NOT NULL,
    platform_sub_id     VARCHAR(100) UNIQUE NOT NULL,
    amount              NUMERIC(15,2) NOT NULL,
    currency            CHAR(3) NOT NULL DEFAULT 'GBP',
    frequency           VARCHAR(20) NOT NULL
                        CHECK (frequency IN ('weekly','monthly','quarterly')),
    status              VARCHAR(20) NOT NULL DEFAULT 'active'
                        CHECK (status IN ('active','paused','cancelled','past_due')),
    current_period_start DATE,
    current_period_end   DATE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- REVENUE RECOGNITION (ASC 606 / IFRS 15)
-- ============================================================

-- Deferred revenue ledger per member per project
CREATE TABLE deferred_revenue (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id      UUID NOT NULL REFERENCES projects(id),
    individual_id   UUID NOT NULL REFERENCES individuals(id),
    payment_id      UUID NOT NULL REFERENCES payment_ledger(id),
    deferred_amount NUMERIC(15,2) NOT NULL,       -- Original amount deferred
    recognised_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
    remaining_amount  NUMERIC(15,2) GENERATED ALWAYS AS (deferred_amount - recognised_amount) STORED,
    currency        CHAR(3) NOT NULL DEFAULT 'GBP',
    recognition_method VARCHAR(30) NOT NULL DEFAULT 'straight-line'
                    CHECK (recognition_method IN ('straight-line','milestone','percentage','immediate')),
    schedule_start  DATE NOT NULL,
    schedule_end    DATE,
    pob_type        VARCHAR(50),                   -- Performance Obligation type
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Recognition schedule entries (immutable audit trail)
CREATE TABLE revrec_schedule (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    deferred_id     UUID NOT NULL REFERENCES deferred_revenue(id),
    project_id      UUID NOT NULL REFERENCES projects(id),
    individual_id   UUID NOT NULL REFERENCES individuals(id),
    period_start    DATE NOT NULL,
    period_end      DATE NOT NULL,
    amount_to_recognise NUMERIC(15,2) NOT NULL,
    amount_recognised   NUMERIC(15,2) NOT NULL DEFAULT 0,
    status          VARCHAR(20) NOT NULL DEFAULT 'scheduled'
                    CHECK (status IN ('scheduled','released','reversed')),
    released_at     TIMESTAMPTZ,
    released_by     UUID,                          -- Admin who triggered release
    journal_ref     VARCHAR(100),                  -- GL journal reference
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_revrec_schedule_project  ON revrec_schedule(project_id);
CREATE INDEX idx_revrec_schedule_period   ON revrec_schedule(period_start, period_end);

-- ============================================================
-- PROJECT FUNDING SUMMARY (materialised view / cache)
-- ============================================================
CREATE TABLE project_funding_summary (
    project_id      UUID PRIMARY KEY REFERENCES projects(id),
    total_raised    NUMERIC(15,2) NOT NULL DEFAULT 0,
    total_members   INTEGER NOT NULL DEFAULT 0,
    deferred_balance NUMERIC(15,2) NOT NULL DEFAULT 0,
    recognised_revenue NUMERIC(15,2) NOT NULL DEFAULT 0,
    last_payment_date DATE,
    last_sync_at    TIMESTAMPTZ,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- SFTP SYNC LOG
-- ============================================================
CREATE TABLE sftp_sync_log (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    platform        VARCHAR(20) NOT NULL,
    sync_started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    sync_ended_at   TIMESTAMPTZ,
    status          VARCHAR(20) NOT NULL DEFAULT 'running'
                    CHECK (status IN ('running','success','partial','failed')),
    records_downloaded INTEGER NOT NULL DEFAULT 0,
    records_inserted   INTEGER NOT NULL DEFAULT 0,
    records_skipped    INTEGER NOT NULL DEFAULT 0,     -- duplicates
    records_unmatched  INTEGER NOT NULL DEFAULT 0,
    file_name       VARCHAR(255),
    error_message   TEXT,
    triggered_by    VARCHAR(20) NOT NULL DEFAULT 'cron'
                    CHECK (triggered_by IN ('cron','manual','api'))
);

-- ============================================================
-- AUDIT LOG (all data changes)
-- ============================================================
CREATE TABLE audit_log (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_name      VARCHAR(100) NOT NULL,
    record_id       UUID NOT NULL,
    action          VARCHAR(10) NOT NULL CHECK (action IN ('INSERT','UPDATE','DELETE')),
    changed_by      UUID,
    old_values      JSONB,
    new_values      JSONB,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- HELPER: Project funding balance view
-- ============================================================
CREATE VIEW v_member_project_balance AS
SELECT
    pm.project_id,
    pm.individual_id,
    i.fundproj_id,
    i.last_name || ', ' || i.first_name AS member_name,
    pm.target_amount AS allocated_amount,
    COALESCE(SUM(pl.amount) FILTER (WHERE pl.status = 'completed'), 0) AS total_paid,
    pm.target_amount - COALESCE(SUM(pl.amount) FILTER (WHERE pl.status = 'completed'), 0) AS outstanding
FROM project_members pm
JOIN individuals i ON pm.individual_id = i.id
LEFT JOIN payment_ledger pl ON pl.individual_id = pm.individual_id
                            AND pl.project_id = pm.project_id
GROUP BY pm.project_id, pm.individual_id, i.fundproj_id, i.last_name, i.first_name, pm.target_amount
ORDER BY i.last_name ASC, i.first_name ASC;
