# Feature 7 — AI Summary Generator

Status: **complete on both backend and frontend. Frontend fully verified in
this environment (tsc, vitest, vite build); backend needs one local step
before you can trust it — see §7.**

First AI feature in ResumeAI (spec §9.1). Generates a 2–4 sentence
professional summary tailored to a chosen career level (Student, Fresher,
Junior, Mid-level, Senior, Architect), using whatever experience/education/
skills already exist on the resume as context. This also lays the shared
infrastructure — AI provider client, quota enforcement, prompt-builder
pattern — that Features 9.2–9.11 will reuse rather than reinvent.

## 1. Folder structure

```
backend/src/main/java/com/resumeai/
├── ai/                                    new package — AI provider integration layer
│   ├── OpenAiChatClient.java              interface — one reusable "send prompt, get JSON" call
│   ├── impl/OpenAiChatClientImpl.java     RestClient-based impl, retry + timeout handling
│   ├── CareerLevel.java                   shared enum (Student … Architect)
│   ├── dto/                               internal wire DTOs (not exposed at the API boundary)
│   │   ├── OpenAiMessage.java
│   │   ├── OpenAiChatCompletionRequest.java
│   │   ├── OpenAiChatCompletionResponse.java
│   │   └── SummaryGenerationResult.java   shape of the model's { "summary": "..." } output
│   └── prompt/
│       ├── SummaryGenerationContext.java  plain data holder (no JPA) passed to the prompt builder
│       └── SummaryPromptBuilder.java      builds the system + user prompt for summary generation
├── config/AiClientConfig.java             new — RestClient bean + app.ai.provider.* properties
├── exception/
│   ├── AiServiceException.java            new — 503 AI_SERVICE_UNAVAILABLE
│   └── AiQuotaExceededException.java      new — 429 AI_QUOTA_EXCEEDED
├── util/MonthlyWindow.java                new — shared "start of this UTC month" calc
├── service/
│   ├── AiUsageService(Impl).java          new — shared quota gate for every AI feature
│   └── AiSummaryService(Impl).java        new — assembles resume context, calls the AI client
├── dto/request/ai/GenerateSummaryRequest.java   new
├── dto/response/ai/GenerateSummaryResponse.java new
└── controller/AiSummaryController.java    new — POST /{resumeId}/ai/summary/generate

backend/src/main/java/com/resumeai/service/impl/DashboardServiceImpl.java
                                            refactored — now uses MonthlyWindow instead of
                                            its own inline start-of-month calc (no behavior change)

frontend/src/
├── types/ai.types.ts                      new — CareerLevel, GenerateSummaryRequest/Response
├── api/aiApi.ts                           new — aiSummaryApi.generate()
├── hooks/useAiSummary.ts                  new — useGenerateAiSummary() mutation
├── components/resume/ai/SummaryGeneratorPanel.tsx  new — inline "Generate with AI" panel
└── components/resume/PersonalInfoSection.tsx        extended — panel wired above the summary editor
```

No new Flyway migration — `ai_usage_logs` already exists from Feature 2's
dashboard scaffolding, including the `SUMMARY_GENERATOR` value in its
`feature` check constraint.

## 2. Database changes

None. Feature 7 writes to the existing `ai_usage_logs` table (one row per
successful generation, `feature = 'SUMMARY_GENERATOR'`) and the existing
`activity_events` table (`type = 'AI_FEATURE_USED'`). Both tables and their
indexes were created by `V2__dashboard_schema.sql`.

## 3. Backend implementation

**AI provider layer (`com.resumeai.ai`).** `OpenAiChatClient` is a single
reusable interface — `completeAsJson(systemPrompt, userPrompt)` — backed by
Spring's `RestClient` (built into Spring Framework 6.1 / Boot 3.3, no new
dependency). The impl:

- Requests OpenAI's `response_format: {"type": "json_object"}` mode so the
  model returns exactly one JSON object with no surrounding prose.
- Retries transient failures (`app.ai.provider.max-retries`, default 2) but
  fails fast on 4xx responses (bad key, bad request) since those won't
  succeed on retry.
- Applies a connect timeout and a read timeout (`app.ai.provider.*-timeout-ms`)
  via `JdkClientHttpRequestFactory`, so a hung provider call can't hang a
  request thread indefinitely.
- Throws `AiServiceException` (503) after exhausting retries, with the
  original exception attached as the cause for logging.

**Quota enforcement (`AiUsageService`).** Shared by every current and future
AI feature:

