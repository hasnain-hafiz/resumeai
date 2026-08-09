-- ================================================================
-- V1__init_auth_schema.sql
-- Feature: Authentication
-- Creates: users, refresh_tokens, verification_tokens, password_reset_tokens
-- ================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ----------------------------------------------------------------
-- users
-- ----------------------------------------------------------------
CREATE TABLE users (
    id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name              VARCHAR(120)  NOT NULL,
    email                  VARCHAR(180)  NOT NULL,
    password_hash          VARCHAR(255),
    photo_url              TEXT,
    provider               VARCHAR(20)   NOT NULL DEFAULT 'LOCAL',
    provider_id            VARCHAR(255),
    role                   VARCHAR(20)   NOT NULL DEFAULT 'USER',
    email_verified         BOOLEAN       NOT NULL DEFAULT FALSE,
    account_locked         BOOLEAN       NOT NULL DEFAULT FALSE,
    failed_login_attempts  INTEGER       NOT NULL DEFAULT 0,
    last_login_at          TIMESTAMPTZ,
    created_at             TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at             TIMESTAMPTZ   NOT NULL DEFAULT now(),
    deleted_at             TIMESTAMPTZ,

    CONSTRAINT uk_users_email UNIQUE (email),
    CONSTRAINT ck_users_provider CHECK (provider IN ('LOCAL', 'GOOGLE')),
    CONSTRAINT ck_users_role CHECK (role IN ('USER', 'ADMIN')),
    -- Local accounts must have a password; OAuth-only accounts must not.
    CONSTRAINT ck_users_password_matches_provider CHECK (
        (provider = 'LOCAL' AND password_hash IS NOT NULL) OR
        (provider = 'GOOGLE')
    )
);

CREATE INDEX idx_users_email ON users (email);
CREATE INDEX idx_users_provider_id ON users (provider, provider_id);
CREATE INDEX idx_users_deleted_at ON users (deleted_at);

-- ----------------------------------------------------------------
-- refresh_tokens (rotated, hashed, one row per issued token)
-- ----------------------------------------------------------------
CREATE TABLE refresh_tokens (
    id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                  UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    token_hash               VARCHAR(128) NOT NULL,
    expires_at               TIMESTAMPTZ  NOT NULL,
    revoked                  BOOLEAN      NOT NULL DEFAULT FALSE,
    replaced_by_token_hash   VARCHAR(128),
    user_agent               TEXT,
    ip_address                VARCHAR(64),
    created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at                TIMESTAMPTZ,

    CONSTRAINT uk_refresh_tokens_token_hash UNIQUE (token_hash)
);

CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens (user_id);
CREATE INDEX idx_refresh_tokens_token_hash ON refresh_tokens (token_hash);
CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens (expires_at);

-- ----------------------------------------------------------------
-- verification_tokens (email verification, single use)
-- ----------------------------------------------------------------
CREATE TABLE verification_tokens (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    token_hash   VARCHAR(128) NOT NULL,
    expires_at   TIMESTAMPTZ  NOT NULL,
    consumed_at  TIMESTAMPTZ,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at   TIMESTAMPTZ,

    CONSTRAINT uk_verification_tokens_token_hash UNIQUE (token_hash)
);

CREATE INDEX idx_verification_tokens_user_id ON verification_tokens (user_id);

-- ----------------------------------------------------------------
-- password_reset_tokens (single use, short TTL)
-- ----------------------------------------------------------------
CREATE TABLE password_reset_tokens (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    token_hash   VARCHAR(128) NOT NULL,
    expires_at   TIMESTAMPTZ  NOT NULL,
    consumed_at  TIMESTAMPTZ,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at   TIMESTAMPTZ,

    CONSTRAINT uk_password_reset_tokens_token_hash UNIQUE (token_hash)
);

CREATE INDEX idx_password_reset_tokens_user_id ON password_reset_tokens (user_id);
