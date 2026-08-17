# Feature 2 — Dashboard

Status: **complete, awaiting your review before Feature 3.**

## 1. Folder structure

```
backend/src/main/java/com/resumeai/
├── entity/
│   ├── Resume.java                 (new - minimal, Resume Builder extends later)
│   ├── CoverLetter.java             (new - minimal)
│   ├── AtsAnalysis.java             (new - minimal)
│   ├── AiUsageLog.java              (new)
│   └── ActivityEvent.java           (new - cross-feature activity feed)
├── repository/
│   ├── ResumeRepository.java
│   ├── CoverLetterRepository.java
│   ├── AtsAnalysisRepository.java
│   ├── AiUsageLogRepository.java
│   └── ActivityEventRepository.java
├── dto/response/DashboardResponse.java   (Welcome/AiUsage/ActivityItem/ProfileCompletion nested records)
├── controller/DashboardController.java
├── service/
│   ├── ActivityEventService.java (+ impl)
│   └── DashboardService.java (+ impl)
└── main/resources/db/migration/V2__dashboard_schema.sql

backend/src/test/java/com/resumeai/
├── service/DashboardServiceImplTest.java
└── integration/DashboardControllerIntegrationTest.java

frontend/src/
├── types/dashboard.types.ts
├── api/dashboardApi.ts
├── hooks/useDashboard.ts
├── components/
│   ├── layout/AppShell.tsx          (new - header nav + logout, used by every authenticated page)
│   └── dashboard/
│       ├── WelcomeCard.tsx
│       ├── StatCards.tsx            (StatCard + AiUsageCard)
│       ├── RecentActivity.tsx
│       └── QuickActions.tsx
├── pages/
│   ├── Dashboard.tsx                (replaces the Feature 1 placeholder)
│   └── ComingSoon.tsx               (placeholder for routes owned by later features)
└── routes/AppRouter.tsx             (updated)
```

## 2. Database changes

`V2__dashboard_schema.sql` adds five tables: **resumes**, **cover_letters**, **ats_analyses**, **ai_usage_logs**, **activity_events**.

This deserves an explicit callout since it's the one non-obvious decision in this feature: the Dashboard needs to *count* resumes, cover letters, and ATS analyses, and show AI usage — but Resume Builder, the Cover Letter Generator, and the ATS Optimizer are all features later in the build order. Rather than mock these numbers, each table is created now with **only the columns Dashboard needs** (`id`, `user_id`, `title`, timestamps). When Resume Builder ships, it will add a migration like:
```sql
ALTER TABLE resumes ADD COLUMN template_id UUID REFERENCES templates(id);
ALTER TABLE resumes ADD COLUMN content JSONB;
```
— extending the table, never redefining it. This is normal incremental schema evolution, not a shortcut: the counts you see on the dashboard today are real `COUNT(*)` queries against real (if currently always-empty) tables, not hardcoded numbers.

`activity_events` is the one genuinely new concept: an **append-only feed** any feature writes to via `ActivityEventService.record(user, type, title)`. Dashboard only ever reads from this one table — it doesn't need to know anything about how a resume or cover letter is structured to show "Resume created" in the feed.

**One cross-feature touch to note:** `AuthServiceImpl` (Feature 1) now also calls `activityEventService.record(...)` on `register()` and `updateProfile()`, so "Recent activity" isn't empty for a brand-new account. This is the pattern every future feature will follow.

## 3. Backend implementation

- **`DashboardService`/`DashboardServiceImpl`** — a single method, `getDashboard(userId, activityLimit)`, that loads the user once and fans out to five repositories to build one `DashboardResponse`. Runs `@Transactional(readOnly = true)` — nothing here mutates data (aside from the activity feed, which is written by other services, not this one).
- **`ActivityEventService`/`ActivityEventServiceImpl`** — the small, reusable service described above.
- **AI usage quota** is a placeholder: `app.ai.free-monthly-quota` (default 50, configurable via `AI_FREE_MONTHLY_QUOTA` env var), applied uniformly to every account. This is explicitly a stand-in for real plan-based limits once a Subscriptions/Billing feature exists — see the code comment on `DashboardServiceImpl.freeMonthlyAiQuota`.
- **Profile completion** is computed, not stored: three checks (email verified, has a profile photo, has created at least one resume) → `percentage = completed/3 * 100`, plus a `missingSteps` list of human-readable next actions. As more of the app is built, this is the natural place to add more checks (e.g. "add work experience") without any migration.

## 4. Frontend implementation

