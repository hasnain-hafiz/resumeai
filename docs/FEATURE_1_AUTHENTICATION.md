# Feature 1 — Authentication

Status: **complete, awaiting your review before Feature 2 (Dashboard).**

## 1. Folder structure

```
resumeai/
├── backend/
│   ├── pom.xml
│   ├── Dockerfile
│   ├── .env.example
│   └── src/
│       ├── main/java/com/resumeai/
│       │   ├── ResumeAiApplication.java
│       │   ├── config/            SecurityConfig, JpaAuditingConfig, OpenApiConfig
│       │   ├── controller/        AuthController
│       │   ├── dto/request/       RegisterRequest, LoginRequest, ...
│       │   ├── dto/response/      AuthResponse, UserResponse, ApiResponse, ErrorResponse
│       │   ├── entity/            BaseEntity, User, RefreshToken, VerificationToken, PasswordResetToken
│       │   ├── exception/         ApiException + subclasses, GlobalExceptionHandler
│       │   ├── mapper/            UserMapper (MapStruct)
│       │   ├── repository/        UserRepository, RefreshTokenRepository, ...
│       │   ├── security/          JwtTokenProvider, JwtAuthenticationFilter, UserPrincipal,
│       │   │                      CustomUserDetailsService, OAuth2LoginSuccessHandler,
│       │   │                      AuthRateLimitingFilter
│       │   ├── service/           AuthService, EmailService, RefreshTokenService (+ impl/)
│       │   └── util/              TokenGenerator
│       ├── main/resources/
│       │   ├── application.yml
│       │   └── db/migration/V1__init_auth_schema.sql
│       └── test/java/com/resumeai/
│           ├── service/AuthServiceImplTest.java
│           └── integration/AuthControllerIntegrationTest.java
│
└── frontend/
    ├── package.json, vite.config.ts, tailwind.config.js, Dockerfile
    └── src/
        ├── api/authApi.ts
        ├── components/auth/       AuthLayout, FormField, AuthControls, ProtectedRoute
        ├── hooks/useAuth.ts        TanStack Query hooks
        ├── lib/axiosClient.ts      bearer-token + refresh interceptor
        ├── pages/auth/             Login, Register, CheckYourEmail, VerifyEmail,
        │                           ForgotPassword, ResetPassword, OAuthCallback
        ├── routes/AppRouter.tsx
        ├── schemas/authSchemas.ts  Zod
        ├── store/authStore.ts      Zustand
        └── types/auth.types.ts
```

## 2. Database changes

`V1__init_auth_schema.sql` creates:
- **users** — UUID PK, unique email, bcrypt `password_hash` (nullable for OAuth-only accounts), `provider`/`provider_id` for Google linking, `role`, `email_verified`, `account_locked`, `failed_login_attempts`, audit + soft-delete columns.
- **refresh_tokens** — hashed, rotated, revocable, with `replaced_by_token_hash` for reuse-chain tracing.
- **verification_tokens** / **password_reset_tokens** — hashed, single-use, short TTL.

All tables carry `created_at`/`updated_at`/`deleted_at` and are indexed on their lookup columns (email, token_hash, user_id).

## 3. Backend implementation

Spring Boot 3 / Java 21, layered as Controller → Service → Repository → Entity, with DTOs and MapStruct mapping at the boundary.

Highlights:
- **JWT access tokens** (15 min TTL, HS256) + **opaque, hashed, rotating refresh tokens** (30 day TTL). Refresh-token **reuse detection** revokes the entire session family if a token is replayed after rotation — a strong signal of theft.
- **Google OAuth2 login** via Spring Security's OAuth2 client; a custom success handler finds-or-creates the user, links accounts by email, and redirects to the SPA with tokens in the URL **fragment** (never logged server-side).
- **Account lockout** after 5 failed logins; unlocked by a successful password reset.
- **Email verification is mandatory** before password login (OAuth accounts are auto-verified).
- Per-IP **rate limiting** (Bucket4j) on `/register`, `/login`, `/forgot-password`, `/resend-verification`.
- Centralized `GlobalExceptionHandler` returns a consistent `ErrorResponse` shape, including field-level validation errors.
- Emails (verification, welcome, reset, password-changed) sent **async** so a mail-provider outage never blocks the auth flow.

## 4. Frontend implementation

React 19 + TypeScript + Vite + Tailwind.

