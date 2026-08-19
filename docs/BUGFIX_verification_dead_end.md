# Bugfix — unverified-account dead end

**Reported:** After registering, if the verification link expires (or the tab
is closed) before verifying, the user was stuck:
- Registering again → `409 EMAIL_ALREADY_IN_USE` ("account already exists")
- Logging in → `403 EMAIL_NOT_VERIFIED` ("please verify your email")
- No reachable way to get a new verification link, since the only resend UI
  was the `/check-your-email` page, which only worked if it still had the
  email in React Router navigation state - lost on tab close, refresh, or
  bookmarking.

## Root cause

`AuthServiceImpl.register()` treated **any** existing row for that email as a
hard conflict, with no distinction between "this account is already active"
and "this account was created but abandoned before verification." Separately,
`CheckYourEmailPage`'s resend button was `disabled={!email}` with no fallback
if `email` wasn't present in navigation state - a dead end by construction.

## Fix

**Backend** (`AuthServiceImpl.register`): if the existing account is a local,
**unverified** account, register now issues a fresh verification token and
resends the email instead of throwing - the same recovery a person would
expect from "trying again." Verified accounts, and any Google-linked account,
still correctly throw `EmailAlreadyInUseException`. This is safe: completing
verification still requires access to the inbox, so this can't be used to
take over an account someone else registered, and the existing password is
never touched by a repeat registration attempt.

**API contract**: `ApiException`/`ErrorResponse` gained a stable `code` field
(`EMAIL_NOT_VERIFIED`, `EMAIL_ALREADY_IN_USE`, `ACCOUNT_LOCKED`,
`INVALID_CREDENTIALS`, `INVALID_OR_EXPIRED_TOKEN`, `VALIDATION_ERROR`, ...) so
the frontend can branch on *what* went wrong instead of matching message text
(fragile, and breaks under localization).

**Frontend**:
- `LoginPage` now detects `EMAIL_NOT_VERIFIED` specifically and shows an
  inline "Resend verification email" action right there - no navigation
  required, and the email is already known (just typed into the login form).
- `CheckYourEmailPage` no longer strictly requires navigation state: it also
  accepts a `?email=` query param, and if neither is present, shows a plain
  email field so the page works from a bookmark, a fresh tab, or a shared link.
- `LoginPage` also gained a persistent, always-visible "Didn't get a
  verification email?" link to `/check-your-email`, so the recovery path is
  discoverable even before a login attempt fails.

## Tests added/updated

- `AuthServiceImplTest`: verified-duplicate still conflicts; Google-linked
  duplicate still conflicts; **unverified-duplicate now resends** (no new
  user row, password untouched, one verification email sent).
- `AuthControllerIntegrationTest`: `registerRejectsDuplicateEmail` (assumed
  the old, buggy behavior) replaced with
  `registerResendsVerificationInsteadOfConflictWhenUnverified` (full loop:
  register → register again → verify with the *second* link → log in
  successfully) and `registerRejectsDuplicateOnceEmailIsVerified` (confirms
  the conflict path still exists once the account is actually verified,
  including asserting `code == "EMAIL_ALREADY_IN_USE"`).

Frontend changes were type-checked (`tsc --noEmit`) and production-built
(`vite build`) clean after this fix, same as the rest of the codebase.