- **`AppShell`** — the header/nav/user-menu/logout shell every authenticated page (starting with Dashboard) renders inside. Reuses `useLogout` from Feature 1 unchanged.
- **`useDashboard`** — one TanStack Query hook, one network call, feeding every widget on the page.
- Widgets are pure presentational components (`WelcomeCard`, `StatCard`/`AiUsageCard`, `RecentActivity`, `QuickActions`) that take already-fetched data as props — no widget makes its own API call.
- **Quick Actions is intentionally backend-free** — it's four static navigation links (New resume, Write a cover letter, Run an ATS check, Practice interview questions), not user data, so there's no endpoint behind it. Each target route currently resolves to `ComingSoonPage` until its owning feature ships.
- Loading state is a skeleton (not a spinner) shaped like the real layout, and there's an explicit retry affordance on error — no silent failures.

## 5. API endpoints

| Method | Path | Auth required | Query params |
|---|---|---|---|
| GET | `/api/v1/dashboard` | Yes (Bearer token) | `activityLimit` (optional, 1-50, default 10) |

**Response shape (`DashboardResponse`):**
```json
{
  "welcome": { "fullName": "Grace Hopper", "photoUrl": null, "memberSince": "2026-07-29T10:00:00Z" },
  "resumeCount": 0,
  "coverLetterCount": 0,
  "atsAnalysisCount": 0,
  "aiUsage": { "used": 0, "monthlyLimit": 50, "remaining": 50, "resetsAt": "2026-08-01T00:00:00Z" },
  "recentActivity": [
    { "id": "...", "type": "ACCOUNT_CREATED", "title": "Account created", "createdAt": "2026-07-29T10:00:00Z" }
  ],
  "profileCompletion": { "percentage": 33, "missingSteps": ["Add a profile photo", "Create your first resume"] }
}
```

## 6. Validation

- `activityLimit` is validated with `@Min(1) @Max(50)` on the `@RequestParam`, enforced via `@Validated` on the controller class. Out-of-range values now correctly return `400` — this required one addition to `GlobalExceptionHandler`: a handler for `ConstraintViolationException` (query/path param validation raises a different exception type than `@Valid` request-body validation does).
- No request body on this endpoint, so no DTO-level validation is needed here.

## 7. Testing

- **`DashboardServiceImplTest`** (Mockito): missing-user handling, profile-completion percentage/messages in both the fully-complete and fully-incomplete cases, AI usage quota math, and activity-event-to-DTO mapping.
- **`DashboardControllerIntegrationTest`** (Testcontainers): unauthenticated request → `401`; a full register→verify→login→dashboard flow against real Postgres, asserting zero counts, the `ACCOUNT_CREATED` activity entry produced by registration, and a 33% profile-completion score; an out-of-range `activityLimit` → `400`.

```bash
cd backend
mvn test      # unit tests (now covers Auth + Dashboard)
mvn verify     # + both integration test classes
```

## 8. UI implementation

Continues the design language from Feature 1 (Fraunces display type, Inter body, single indigo accent) rather than introducing a new one. The welcome card doubles as the profile-completion nudge so there's one clear "do this next" surface instead of scattering it. Stat cards are clickable links (to their eventual feature pages, currently `ComingSoonPage`) so the dashboard reads as a launchpad, not just a report.

## 9. Best practices applied

- **No mock data anywhere** — every number on the dashboard is a real query against a real (if currently mostly-empty) table.
- Single aggregated endpoint (one network round trip) instead of the frontend making four separate calls and waterfalling.
- Read-only transaction boundary (`@Transactional(readOnly = true)`) on the one method that only reads.
- The activity feed is a generically reusable pattern (`ActivityEventService`), not a Dashboard-only concern — every future feature calls the same one method.
- Config-driven quota (`app.ai.free-monthly-quota`) rather than a hardcoded magic number, so it's a one-line change (or already an env var) when it needs to move.

## 10. Git commit message

```
feat(dashboard): implement post-login dashboard

- Add minimal resumes/cover_letters/ats_analyses/ai_usage_logs schema (V2)
  that later features (Resume Builder, Cover Letter Generator, ATS Optimizer)
  will extend, not redefine
- Add activity_events table + ActivityEventService as a reusable,
  cross-feature "record something dashboard-worthy happened" hook
- Wire ActivityEventService into AuthServiceImpl (register, updateProfile)
  so Recent Activity isn't empty for new accounts
- Add GET /api/v1/dashboard aggregating welcome info, resume/cover-letter/
  ATS counts, AI usage (config-driven placeholder quota), recent activity,
  and computed profile completion
- Add ConstraintViolationException handling to GlobalExceptionHandler for
  @RequestParam validation
- Add DashboardServiceImplTest and DashboardControllerIntegrationTest
- Add React dashboard: AppShell (nav + logout), WelcomeCard, StatCard,
  AiUsageCard, RecentActivity, QuickActions, loading skeleton + error state
- Add ComingSoonPage + placeholder routes so dashboard links don't dead-end
  before their owning features exist
```
