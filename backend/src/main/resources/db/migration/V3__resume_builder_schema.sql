-- ================================================================
-- V3__resume_builder_schema.sql
-- Feature: Resume Builder
--
-- Extends the minimal `resumes` table Feature 2 created (id, user_id,
-- title, timestamps) with the actual resume content, and adds one table
-- per resume section. Every child table cascades on resume delete.
-- ================================================================

-- ----------------------------------------------------------------
-- resumes: add personal information + summary
-- ----------------------------------------------------------------
ALTER TABLE resumes
    ADD COLUMN full_name     VARCHAR(120),
    ADD COLUMN email         VARCHAR(180),
    ADD COLUMN phone         VARCHAR(40),
    ADD COLUMN address       VARCHAR(255),
    ADD COLUMN linkedin_url  VARCHAR(255),
    ADD COLUMN github_url    VARCHAR(255),
    ADD COLUMN portfolio_url VARCHAR(255),
    ADD COLUMN website_url   VARCHAR(255),
    ADD COLUMN photo_url     VARCHAR(500),
    ADD COLUMN summary       TEXT;

-- ----------------------------------------------------------------
-- resume_experiences
-- ----------------------------------------------------------------
CREATE TABLE resume_experiences (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resume_id        UUID NOT NULL REFERENCES resumes (id) ON DELETE CASCADE,
    company          VARCHAR(200) NOT NULL,
    position         VARCHAR(200) NOT NULL,
    location         VARCHAR(200),
    employment_type  VARCHAR(20),
    start_date       DATE,
    end_date         DATE,
    is_current       BOOLEAN NOT NULL DEFAULT FALSE,
    responsibilities TEXT,
    achievements     TEXT,
    sort_order       INTEGER NOT NULL DEFAULT 0,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at       TIMESTAMPTZ,

    CONSTRAINT ck_resume_experiences_employment_type CHECK (employment_type IS NULL OR employment_type IN (
        'FULL_TIME', 'PART_TIME', 'CONTRACT', 'FREELANCE', 'INTERNSHIP', 'VOLUNTEER'
    ))
);
CREATE INDEX idx_resume_experiences_resume_id ON resume_experiences (resume_id, sort_order);

-- ----------------------------------------------------------------
-- resume_education
-- ----------------------------------------------------------------
CREATE TABLE resume_education (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resume_id   UUID NOT NULL REFERENCES resumes (id) ON DELETE CASCADE,
    school      VARCHAR(200) NOT NULL,
    degree      VARCHAR(200),
    field       VARCHAR(200),
    cgpa        NUMERIC(4,2),
    start_date  DATE,
    end_date    DATE,
    sort_order  INTEGER NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at  TIMESTAMPTZ,

    CONSTRAINT ck_resume_education_cgpa_range CHECK (cgpa IS NULL OR (cgpa BETWEEN 0 AND 10))
);
CREATE INDEX idx_resume_education_resume_id ON resume_education (resume_id, sort_order);

-- ----------------------------------------------------------------
-- resume_projects (+ images, one-to-many)
-- ----------------------------------------------------------------
CREATE TABLE resume_projects (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resume_id     UUID NOT NULL REFERENCES resumes (id) ON DELETE CASCADE,
    title         VARCHAR(200) NOT NULL,
    description   TEXT,
    technologies  VARCHAR(1000),
    github_url    VARCHAR(255),
    live_url      VARCHAR(255),
    sort_order    INTEGER NOT NULL DEFAULT 0,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at    TIMESTAMPTZ
);
CREATE INDEX idx_resume_projects_resume_id ON resume_projects (resume_id, sort_order);

CREATE TABLE resume_project_images (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id  UUID NOT NULL REFERENCES resume_projects (id) ON DELETE CASCADE,
    url         VARCHAR(1000) NOT NULL,
    sort_order  INTEGER NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at  TIMESTAMPTZ
);
CREATE INDEX idx_resume_project_images_project_id ON resume_project_images (project_id, sort_order);

-- ----------------------------------------------------------------
-- resume_list_items: unified Skills (Technical/Soft/Tools/Frameworks/
-- Databases/Programming Languages), Interests, and Spoken Languages -
-- all "a labelled tag belonging to a resume", differentiated by `section`.
-- ----------------------------------------------------------------
CREATE TABLE resume_list_items (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resume_id   UUID NOT NULL REFERENCES resumes (id) ON DELETE CASCADE,
    section     VARCHAR(30) NOT NULL,
    value       VARCHAR(150) NOT NULL,
    proficiency VARCHAR(20),
    sort_order  INTEGER NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at  TIMESTAMPTZ,

    CONSTRAINT ck_resume_list_items_section CHECK (section IN (
        'TECHNICAL_SKILL', 'SOFT_SKILL', 'TOOL', 'FRAMEWORK', 'DATABASE',
        'PROGRAMMING_LANGUAGE', 'INTEREST', 'SPOKEN_LANGUAGE'
    )),
    CONSTRAINT ck_resume_list_items_proficiency CHECK (proficiency IS NULL OR proficiency IN (
        'BASIC', 'CONVERSATIONAL', 'PROFESSIONAL', 'FLUENT', 'NATIVE'
    ))
);
CREATE INDEX idx_resume_list_items_resume_id ON resume_list_items (resume_id, section, sort_order);