```java
aiUsageService.enforceQuota(user);   // throws AiQuotaExceededException (429) if over quota
// ... call the AI provider ...
aiUsageService.recordUsage(user, AiUsageLog.Feature.SUMMARY_GENERATOR);
```

The quota check runs *before* the paid provider call (so a user who's
already over quota never triggers a billable request), and usage is only
recorded *after* a successful generation (a failed AI call shouldn't cost
the user one of their monthly generations). Quota window and limit reuse the
same `app.ai.free-monthly-quota` property and month-boundary logic the
Dashboard's AI usage card already used — extracted into `MonthlyWindow` so
both stay in sync.

**Context assembly (`AiSummaryServiceImpl`).** Pulls up to 5 experience
entries, 2 education entries, and 12 skills (technical/soft/tool/framework/
database/programming-language sections) from the resume in its existing
display order, strips any HTML from rich-text fields, and hands them to
`SummaryPromptBuilder` along with the requested career level. If
`targetRole` isn't supplied, it falls back to the most recent experience
entry's position. If the resume has no data at all yet, the prompt still
produces a plausible level-appropriate summary rather than failing.

**Response parsing.** The model's JSON is parsed into
`SummaryGenerationResult` and validated (non-blank, under a generous length
ceiling) before being returned — malformed or empty output raises
`AiServiceException` rather than silently returning garbage. Per the
project's AI standards, generated content is treated as untrusted: it's
returned to the frontend for review, **not** auto-saved onto the resume.

## 4. API endpoints

| Method | Endpoint | Auth | Request | Response |
|---|---|---|---|---|
| POST | `/api/v1/resumes/{resumeId}/ai/summary/generate` | Required (owner only) | `{ careerLevel: CareerLevel, targetRole?: string, additionalContext?: string }` | `{ summary: string, aiUsageRemaining: number }` |

Error cases:
- `401` — not authenticated
- `404` — resume not found or not owned by the caller (`RESOURCE_NOT_FOUND`, existing convention)
- `400` — `careerLevel` missing/invalid, or `additionalContext` over 1000 chars (`VALIDATION_ERROR`)
- `429` — monthly AI quota exhausted (`AI_QUOTA_EXCEEDED`)
- `503` — AI provider unavailable/timed out/returned unusable output (`AI_SERVICE_UNAVAILABLE`)

`careerLevel` is one of `STUDENT | FRESHER | JUNIOR | MID_LEVEL | SENIOR | ARCHITECT`.

## 5. Frontend implementation

`SummaryGeneratorPanel` is embedded directly above the existing rich-text
summary editor in `PersonalInfoSection`. Collapsed by default (a small
"✨ Generate with AI" button); expands into a form (career level select,
optional target role, optional free-text context with a character counter)
plus a Generate/Regenerate action. On success, the suggestion is shown
inline with a "Use this summary" button that calls back into
`PersonalInfoSection`'s existing `set("summary")` handler — the same path
manual typing already goes through — so the generated text becomes part of
the normal unsaved-changes/save flow rather than a separate save path.

`useGenerateAiSummary` is a plain TanStack Query mutation (no query is
cached — each generation is a fresh call) that invalidates the `["dashboard"]`
query on success, since a successful generation changes the AI usage count
shown there.

Errors surface inline using the existing `apiErrorMessage`/`apiErrorCode`
helpers from `useAuth.ts` (already shared app-wide) — no new error-handling
pattern introduced.

## 6. UI implementation

- Collapsed by default so it doesn't crowd the summary field for users who'd
  rather write their own.
- Loading state ("Generating…") disables the button; error state renders in
  a small inline red banner; the quota-exceeded message is shown verbatim
  from the server since it already includes the reset timing.
- Dark mode, focus rings, and spacing follow the same Tailwind classes
  already used throughout `PersonalInfoSection` — no new design tokens.
- Accessible as plain form controls (`<select>`, `<input>`, `<textarea>`,
  `<button>`) with associated `<label>`s — no custom widgets.

## 7. Verification

**Frontend (verified in this environment):**
- `tsc -b --noEmit` → clean
- `vitest run` → **119/119 passing** (117 prior + 2 new: `useAiSummary.test.tsx`, success + error paths)
- `vite build` → clean

