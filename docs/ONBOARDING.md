# ResumeAI — Authentication Feature: Developer Onboarding

This is a full walkthrough of the codebase as it stands after Feature 1. It assumes you can read Java and TypeScript but have never opened this repo before.

---

## 1. Overall architecture

ResumeAI is a **two-process system**: a stateless Java/Spring REST API and a React single-page app, talking over HTTPS/JSON. Nothing is shared in-process — the frontend never touches the database, and the backend never renders HTML.

```
┌─────────────┐        HTTPS/JSON        ┌──────────────────┐        JDBC        ┌────────────┐
│   Browser    │ ───────────────────────▶ │  Spring Boot API  │ ──────────────────▶ │ PostgreSQL │
│ (React SPA)  │ ◀─────────────────────── │  (stateless, JWT) │ ◀────────────────── │            │
└─────────────┘                          └──────────────────┘                    └────────────┘
                                                    │
                                                    ├──▶ Redis (reserved — caching/rate-limit backing, not yet load-bearing)
                                                    ├──▶ SMTP (verification/reset/notification emails)
                                                    └──▶ Google OAuth2 (accounts.google.com)
```

The backend follows **layered / clean architecture**: each HTTP request travels through a fixed sequence of layers, each with one job:

```
HTTP request
   │
   ▼
Controller        — parses/validates the request, has zero business logic
   │
   ▼
Service           — the business logic; the only layer allowed to make decisions
   │
   ▼
Repository        — talks to the database via Spring Data JPA, no logic
   │
   ▼
Entity / DB
```

Data crossing a layer boundary changes shape on purpose:
- **Entity** (`com.resumeai.entity`) — how data looks *in the database*.
- **DTO** (`com.resumeai.dto`) — how data looks *on the wire* (request/response JSON).
- A **Mapper** (`com.resumeai.mapper`) converts between the two, so a database-only field (like `passwordHash`) can never accidentally leak into an API response — it simply isn't on the DTO.

---

## 2. Project structure and what each folder is for

```
backend/src/main/java/com/resumeai/
├── ResumeAiApplication.java   Spring Boot entry point (main())
├── config/                    Wiring that isn't feature logic: security, JPA auditing, OpenAPI
├── controller/                REST endpoints — HTTP in, HTTP out, nothing else
├── dto/
│   ├── request/                Shapes of incoming JSON bodies (with validation annotations)
│   └── response/                Shapes of outgoing JSON bodies
├── entity/                      JPA-mapped database tables
├── exception/                    Custom exceptions + the global handler that turns them into JSON
├── mapper/                        Entity ⇄ DTO conversion (MapStruct-generated)
├── repository/                    Spring Data JPA interfaces — the only classes that query the DB
├── security/                      JWT issuing/parsing, the auth filter, OAuth2 handling, rate limiting
├── service/                        Business logic interfaces
│   └── impl/                       Their implementations
└── util/                          Small stateless helpers (token generation/hashing)
```

```
frontend/src/
├── api/          Thin wrappers around each REST call (one function per endpoint)
├── components/   Reusable UI pieces (layout shell, form fields, buttons, route guards)
├── hooks/        TanStack Query hooks that call api/ and sync results into the store
├── lib/          Axios instance + interceptors (the token-refresh machinery lives here)
├── pages/        One file per screen (Login, Register, ResetPassword, …)
├── routes/       React Router route table
├── schemas/      Zod validation schemas, shared by every form
├── store/        Zustand store holding the session (tokens + current user)
└── types/        Shared TypeScript types mirroring the backend DTOs
```

**Rule of thumb for "where does this code go?"**
- Talks to the database? → `repository/`
- Decides *what should happen*? → `service/`
- Shapes an HTTP request/response? → `controller/` + `dto/`
- Concerns *who is making the request*? → `security/`
- Turns a failure into a JSON error? → `exception/`

---

## 3. Request flow, end to end

Take `POST /api/v1/auth/login` as the running example. Here's everything that happens between the browser sending the request and the JSON response coming back:

1. **`AuthRateLimitingFilter`** (a servlet filter, runs before Spring's dispatcher) checks whether this IP has exceeded 10 requests/minute to `/api/v1/auth/login`. If so, it short-circuits with `429` and the request goes no further.
2. **`JwtAuthenticationFilter`** runs next. For `/login` there's no `Authorization` header, so it does nothing and calls `filterChain.doFilter()` to pass through.
3. Spring's `DispatcherServlet` routes the request to **`AuthController.login(...)`** based on the `@PostMapping("/login")` mapping.
4. Spring converts the JSON body into a **`LoginRequest`** DTO and runs Bean Validation (`@Valid`) — `@NotBlank`, `@Email` — *before* the controller method body even runs. If validation fails, it never reaches the controller; `GlobalExceptionHandler.handleValidation()` catches the resulting `MethodArgumentNotValidException` and returns `400` with field-level errors.
5. `AuthController.login()` calls **`authService.login(request, httpRequest)`** — this is the last thing the controller does; it has no `if` statements of its own.
6. **`AuthServiceImpl.login()`** runs the actual business logic (detailed in §6 below): looks up the user, checks the password, checks lockout/verification state, on success asks `RefreshTokenService` to issue a refresh token and `JwtTokenProvider` to mint an access token.
7. Along the way, **`UserRepository`** (a Spring Data JPA interface — no implementation code, Spring generates one) issues the actual SQL `SELECT` against the `users` table.
8. `AuthServiceImpl` builds an **`AuthResponse`** DTO (via `UserMapper` for the nested user object) and returns it up the stack.
9. `AuthController` wraps it in `ResponseEntity.ok(...)` and Spring serializes it to JSON.
10. If anything threw an exception anywhere in steps 5–8 (e.g. `InvalidCredentialsException`), it propagates up to **`GlobalExceptionHandler`**, which maps it to the right HTTP status and a consistent `ErrorResponse` JSON body — the controller method itself never has a `try/catch`.

The same shape applies to every endpoint; only step 6 (the service logic) changes.

---

## 4. Authentication and authorization

**Authentication** ("who are you") and **authorization** ("what are you allowed to do") are both handled by Spring Security, configured in **`SecurityConfig`**.

### How the API stays stateless
There is no `HttpSession`. `SecurityConfig` sets:
```java
.sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
```
This means Spring Security never creates or reads a session cookie. Every single request must prove who it is on its own, via the `Authorization: Bearer <token>` header. This is what makes the API horizontally scalable — any backend instance can handle any request, since no server holds session state.

### The filter chain (who runs, in what order)
```
AuthRateLimitingFilter → JwtAuthenticationFilter → UsernamePasswordAuthenticationFilter (Spring's own, mostly unused here) → ... → DispatcherServlet
```
This ordering is set explicitly in `SecurityConfig.securityFilterChain()`:
```java
.addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
.addFilterBefore(authRateLimitingFilter, JwtAuthenticationFilter.class);
```

### `JwtAuthenticationFilter` — the class that does authentication
- **Responsibility:** on every request, check for a valid access token and, if present, tell Spring Security "this request is from user X."
- **Why it exists:** Spring Security has no built-in concept of JWTs; this is the standard way to bolt one on — a custom `OncePerRequestFilter`.
- **How it interacts:** uses `JwtTokenProvider` to validate/parse the token, and `CustomUserDetailsService.loadUserById()` to load the corresponding user.
- **Execution flow (`doFilterInternal`):**
  1. `resolveToken(request)` — reads the `Authorization` header, strips the `Bearer ` prefix.
  2. If a token is present and `jwtTokenProvider.isValid(token)` is true and nobody's already authenticated this request:
     - `jwtTokenProvider.getUserId(token)` extracts the user ID from the JWT's `sub` claim.
     - `userDetailsService.loadUserById(id)` fetches the user from the DB and wraps it as a `UserPrincipal`.
     - A `UsernamePasswordAuthenticationToken` is built and placed into `SecurityContextHolder` — **this is the actual "you are now logged in for this request" step**.
  3. `filterChain.doFilter()` passes control onward regardless.

If the token is missing, expired, or invalid, the `SecurityContext` simply stays empty — the request proceeds unauthenticated, and it's `SecurityConfig`'s `.authorizeHttpRequests(...)` rules that decide whether an unauthenticated request is allowed to reach that particular endpoint.

### Authorization: `.authorizeHttpRequests(...)` in `SecurityConfig`
```java
.requestMatchers(PUBLIC_ENDPOINTS).permitAll()
.requestMatchers("/api/v1/admin/**").hasRole("ADMIN")
.anyRequest().authenticated()
```
This is a **first-match-wins** list. `PUBLIC_ENDPOINTS` (register, login, refresh, verify-email, forgot/reset-password, OAuth, Swagger, health check) skip authentication entirely. Anything under `/api/v1/admin/**` requires the `ADMIN` role. Everything else just needs *any* valid authenticated user.

`@EnableMethodSecurity` is also turned on, so future features can additionally annotate individual service/controller methods with `@PreAuthorize("hasRole('ADMIN')")` for finer-grained checks than the URL-pattern rules above.

---

## 5. Tokens: JWTs, refresh tokens, and why there's no session

Two very different kinds of token are used, on purpose:

| | Access token | Refresh token |
|---|---|---|
| **Format** | JWT (self-contained, signed) | Opaque random string |
| **Lifetime** | 15 minutes | 30 days |
| **Stored server-side?** | No — never persisted | Yes — hashed, in `refresh_tokens` table |
| **Sent on** | Every API request (`Authorization` header) | Only to `/auth/refresh` and `/auth/logout` |
| **Purpose** | Prove identity fast, without a DB hit | Get a new access token without re-entering a password |

### `JwtTokenProvider` — mints and validates access tokens
- **Responsibility:** the single place that knows the JWT signing secret and the token format.
- **Why it exists:** centralizes all JWT logic so nothing else in the codebase touches `io.jsonwebtoken` directly.
- **Key methods:**
  - `generateAccessToken(userId, email, role)` — builds a JWT with `sub` = user ID, custom claims `email` and `role`, `iat`/`exp`, signed with HMAC-SHA256 using the secret from `app.security.jwt.secret`.
  - `isValid(token)` — tries to parse and verify the signature/expiry; returns `false` (not an exception) on any failure, which is what lets `JwtAuthenticationFilter` treat a bad token as "just not authenticated" rather than crashing the request.
  - `getUserId(token)` / `getRole(token)` — pull claims back out.
- **Why the access token is never stored in the DB:** it doesn't need to be. Its signature *is* its own proof of validity — anyone with the secret can verify it without a database round trip. This is what makes stateless auth fast.

### Refresh tokens are the opposite: opaque and DB-backed, and here's why
A JWT refresh token would be dangerous: if 30-day-lived JWTs could never be individually revoked (you'd have to rotate the whole signing secret and log everyone out to kill one stolen token). So refresh tokens are just random bytes (`TokenGenerator.generateRawToken()` — 32 bytes of `SecureRandom`, base64url-encoded), and the server keeps a row per token in the `refresh_tokens` table so any single one can be revoked without affecting anyone else.

**Critically, the raw token is never stored** — only its SHA-256 hash (`TokenGenerator.hash()`). If the database were ever dumped or leaked, none of the hashes are usable to log in as anyone (you can't reverse a hash back into a working token). The same hash-only pattern is used for email-verification and password-reset tokens too.

### `RefreshTokenService` / `RefreshTokenServiceImpl` — lifecycle of a refresh token
- **`issue(user, request)`** — called right after a successful login. Generates a raw token, stores its hash + expiry + the requesting `User-Agent`/IP (for future "your active sessions" UI) in a new `RefreshToken` row, and returns the *raw* value (which only ever exists in memory and in the HTTP response — never in the DB).
- **`rotate(rawToken, request)`** — called by `/auth/refresh`. This is the interesting one:
  1. Hash the presented token, look up the matching row.
  2. If it doesn't exist → `InvalidOrExpiredTokenException`.
  3. **If it's already revoked → this is a replay of a used token.** That's a strong signal of theft (a legitimate client would never present the same refresh token twice — it always gets a new one on each use). The response: `refreshTokenRepository.revokeAllForUser(...)` — kill *every* session for that user, not just this one, and throw. This is called **refresh token rotation with reuse detection**, a standard defense against stolen-token replay.
  4. If it's expired → `InvalidOrExpiredTokenException`.
  5. Otherwise: mark the old row `revoked = true` (recording `replacedByTokenHash` for traceability), create a brand new row, and return the new raw token.
- **`revoke(rawToken)`** — used by logout; marks one token revoked without issuing a replacement.
- **`revokeAllForUser(user)`** — used after a password change/reset, and account deletion, to force re-login everywhere.

### `OAuth2LoginSuccessHandler` — the Google login path
When someone clicks "Continue with Google," Spring Security's built-in OAuth2 client handles the entire handshake with Google (redirect, consent screen, token exchange) — none of that is custom code. This class only runs **once the handshake has already succeeded**, and its job is to bridge Google's identity into ResumeAI's own token system:
1. Reads `email`, `name`, `picture`, `sub` (Google's stable user ID) off the `OAuth2User`.
2. Finds an existing `User` by email, or creates one (`provisionNewGoogleUser`). If an existing *local* (password) account has the same email, it gets **linked** — `provider` flips to `GOOGLE` and `providerId` is set — rather than creating a duplicate account.
3. Issues our own access + refresh tokens (Google's tokens are never given to the frontend).
4. Redirects the browser back to the SPA with tokens in the **URL fragment** (`#accessToken=...&refreshToken=...`), not the query string — fragments are never sent to the server or appear in server access logs, which matters because these are live credentials.

On the frontend, `OAuthCallback.tsx` is the page mounted at that redirect URL; it reads `window.location.hash`, stores the tokens, and fetches `/auth/me` to get the full user object before routing to `/dashboard`.

---

## 6. The full register → verify → login → refresh → logout lifecycle

### Register
1. `AuthController.register()` receives a `RegisterRequest`, already validated (name length, email format, password complexity via regex).
2. `AuthServiceImpl.register()`:
   - `userRepository.existsByEmailIgnoreCase(...)` — if true, throw `EmailAlreadyInUseException` (→ HTTP 409).
   - `passwordEncoder.encode(...)` — BCrypt, cost factor 12 (deliberately slow, configured in `SecurityConfig.passwordEncoder()`).
   - Save a new `User` with `emailVerified = false`.
   - `issueVerificationToken(user)` — generates a raw token, stores its hash in `verification_tokens` with a 24-hour expiry, and calls `emailService.sendVerificationEmail(...)` (which runs `@Async`, off the request thread, so a slow mail provider never delays the HTTP response).
3. Response: `201 Created` with a generic message — the account exists but **cannot log in yet**.

### Verify email
1. User clicks the link in their email → frontend `VerifyEmail.tsx` reads `?token=` from the URL and calls `POST /auth/verify-email`.
2. `AuthServiceImpl.verifyEmail()`: hashes the presented token, looks it up, checks `token.isValid()` (not already consumed, not expired), flips `user.emailVerified = true`, marks the token consumed, and sends a welcome email.

### Login
Covered in detail in §3 above. In short: look up by email → check `accountLocked` → check password hash → check `emailVerified` → reset `failedLoginAttempts` → issue tokens.

**Failed-login handling** (`registerFailedLoginAttempt`): each wrong password increments `failedLoginAttempts`; on the 5th, `accountLocked` flips to `true` and every subsequent login attempt is rejected with `AccountLockedException` (HTTP 403) *before* the password is even checked — this is what stops a brute-force script from continuing to guess passwords once the account is locked. Locking is lifted automatically when the user completes a password reset.

### Refresh
1. Frontend's Axios response interceptor (`lib/axiosClient.ts`) sees a `401` on some other API call, and — instead of giving up — calls `POST /auth/refresh` with the stored refresh token.
2. `AuthController.refresh()` → `AuthServiceImpl.refresh()` → `RefreshTokenService.rotate(...)` (full logic in §5).
3. On success, a brand new access + refresh token pair comes back; the frontend updates its store and **retries the original failed request** with the new access token — the user never sees the 401.
4. Concurrent 401s are coalesced: `axiosClient.ts` keeps a module-level `refreshPromise` so if three API calls all 401 at once, only one `/refresh` call is actually made and all three await the same promise.

### Logout
1. `POST /auth/logout` with the current refresh token.
2. `AuthServiceImpl.logout()` → `RefreshTokenService.revoke(rawToken)` — marks that one row revoked. (The access token itself isn't and can't be revoked — it just expires naturally within 15 minutes, which is *why* the access-token lifetime is kept short.)
3. Frontend clears its Zustand store (`clearSession()`) and the React Query cache, and routes to `/login`.

---

## 7. The role of each layer, class by class

### Controllers — `AuthController`
- **Responsibility:** translate HTTP ⇄ method calls. Parse path/body/headers into typed arguments, call exactly one service method, wrap the result in a `ResponseEntity` with the right status code.
- **Why thin:** business logic in controllers can't be unit tested without spinning up HTTP infrastructure, and can't be reused by anything else (a future batch job, a CLI, another controller). Keeping it thin means `AuthServiceImplTest` can test all the real logic with plain Mockito, no web layer involved.
- **Notable pattern:** `@AuthenticationPrincipal UserPrincipal principal` — Spring Security automatically injects the currently-authenticated user (the one `JwtAuthenticationFilter` put into the `SecurityContext`) directly as a method parameter. No manual `SecurityContextHolder.getContext()...` calls anywhere in application code.

### Services — `AuthService` (interface) / `AuthServiceImpl`
- **Responsibility:** the only layer that makes decisions — password checks, lockout logic, token issuance, what triggers an email.
- **Why an interface + impl split:** lets you mock `AuthService` when testing a *controller* in isolation, and lets you swap implementations later without touching callers. (Also just a Spring/Java convention you'll see throughout the codebase — `EmailService`/`EmailServiceImpl`, `RefreshTokenService`/`RefreshTokenServiceImpl`.)
- **Interacts with:** repositories (data access), `PasswordEncoder`/`JwtTokenProvider` (security primitives), `RefreshTokenService` and `EmailService` (other services), `UserMapper` (shaping the response).
- **Transactions:** every mutating method is `@Transactional` — e.g. `register()` writes both a `User` row and a `VerificationToken` row; if the second insert failed, `@Transactional` rolls back the first too, so you can never end up with a user who can never receive a working verification link.

### Repositories — `UserRepository`, `RefreshTokenRepository`, etc.
- **Responsibility:** *only* data access. These are Spring Data JPA interfaces with no method bodies — Spring generates the implementation at startup from the method name (`findByEmailIgnoreCase` → `WHERE LOWER(email) = LOWER(?)`) or from an explicit `@Query`.
- **Why no logic here:** if business rules leak into repositories, they become untestable without a real database and unreusable outside that one query shape.
- **Example of the generated-implementation pattern:** `RefreshTokenRepository.revokeAllForUser()` uses a hand-written JPQL `@Query` with `@Modifying` (because bulk updates aren't expressible as a method name), while `findByTokenHash` is entirely inferred from its signature.

### Entities — `User`, `RefreshToken`, `VerificationToken`, `PasswordResetToken`, `BaseEntity`
- **Responsibility:** the JPA-mapped, one-to-one representation of a database table. Nothing else should know these classes exist outside `entity/`, `repository/`, `service/`, and `mapper/` — a DTO is what crosses into `controller/`.
- **`BaseEntity`** — an abstract `@MappedSuperclass` that every entity extends, giving all of them for free:
  - `id` (UUID, not auto-increment — safer to expose in URLs/JSON, and avoids leaking "how many users do you have" via sequential IDs).
  - `createdAt`/`updatedAt`, auto-populated by Spring Data JPA's auditing (`@CreatedDate`/`@LastModifiedDate`, enabled via `JpaAuditingConfig`'s `@EnableJpaAuditing`).
  - `deletedAt` + `markDeleted()`/`isDeleted()` — **soft delete**. `@SQLRestriction("deleted_at IS NULL")` on each concrete entity means every query Hibernate generates automatically excludes soft-deleted rows — you never have to remember to add `WHERE deleted_at IS NULL` yourself.
- **Why this matters for `AuthServiceImpl.deleteAccount()`:** it calls `user.markDeleted()` and saves — the row stays in the database (for auditing, potential recovery, and to keep any foreign keys from other future features intact) but becomes invisible to the application immediately.

### DTOs — `dto/request/*`, `dto/response/*`
- **Responsibility:** define the exact JSON shape of the API, independent of how data happens to be stored.
- **Why they're Java `record`s:** immutable by default, auto-generate `equals`/`hashCode`/`toString`, and the constructor *is* the field list — there's no way to construct a half-populated `RegisterRequest`.
- **Where validation lives:** directly on the record's canonical constructor parameters (`@NotBlank`, `@Email`, `@Size`, `@Pattern`) — Jakarta Bean Validation reads these annotations when a controller parameter is marked `@Valid`.
- **Two purposes split into two packages:** `request/` types only ever get *deserialized* (never sent out); `response/` types only ever get *serialized*. This asymmetry is intentional — e.g. `UserResponse` deliberately has no `passwordHash` field, so there is no code path by which a password hash could ever end up in an HTTP response, even by accident.

### Mapper — `UserMapper`
- **Responsibility:** convert `User` (entity) → `UserResponse` (DTO).
- **Why MapStruct instead of hand-written code:** at compile time, MapStruct generates a plain Java implementation of the `UserMapper` interface (matching fields by name) — no reflection at runtime, so it's as fast as hand-written mapping code but with none of the boilerplate or copy-paste bugs.

### Configuration — `config/` package
- **`SecurityConfig`** — the security filter chain, CORS policy, password encoder bean, security headers (HSTS, X-Frame-Options, referrer policy). This is the single most important file to read if you're changing *anything* about who can access what.
- **`JpaAuditingConfig`** — one line, `@EnableJpaAuditing`, which is what makes `@CreatedDate`/`@LastModifiedDate` on `BaseEntity` actually get populated.
- **`OpenApiConfig`** — registers the "bearerAuth" scheme in Swagger UI so you can paste a token in and try authenticated endpoints from `/swagger-ui.html`.

### Exceptions — `exception/` package
- **`ApiException`** — abstract base carrying an `HttpStatus`; every domain-specific exception (`EmailAlreadyInUseException`, `InvalidCredentialsException`, `AccountLockedException`, `EmailNotVerifiedException`, `InvalidOrExpiredTokenException`, `ResourceNotFoundException`) extends it and just supplies its status + message in its constructor.
- **`GlobalExceptionHandler`** (`@RestControllerAdvice`) — the single place, application-wide, where a thrown exception becomes an HTTP response:
  - `ApiException` → its own carried status + message.
  - `MethodArgumentNotValidException` (Bean Validation failures) → `400` with a `fieldErrors` list, one entry per invalid field.
  - `BadCredentialsException` (Spring Security's own) → `401`, generic message (never reveals *which* field was wrong).
  - `AccessDeniedException` → `403`.
  - Anything else (a genuine bug) → `500`, logged with the full stack trace server-side, but the client only ever sees "An unexpected error occurred" — internal details never leak into an API response.
  - Every response uses the same `ErrorResponse` shape, so frontend error handling (`apiErrorMessage()` in `hooks/useAuth.ts`) is a single generic function used everywhere, not one-off per endpoint.

---

## 8. Roles and permissions

Right now the model is intentionally simple: `User.Role` is an enum, `USER` or `ADMIN`, stored as a column and enforced two ways:
1. **URL-pattern based**, in `SecurityConfig`: `/api/v1/admin/**` requires `hasRole("ADMIN")`.
2. **Method-level**, available but not yet used: `@EnableMethodSecurity` is already turned on, so any future service/controller method can add `@PreAuthorize("hasRole('ADMIN')")` for authorization that doesn't map cleanly to a URL prefix.

`UserPrincipal.getAuthorities()` is what bridges the entity's `role` field into something Spring Security understands: `new SimpleGrantedAuthority("ROLE_" + user.getRole().name())`. Spring's `hasRole("ADMIN")` shorthand automatically expects a `ROLE_` prefix — this is a common gotcha if you ever add authorities by hand elsewhere.

There's no fine-grained permission system (e.g. "can edit resume #123") yet — that will show up as a per-resource ownership check once the Resume Builder feature exists (a resume belongs to a user; the service layer will check `resume.getUser().getId().equals(principal.getId())` rather than a generic role).

---

## 9. Validation and error handling, end to end

Two layers of validation exist, and they're intentionally duplicated:

1. **Frontend (Zod, `schemas/authSchemas.ts`)** — instant feedback before a network call is even made. The password rule (`passwordSchema` in that file) matches the backend's regex exactly: 8–72 chars, at least one lowercase, one uppercase, one digit.
2. **Backend (Jakarta Bean Validation, on the DTOs)** — the real gate. **Never trust the client** — anyone can call the API directly with curl, bypassing the frontend entirely, so the backend re-checks everything regardless of what the frontend already validated.

Backend validation failures never reach a controller method body — they're intercepted by Spring's argument resolution (because of `@Valid`) and turned into a `MethodArgumentNotValidException`, which `GlobalExceptionHandler.handleValidation()` catches and turns into:
```json
{
  "timestamp": "...",
  "status": 400,
  "error": "Bad Request",
  "message": "Validation failed",
  "path": "/api/v1/auth/register",
  "fieldErrors": [{ "field": "password", "message": "Password must contain at least one uppercase letter, one lowercase letter, and one digit" }]
}
```

There's a third layer worth calling out: **database constraints** (`CHECK` clauses in the Flyway migration, e.g. `ck_users_password_matches_provider`). These exist as a last line of defense in case application-level logic is ever bypassed (a bug, a raw SQL migration, direct DB access) — the schema itself refuses to allow inconsistent data (a `LOCAL` account with no password hash).

---

## 10. Database schema and relationships

Defined in `V1__init_auth_schema.sql`, run automatically by Flyway on startup (Hibernate is configured `ddl-auto: validate` — it checks the schema matches the entities but never modifies it; **Flyway migrations are the only way the schema changes**).

```
users (1) ──────< (many) refresh_tokens
users (1) ──────< (many) verification_tokens
users (1) ──────< (many) password_reset_tokens
```

All three child tables have `user_id UUID REFERENCES users(id) ON DELETE CASCADE` — if a user row were ever hard-deleted (it normally isn't, thanks to soft delete), their tokens go with it automatically.

Key columns on `users`:
- `email` — unique, indexed, the login identifier.
- `password_hash` — nullable (Google-only accounts have none), BCrypt-encoded.
- `provider` / `provider_id` — how the account authenticates (`LOCAL` or `GOOGLE`) and, for Google, the stable subject ID from their token.
- `role`, `email_verified`, `account_locked`, `failed_login_attempts` — the fields authorization and login logic read.
- `created_at`/`updated_at`/`deleted_at` — from `BaseEntity`, present on every table in the schema.

`refresh_tokens` additionally carries `token_hash` (unique), `expires_at`, `revoked`, `replaced_by_token_hash` (the rotation chain), and `user_agent`/`ip_address` (metadata for a future "manage your sessions" screen — not yet used by any endpoint).

Every foreign key and lookup column has an index (`idx_users_email`, `idx_refresh_tokens_token_hash`, etc.) — auth queries are on the hot path of literally every request, so they're all indexed from day one rather than added reactively later.

---

## 11. Docker and how the pieces talk to each other

`docker-compose.yml` at the repo root wires up four services for local development:

| Service | Image | Purpose |
|---|---|---|
| `postgres` | `postgres:16-alpine` | The database. Has a `healthcheck` so `backend` waits for it to actually be ready, not just started. |
| `redis` | `redis:7-alpine` | Reserved for caching/rate-limiting in later features; not load-bearing for Feature 1 (today's rate limiter is in-process, see §12). |
| `backend` | built from `backend/Dockerfile` | The Spring Boot API. |
| `frontend` | built from `frontend/Dockerfile` | The built React app, served by nginx. |

Two things make `backend` able to find `postgres`/`redis` **by service name** rather than `localhost`: Docker Compose puts every service on the same virtual network and gives each a DNS entry matching its service name, and `docker-compose.yml` overrides `DB_URL`/`REDIS_HOST` for the `backend` service specifically (`jdbc:postgresql://postgres:5432/resumeai`, `REDIS_HOST=redis`) — different from the `localhost` defaults in `application.yml`, which are for running the backend directly on your machine against services also running directly on your machine.

**`backend/Dockerfile`** is a multi-stage build: a `maven:3.9-eclipse-temurin-21` image compiles the jar (this stage never ships), and the final image is `eclipse-temurin:21-jre-alpine` (JRE only, no compiler, much smaller) running as a non-root `spring` user. Same pattern in **`frontend/Dockerfile`**: `node:20-alpine` builds the static bundle, then it's copied into an `nginx:1.27-alpine` image — the final container has no Node.js in it at all, just static files and nginx. `frontend/nginx.conf`'s `try_files $uri /index.html` is what makes client-side routes like `/reset-password` work on a hard refresh — nginx falls back to serving `index.html` for any path it doesn't recognize as a real file, and React Router takes it from there.

---

## 12. Configuration files, and what each one controls

- **`backend/src/main/resources/application.yml`** — the single source of truth for backend configuration. Almost every value is `${ENV_VAR:default}` — meaning it reads from an environment variable if set, otherwise falls back to a sane local-dev default. This is what lets the exact same jar run correctly in Docker Compose, on bare metal, and in production (Railway/Neon/Upstash) — only the environment variables change, never the code or this file.
- **`backend/src/test/resources/application-test.yml`** — overrides used only when the `test` Spring profile is active (see `@ActiveProfiles("test")` on `AuthControllerIntegrationTest`); keeps test JWT secrets etc. separate from real config.
- **`backend/.env.example`** — the template for `backend/.env` (gitignored, never committed) — every secret the app needs: `JWT_SECRET`, `GOOGLE_CLIENT_ID`/`SECRET`, `SMTP_*`, DB/Redis connection info.
- **`frontend/.env.example`** — `VITE_API_BASE_URL` and `VITE_GOOGLE_OAUTH_URL`; Vite only exposes env vars prefixed `VITE_` to client code, by design (anything without that prefix is a build-time-only secret that never ships to the browser).
- **`docker-compose.yml`** — local multi-service orchestration (see §11).
- **`backend/Dockerfile` / `frontend/Dockerfile`** — how each service's container image is built.
- **`frontend/nginx.conf`** — how the built frontend is served (SPA fallback routing, asset caching).

---

## 13. API endpoint reference

Base path: `/api/v1/auth`. Full interactive docs at `/swagger-ui.html` once running.

| Method & path | Auth | Request body | Success response |
|---|---|---|---|
| `POST /register` | None | `{fullName, email, password}` | `201` `{success, message, timestamp}` |
| `POST /login` | None | `{email, password}` | `200` `AuthResponse` (`accessToken`, `refreshToken`, `expiresInSeconds`, `user`) |
| `POST /refresh` | None (valid refresh token in body) | `{refreshToken}` | `200` `AuthResponse` (new pair) |
| `POST /logout` | None (valid refresh token in body) | `{refreshToken}` | `200` message |
| `POST /verify-email` | None | `{token}` | `200` message |
| `POST /resend-verification` | None | `{email}` | `200` message (always generic) |
| `POST /forgot-password` | None | `{email}` | `200` message (always generic) |
| `POST /reset-password` | None | `{token, newPassword}` | `200` message |
| `POST /change-password` | **Bearer token** | `{currentPassword, newPassword}` | `200` message |
| `GET /me` | **Bearer token** | — | `200` `UserResponse` |
| `PATCH /me` | **Bearer token** | `{fullName?, photoUrl?}` | `200` `UserResponse` |
| `DELETE /me` | **Bearer token** | — | `200` message |
| `GET /oauth2/authorization/google` | None | — | Redirects to Google, then back to the SPA |

Every error response (any 4xx/5xx) shares the `ErrorResponse` shape shown in §9.

---

## 14. Design patterns and architectural decisions, summarized

- **Layered architecture** (Controller → Service → Repository) — separates "what HTTP looks like" from "what the business rule is" from "how it's stored," so each can change independently and be tested independently.
- **DTO ⇄ Entity separation** via a dedicated Mapper — prevents internal/sensitive fields from ever accidentally serializing into an API response.
- **Repository pattern** via Spring Data JPA — no hand-written SQL for simple queries; the interface *is* the implementation contract.
- **Stateless authentication** (JWT, no server session) — horizontally scalable, no sticky sessions needed behind a load balancer.
- **Refresh token rotation with reuse detection** — a widely-recommended OAuth/OIDC pattern for detecting stolen refresh tokens without requiring short-lived tokens to be re-entered constantly.
- **Hash-only token storage** (refresh, verification, password-reset tokens) — a database leak alone is never enough to hijack a session or account.
- **Soft delete via a shared `BaseEntity`** — consistent, automatic (`@SQLRestriction`) across every table, rather than each service remembering to filter deleted rows.
- **Global exception handling** (`@RestControllerAdvice`) — one place defines the API's entire error contract; individual methods never format error JSON by hand.
- **Environment-variable-driven configuration** — the same artifact (jar or Docker image) is promoted through environments unchanged; only configuration changes.

---

## 15. Security considerations and best practices already in place

- Passwords: BCrypt, cost 12 — deliberately slow to resist offline brute-forcing of a leaked hash.
- Account lockout after 5 failed attempts, lifted only by password reset — blunts online brute-force/credential-stuffing.
- Per-IP rate limiting on `/register`, `/login`, `/forgot-password`, `/resend-verification` (`AuthRateLimitingFilter`) — the same threat, a different layer.
- No account-enumeration: `/forgot-password` and `/resend-verification` always return the same generic success message whether or not the email exists.
- Refresh tokens: opaque, hashed at rest, rotated on every use, reuse triggers full session-family revocation.
- OAuth tokens from Google are never exposed to the frontend; only ResumeAI's own tokens are.
- OAuth redirect carries tokens in the URL **fragment**, not the query string, so they never hit server access logs.
- CORS is locked to an explicit allow-list (`app.cors.allowed-origins`), not `*`.
- Security headers set on every response: HSTS, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`.
- CSRF protection is intentionally **disabled** — safe here specifically because the API is stateless and cookie-free (CSRF exploits ambient cookie-based auth; there's nothing ambient to exploit when every request needs an explicit bearer token the browser doesn't attach automatically).
- Global exception handler never leaks stack traces or internal messages for unexpected (`500`) errors to the client, only logs them server-side.

### Known trade-offs to be aware of (not bugs — deliberate, documented choices)
- The frontend persists both tokens to `localStorage` (see the comment in `store/authStore.ts`) for simplicity. This is vulnerable to token theft via XSS. A stronger posture — worth revisiting before this goes to production with real user data — is issuing the refresh token as an httpOnly, secure, SameSite cookie from the backend instead of returning it in the JSON body, so client-side JavaScript can never read it at all.
- `AuthRateLimitingFilter` keeps its buckets in an in-memory `ConcurrentHashMap`, which only works correctly with a single backend instance. Scaling to multiple replicas needs a shared store — Bucket4j's Redis extension is the natural fit, and Redis is already provisioned in `docker-compose.yml` for exactly this purpose, just not wired up yet.
