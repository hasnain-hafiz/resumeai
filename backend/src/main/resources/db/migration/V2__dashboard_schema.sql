-- ================================================================
-- V2__dashboard_schema.sql
-- Feature: Dashboard
--
-- The Dashboard needs to count/list resumes, cover letters, ATS
-- analyses, AI usage, and recent activity - but the Resume Builder,
-- Cover Letter, ATS Optimizer and AI features haven't been built yet.
--
-- Rather than mock this data, we create the minimal real tables each
-- of those features will own and extend. This migration owns exactly
-- the columns Dashboard needs today (id, user, title, timestamps).
-- When "Resume Builder" ships, it adds a V4+ migration with
-- `ALTER TABLE resumes ADD COLUMN ...` for template_id, content, etc.
-- - it does NOT redefine this table. Same for the other three.
-- ================================================================

-- ----------------------------------------------------------------
-- resumes (minimal - Resume Builder feature will extend this)
-- ----------------------------------------------------------------
CREATE TABLE resumes (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    title       VARCHAR(200) NOT NULL DEFAULT 'Untitled Resume',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at  TIMESTAMPTZ
);

CREATE INDEX idx_resumes_user_id ON resumes (user_id);

-- ----------------------------------------------------------------
-- cover_letters (minimal - AI Cover Letter Generator feature will extend this)
-- ----------------------------------------------------------------
CREATE TABLE cover_letters (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    title       VARCHAR(200) NOT NULL DEFAULT 'Untitled Cover Letter',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at  TIMESTAMPTZ
);

CREATE INDEX idx_cover_letters_user_id ON cover_letters (user_id);

-- ----------------------------------------------------------------
-- ats_analyses (minimal - AI ATS Optimizer feature will extend this)
-- ----------------------------------------------------------------
CREATE TABLE ats_analyses (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    resume_id   UUID REFERENCES resumes (id) ON DELETE SET NULL,
    score       INTEGER,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at  TIMESTAMPTZ,

    CONSTRAINT ck_ats_analyses_score_range CHECK (score IS NULL OR (score BETWEEN 0 AND 100))
);

CREATE INDEX idx_ats_analyses_user_id ON ats_analyses (user_id);

-- ----------------------------------------------------------------
-- ai_usage_logs (one row per AI generation call, across every AI feature)
-- ----------------------------------------------------------------
CREATE TABLE ai_usage_logs (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    feature     VARCHAR(40) NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at  TIMESTAMPTZ,

    CONSTRAINT ck_ai_usage_logs_feature CHECK (feature IN (
        'SUMMARY_GENERATOR', 'EXPERIENCE_WRITER', 'PROJECT_GENERATOR', 'SKILLS_GENERATOR',
        'ATS_OPTIMIZER', 'RESUME_REVIEW', 'JOB_MATCHER', 'COVER_LETTER_GENERATOR',
        'LINKEDIN_OPTIMIZER', 'INTERVIEW_COACH', 'CAREER_ROADMAP'
    ))
);

CREATE INDEX idx_ai_usage_logs_user_id_created_at ON ai_usage_logs (user_id, created_at);

-- ----------------------------------------------------------------
-- activity_events (append-only feed powering "Recent activity";
-- any feature can write to this via ActivityEventService)
-- ----------------------------------------------------------------
CREATE TABLE activity_events (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    type        VARCHAR(40) NOT NULL,
    title       VARCHAR(255) NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at  TIMESTAMPTZ,

    CONSTRAINT ck_activity_events_type CHECK (type IN (
        'ACCOUNT_CREATED', 'PROFILE_UPDATED', 'RESUME_CREATED', 'COVER_LETTER_CREATED',
        'ATS_ANALYSIS_RUN', 'AI_FEATURE_USED'
    ))
);

CREATE INDEX idx_activity_events_user_id_created_at ON activity_events (user_id, created_at DESC);