- **Zustand** `authStore` holds `accessToken`/`refreshToken`/`user`, persisted to `localStorage` (documented trade-off — see the code comment; an httpOnly-cookie refresh token is the stronger option for a later hardening pass).
- **Axios** client attaches the bearer token on every request and transparently refreshes + retries on a single `401`, coalescing concurrent refreshes into one network call.
- **TanStack Query** hooks (`useLogin`, `useRegister`, `useCurrentUser`, etc.) wrap the API layer and sync results into the store.
- **React Hook Form + Zod** on every form, with the same password rules as the backend (uppercase, lowercase, digit, 8+ chars).
- Pages: Login, Register, Check-your-email, Verify-email, Forgot-password, Reset-password, OAuth callback.
- `ProtectedRoute` / `GuestOnlyRoute` guards for `/dashboard` vs. the auth pages.

## 5. API endpoints

| Method | Path | Auth required | Purpose |
|---|---|---|---|
| POST | `/api/v1/auth/register` | No | Create account, send verification email |
| POST | `/api/v1/auth/login` | No | Password login → access + refresh token |
| POST | `/api/v1/auth/refresh` | No (valid refresh token) | Rotate tokens |
| POST | `/api/v1/auth/logout` | No (valid refresh token) | Revoke a refresh token |
| POST | `/api/v1/auth/verify-email` | No | Consume verification token |
| POST | `/api/v1/auth/resend-verification` | No | Re-send verification email |
| POST | `/api/v1/auth/forgot-password` | No | Send password reset email |
| POST | `/api/v1/auth/reset-password` | No | Consume reset token, set new password |
| POST | `/api/v1/auth/change-password` | Yes | Change password (requires current password) |
| GET | `/api/v1/auth/me` | Yes | Get current profile |
| PATCH | `/api/v1/auth/me` | Yes | Update name/photo |
| DELETE | `/api/v1/auth/me` | Yes | Soft-delete account |
| GET | `/oauth2/authorization/google` | No | Start Google login |

All endpoints are documented in Swagger UI at `/swagger-ui.html` once the backend is running.

## 6. Validation

- Backend: Jakarta Bean Validation on every request DTO (`@NotBlank`, `@Email`, `@Size`, password `@Pattern`), enforced again at the DB level via `CHECK` constraints where it matters (e.g. `provider`/`password_hash` consistency).
- Frontend: matching Zod schemas so users see errors before a round-trip; server errors still render (never trust the client alone).
- Forgot-password / resend-verification **always return a generic success message**, regardless of whether the email exists, to avoid account enumeration.

## 7. Testing

- `AuthServiceImplTest` (JUnit 5 + Mockito): registration conflicts, password hashing, wrong-password handling, lockout after 5 attempts, locked-account rejection, unverified-email rejection, successful login resetting the failure counter.
- `AuthControllerIntegrationTest` (Testcontainers + real PostgreSQL): full register → verify → login flow through actual HTTP + JPA + Flyway, duplicate-email conflict, weak-password rejection.

Run:
```bash
cd backend
mvn test                 # unit tests
mvn verify                # + integration tests (needs Docker for Testcontainers)
```

## 8. UI implementation

Design direction: a quiet two-panel shell (dark editorial panel + light form panel), `Fraunces` serif display headlines over `Inter` body text, a single indigo accent (`#5B5FEF`) rather than a decorative palette — deliberately away from the "warm cream + terracotta" and "near-black + acid accent" defaults so it doesn't read as templated. Every form has inline validation, loading states on submit, and accessible labels/`aria-describedby` error wiring.

## 9. Best practices applied

- Passwords hashed with BCrypt (cost 12); tokens never stored raw, only SHA-256 hashes.
- Stateless JWT auth (no server sessions), CORS locked to configured origins, security headers (HSTS, X-Frame-Options, referrer policy).
- Soft delete everywhere via `BaseEntity` — nothing is hard-deleted by a user action.
- Flyway owns the schema; Hibernate is `ddl-auto: validate` only, never `update`, so prod schema drift is impossible to introduce silently.
- Refresh-token rotation with reuse detection (see §3).
- Generic responses on account-enumeration-sensitive endpoints.
- All secrets via environment variables (`.env.example` provided, `.env` gitignored).

## 10. Git commit message

```
feat(auth): implement full authentication feature

- Add users/refresh_tokens/verification_tokens/password_reset_tokens schema (Flyway V1)
- Add JWT access tokens + rotating, hashed, reuse-detecting refresh tokens
- Add Google OAuth2 login with account linking
- Add register/login/refresh/logout/verify-email/forgot-password/reset-password/
  change-password/me endpoints with Bean Validation and a global exception handler
- Add per-IP rate limiting on sensitive auth endpoints
- Add async transactional email sending (verify/welcome/reset/password-changed)
- Add unit tests (AuthServiceImplTest) and Testcontainers integration test
- Add React auth UI: login/register/verify/forgot/reset/OAuth-callback pages,
  Zustand session store, Axios refresh interceptor, TanStack Query hooks,
  Zod-validated forms
- Add Docker/Docker Compose for backend, frontend, Postgres, Redis
```