-- ----------------------------------------------------------------
-- resume_certifications
-- ----------------------------------------------------------------
CREATE TABLE resume_certifications (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resume_id       UUID NOT NULL REFERENCES resumes (id) ON DELETE CASCADE,
    name            VARCHAR(200) NOT NULL,
    issuer          VARCHAR(200),
    issue_date      DATE,
    credential_url  VARCHAR(500),
    sort_order      INTEGER NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at      TIMESTAMPTZ
);
CREATE INDEX idx_resume_certifications_resume_id ON resume_certifications (resume_id, sort_order);

-- ----------------------------------------------------------------
-- resume_awards
-- ----------------------------------------------------------------
CREATE TABLE resume_awards (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resume_id     UUID NOT NULL REFERENCES resumes (id) ON DELETE CASCADE,
    title         VARCHAR(200) NOT NULL,
    issuer        VARCHAR(200),
    awarded_date  DATE,
    description   TEXT,
    sort_order    INTEGER NOT NULL DEFAULT 0,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at    TIMESTAMPTZ
);
CREATE INDEX idx_resume_awards_resume_id ON resume_awards (resume_id, sort_order);

-- ----------------------------------------------------------------
-- resume_publications
-- ----------------------------------------------------------------
CREATE TABLE resume_publications (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resume_id       UUID NOT NULL REFERENCES resumes (id) ON DELETE CASCADE,
    title           VARCHAR(300) NOT NULL,
    publisher       VARCHAR(200),
    published_date  DATE,
    url             VARCHAR(500),
    description     TEXT,
    sort_order      INTEGER NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at      TIMESTAMPTZ
);
CREATE INDEX idx_resume_publications_resume_id ON resume_publications (resume_id, sort_order);

-- ----------------------------------------------------------------
-- resume_volunteer_experiences
-- ----------------------------------------------------------------
CREATE TABLE resume_volunteer_experiences (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resume_id    UUID NOT NULL REFERENCES resumes (id) ON DELETE CASCADE,
    organization VARCHAR(200) NOT NULL,
    role         VARCHAR(200),
    start_date   DATE,
    end_date     DATE,
    description  TEXT,
    sort_order   INTEGER NOT NULL DEFAULT 0,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at   TIMESTAMPTZ
);
CREATE INDEX idx_resume_volunteer_experiences_resume_id ON resume_volunteer_experiences (resume_id, sort_order);

-- ----------------------------------------------------------------
-- resume_references
-- ----------------------------------------------------------------
CREATE TABLE resume_references (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resume_id    UUID NOT NULL REFERENCES resumes (id) ON DELETE CASCADE,
    name         VARCHAR(200) NOT NULL,
    relationship VARCHAR(150),
    company      VARCHAR(200),
    email        VARCHAR(180),
    phone        VARCHAR(40),
    sort_order   INTEGER NOT NULL DEFAULT 0,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at   TIMESTAMPTZ
);
CREATE INDEX idx_resume_references_resume_id ON resume_references (resume_id, sort_order);

-- ----------------------------------------------------------------
-- resume_custom_sections (+ items, one-to-many)
-- ----------------------------------------------------------------
CREATE TABLE resume_custom_sections (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resume_id   UUID NOT NULL REFERENCES resumes (id) ON DELETE CASCADE,
    title       VARCHAR(150) NOT NULL,
    sort_order  INTEGER NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at  TIMESTAMPTZ
);
CREATE INDEX idx_resume_custom_sections_resume_id ON resume_custom_sections (resume_id, sort_order);

CREATE TABLE resume_custom_section_items (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    custom_section_id  UUID NOT NULL REFERENCES resume_custom_sections (id) ON DELETE CASCADE,
    heading            VARCHAR(200) NOT NULL,
    subheading         VARCHAR(200),
    description        TEXT,
    start_date         DATE,
    end_date           DATE,
    sort_order         INTEGER NOT NULL DEFAULT 0,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at         TIMESTAMPTZ
);
CREATE INDEX idx_resume_custom_section_items_section_id ON resume_custom_section_items (custom_section_id, sort_order);