**Backend (needs local verification — no Maven Central access in this
sandbox):**
- Run `mvn test` locally. New tests:
  - `AiUsageServiceImplTest` — quota allow/deny at the boundary, usage
    recording, remaining-quota math (never negative).
  - `AiSummaryServiceImplTest` — happy path (usage recorded, activity
    logged, response shape), quota-exceeded short-circuits before the AI
    client is ever called, malformed/blank AI output rejected, target-role
    fallback to most recent experience position.
  - `AiSummaryControllerIntegrationTest` — full MockMvc + Testcontainers
    Postgres run: unauthenticated rejection, happy path with quota
    decrementing, 429 once quota (set to 2 for the test) is exhausted,
    503 surfaced when the (mocked) AI provider fails, 400 on missing
    `careerLevel`. Only `OpenAiChatClient` is mocked — quota logic, prompt
    assembly, and persistence all run for real against the test database.

## 8. Security considerations

- Ownership enforced the same way as every other resume sub-resource, via
  `ResumeService.getOwnedResumeOrThrow` — a user can't generate a summary
  for someone else's resume.
- The OpenAI API key is never hard-coded; it's read from `OPENAI_API_KEY`
  and only ever sent as an outbound `Authorization` header, never logged or
  returned to the client.
- 4xx responses from the AI provider (e.g. a bad API key) are logged
  server-side but surfaced to the user only as a generic 503 — no upstream
  error detail leaks through.
- Quota enforcement prevents a compromised or abusive account from running
  up unbounded AI spend; the check happens before the paid call is made.
- `additionalContext` is length-capped (1000 chars) client- and
  server-side, and is only ever used as prompt text sent to the model — it
  is never persisted or rendered as HTML.

## 9. Architectural decisions

- **Generation is stateless — no "AI summary" table.** The endpoint returns
  the suggestion for review; saving it reuses the existing resume details
  update endpoint. This avoids a second, parallel persistence/save path for
  AI-touched content and matches how Resume Import (spec §10) is expected
  to work: extract → review → save.
- **`RestClient` over adding an OpenAI SDK or WebFlux.** Boot 3.3 already
  ships `RestClient`; pulling in an SDK or `spring-webflux` (for
  `WebClient`) just to make synchronous JSON calls would violate the
  project's dependency-discipline rule for no real benefit at this stage.
  Streaming (spec's "streaming responses where appropriate") can be
  revisited per-feature later — the Summary Generator doesn't need it.
- **Manual retry loop over Resilience4j.** Two AI-specific retry
  scenarios (retry on 5xx/timeout, don't retry on 4xx) didn't justify a new
  dependency; the loop is ~15 lines and fully unit-testable as-is.
- **`AiUsageService` as its own service, not folded into `AiSummaryService`.**
  Every future AI feature (9.2–9.11) needs the identical
  enforce-then-record pattern; keeping it separate means each new AI
  service is a one-line `enforceQuota`/`recordUsage` pair instead of
  duplicated quota logic per feature.
- **`SummaryPromptBuilder` as its own class.** Keeps prompt text (which is
  likely to be iterated on for quality) out of the service that handles
  quota/persistence/HTTP, and establishes the shape (`*PromptBuilder` +
  a plain `*GenerationContext` record) that later AI features can follow.

## 10. Git commit message

```
feat(ai): add AI Summary Generator with shared AI provider client and usage quota service
```

## Verification checklist

- [x] No database changes needed; existing `ai_usage_logs`/`activity_events` reused correctly
- [x] API endpoint implemented and documented
- [x] Authentication enforced (`anyRequest().authenticated()`, unchanged)
- [x] Authorization/data ownership enforced via `getOwnedResumeOrThrow`
- [x] Request validation (`@NotNull` career level, `@Size` bounds)
- [x] Error handling — quota, provider failure, validation all mapped to distinct status codes/codes
- [x] Frontend integration wired into the existing summary editor
- [x] Loading / error / success states in the UI
- [x] Responsive, dark-mode-consistent styling matching existing components
- [x] Accessible plain form controls with labels
- [x] Backend unit + integration tests added (needs local `mvn test` to confirm green — no Maven Central in this sandbox)
- [x] Frontend: `tsc` clean, **119/119** tests passing, `vite build` clean
- [x] Security reviewed (§8)
- [x] Performance: timeouts + bounded retries on the AI call; context assembly is capped (5/2/12 items) so prompts stay small
- [x] Documentation added (this file)
- [x] No secrets committed — `OPENAI_API_KEY` etc. are all env-var-driven with safe empty defaults
- [x] No duplicate quota-window logic — `DashboardServiceImpl` refactored to share `MonthlyWindow`
- [x] Follows established architecture (controller → service → repository, typed API layer → hooks → components)
