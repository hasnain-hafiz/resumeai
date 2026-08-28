-- ================================================================
-- V4__resume_templates_schema.sql
-- Feature: Resume Templates
--
-- The catalog table stores only identity/display metadata (key, name,
-- category, ATS-friendliness, ordering) - it is deliberately NOT where the
-- visual design lives. Fonts, colors, and layout structure are frontend
-- concerns, keyed off `key`, so a template's look can be iterated on
-- without a migration. This table exists so the catalog can be listed,
-- and so a resume can reference which one it's using - and so a future
-- Admin Dashboard feature has something to manage.
-- ================================================================

CREATE TABLE resume_templates (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key              VARCHAR(60) NOT NULL,
    name             VARCHAR(100) NOT NULL,
    category         VARCHAR(30) NOT NULL,
    is_ats_friendly  BOOLEAN NOT NULL DEFAULT FALSE,
    is_active        BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order       INTEGER NOT NULL DEFAULT 0,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at       TIMESTAMPTZ,

    CONSTRAINT uk_resume_templates_key UNIQUE (key),
    CONSTRAINT ck_resume_templates_category CHECK (category IN (
        'MODERN', 'MINIMAL', 'CORPORATE', 'HARVARD', 'STANFORD', 'EXECUTIVE',
        'ATS_FRIENDLY', 'ACADEMIC', 'ELEGANT', 'COMPACT', 'STUDENT', 'CREATIVE',
        'GOOGLE', 'APPLE', 'DEVELOPER', 'DARK'
    ))
);

CREATE INDEX idx_resume_templates_active_sort ON resume_templates (is_active, sort_order);

ALTER TABLE resumes
    ADD COLUMN template_id UUID REFERENCES resume_templates (id) ON DELETE SET NULL;

-- Seed the initial 20-template catalog. `sort_order` controls gallery order.
INSERT INTO resume_templates (key, name, category, is_ats_friendly, sort_order) VALUES
    ('modern',                  'Modern',                   'MODERN',       TRUE,  1),
    ('minimal',                 'Minimal',                  'MINIMAL',      TRUE,  2),
    ('corporate',               'Corporate',                'CORPORATE',    TRUE,  3),
    ('harvard',                 'Harvard',                  'HARVARD',      TRUE,  4),
    ('stanford',                'Stanford',                 'STANFORD',     TRUE,  5),
    ('executive',               'Executive',                'EXECUTIVE',    FALSE, 6),
    ('ats-friendly',            'ATS Friendly',              'ATS_FRIENDLY', TRUE,  7),
    ('academic',                'Academic',                 'ACADEMIC',     TRUE,  8),
    ('elegant',                 'Elegant',                  'ELEGANT',      FALSE, 9),
    ('compact',                 'Compact',                  'COMPACT',      TRUE,  10),
    ('student',                 'Student',                  'STUDENT',      TRUE,  11),
    ('monochrome',              'Monochrome',                'MINIMAL',      TRUE,  12),
    ('editorial',               'Editorial',                'CREATIVE',     FALSE, 13),
    ('google',                  'Google',                   'GOOGLE',       FALSE, 14),
    ('apple',                   'Apple',                    'APPLE',        FALSE, 15),
    ('developer',               'Developer',                'DEVELOPER',    FALSE, 16),
    ('creative',                'Creative',                 'CREATIVE',     FALSE, 17),
    ('dark',                    'Dark',                     'DARK',         FALSE, 18),
    ('professional-two-column', 'Two-Column Professional',  'CORPORATE',    FALSE, 19),
    ('timeline',                'Timeline',                 'CREATIVE',     FALSE, 20);
