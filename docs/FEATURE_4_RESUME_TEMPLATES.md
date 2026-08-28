# Feature 4 — Resume Templates

Status: **complete, awaiting your review before Feature 5.**

## 1. Folder structure

```
backend/src/main/java/com/resumeai/
├── entity/ResumeTemplate.java              catalog metadata only (see §2)
├── entity/Resume.java                       extended - now references a ResumeTemplate
├── repository/ResumeTemplateRepository.java
├── dto/response/resume/TemplateResponse.java
├── dto/request/resume/SelectTemplateRequest.java
├── service/TemplateService.java (+ impl)    catalog listing
├── service/ResumeService.java (+ impl)      extended - selectTemplate(...)
├── controller/TemplateController.java       GET /api/v1/templates (public)
├── controller/ResumeController.java         extended - PATCH .../template
└── main/resources/db/migration/V4__resume_templates_schema.sql

frontend/src/
├── types/template.types.ts
├── api/templateApi.ts, hooks/useTemplates.ts
├── components/templates/
│   ├── templateThemes.ts        20 theme presets (the actual design data)
│   ├── templateSections.tsx     shared, theme-aware section renderers
│   ├── ClassicLayout.tsx        single-column layout engine (13 templates)
│   ├── SidebarLayout.tsx        two-column layout engine (7 templates)
│   ├── TemplateRenderer.tsx     picks a layout engine, wraps it in an A4 page
│   └── sampleResume.ts          fixture data for gallery thumbnails
├── pages/resumes/TemplateGallery.tsx   browse & select, live mini previews
├── pages/resumes/ResumePreview.tsx     full A4 preview + Print/PDF
└── index.css                    extended - @page/@media print rules
```

## 2. Database changes

`V4__resume_templates_schema.sql` adds **`resume_templates`** (catalog: `key`, `name`, `category`, `is_ats_friendly`, `is_active`, `sort_order`) and a nullable `template_id` FK on `resumes` (`ON DELETE SET NULL`, so retiring a template never breaks a resume that used it - it just falls back to the default). The migration also seeds the required 20-template catalog.

**Deliberate boundary, stated plainly:** this table holds *only* display/identity metadata. Fonts, colors, and layout structure - the actual design - live entirely in frontend code (`templateThemes.ts`), keyed by the same `key` string. A template's look can be iterated on without a migration; the database's job is just "which templates exist, and which one is this resume using," which is also exactly what a future Admin Dashboard "manage templates" screen would need.

## 3. Backend implementation

- **`TemplateService.listActive()`** - one read-only query, mapped through `ResumeMapper`.
- **`ResumeService.selectTemplate(resumeId, userId, request)`** - reuses the same `getOwnedResumeOrThrow` ownership check every other resume mutation uses; a `null` `templateId` clears the selection, a real one is validated to exist before being set.
- **`GET /api/v1/templates` is public** (added to `SecurityConfig`'s allow-list) - browsing templates exposes no user data, and it means a future logged-out "browse our templates" marketing page needs zero new backend work.
- `ResumeResponse` and `ResumeSummaryResponse` both gained template info (`template` object on the full response, `templateKey` on the list summary) via one added `@Mapping` on `ResumeMapper.toSummaryResponse` and a new `toTemplateResponse` method - MapStruct handles the null-safety (no template selected) automatically.

## 4. Frontend implementation - the actual design work

Twenty visually distinct templates without twenty duplicated React components: this feature's central decision is a **theme-driven rendering engine**, not twenty bespoke ones.

- **`templateThemes.ts`** is 20 data objects (colors, font stacks, heading style, spacing density, photo shape, ATS-safe skills formatting), each keyed to match a seeded database row.
- **Two layout engines** (`ClassicLayout` for single-column, `SidebarLayout` for two-column-with-sidebar) consume a theme and render real resume data. Every template is one of these two structures with a different theme applied - which is also *honest*: Harvard, Stanford, ATS-Friendly, Corporate, Academic, Minimal, Compact, Elegant, Executive, Modern, Student, Monochrome, and Editorial are all, structurally, a centered/left-aligned header over stacked sections - they differ in typeface, color, heading treatment, and density, which is genuinely most of what distinguishes resume templates from each other in practice. Google, Apple, Developer, Creative, Dark, Two-Column Professional, and Timeline share the photo-sidebar structure instead.
- **`templateSections.tsx`** holds one renderer per resume section (Experience, Education, Skills, ...), shared by both layouts, so "how does an experience entry look" is defined once, not duplicated per layout engine.
- Font choice was deliberate, not just a performance shortcut: the classic academic/ATS templates (Harvard, Stanford, ATS-Friendly, Corporate) use Times New Roman/Arial/Georgia - genuinely more authentic to that genre than the app's own trendy display serif would be. Only 3 web fonts are loaded total (same ones from Feature 1), reused across all 20 themes.
- **`skillsLayout: "tags" | "lines"`** per theme: conservative/ATS-focused templates render skills as plain comma-separated text (safer for ATS parsers, more formal), the rest as pill chips.
- **Template Gallery** renders genuine miniature live previews (the real `TemplateRenderer`, scaled down via CSS transform, fed a representative sample resume) rather than static screenshot placeholders - what you see in the gallery is pixel-for-pixel what you'd get, just smaller.

## 5. API endpoints

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/api/v1/templates` | **No** (public) | List active templates in catalog order |
| PATCH | `/api/v1/resumes/{id}/template` | Yes | Set (`{"templateId": "..."}`) or clear (`{"templateId": null}`) a resume's template |

`GET /api/v1/resumes/{id}` (from Feature 3) now also returns a `template` object; `GET /api/v1/resumes` now also returns `templateKey` per resume.

## 6. Validation

`SelectTemplateRequest.templateId` is intentionally unconstrained (no `@NotNull`) since `null` is a valid, meaningful input (clear the selection). An unknown (non-null) template ID returns `404` via the same `ResourceNotFoundException` pattern used everywhere else.

## 7. Testing

- **`TemplateServiceImplTest`** - catalog listing maps correctly.
- **`ResumeServiceImplTest`** - selecting a template sets it; a `null` `templateId` clears an existing selection; an unknown template ID throws `ResourceNotFoundException`.
- **`ResumeControllerIntegrationTest`** (new case) - hits the *public* catalog endpoint with no `Authorization` header at all and confirms 20+ templates come back; finds the seeded `"modern"` template by key (proving the seed data, not just "any" ID); selects it on a real resume and confirms it shows up both on the full resume (`$.template.key`) and the list summary (`$[0].templateKey`); clears it and confirms it's gone.
- Frontend: type-checked (`tsc --noEmit`) and production-built (`vite build`) clean, same discipline as every prior feature.

```bash
cd backend && mvn test && mvn verify
cd frontend && npm run build
```

## 8. UI implementation

**A4 and print, concretely:** every rendered resume is a literal `210mm × 297mm` box (`TemplateRenderer`), so what's on screen matches what prints. `index.css` adds `@page { size: A4; margin: 0; }` and a `@media print` block that hides everything except the resume itself (`.resume-print-root`) - navigation, buttons, the app shell all disappear on print. The **"Print / Save as PDF"** button on the preview page calls the browser's native `window.print()`; choosing "Save as PDF" in that dialog is how PDF export works today.

**What's deliberately *not* here, and why:** the master prompt's later feature list separates **Live Preview** ("update instantly while editing, zoom, page breaks, print preview") and **Export** ("PDF, DOCX, HTML, Markdown, JSON") from Templates. This feature stays in its lane: correct A4/print CSS and a functioning print-to-PDF path satisfy "Templates must support A4, Multi-page, Print, PDF" as *template-level support*, not a full multi-format export pipeline. A one-click "Download PDF" button that doesn't open the OS print dialog (typically server-rendered via a headless browser) is Feature "Export"'s job; on-screen zoom controls and an explicit page-break visualization while editing is Feature "Live Preview"'s job. Multi-page itself needs no special handling here - content that exceeds one A4 page height simply continues, and the browser's print engine paginates automatically at the `@page` boundary.

## 9. Best practices applied

- **Theme/engine separation over duplication**: 20 templates as data, not 20 components - directly addresses "avoid duplicate code" for a feature that could easily have become the most repetitive part of the codebase.
- **Font choices matched to genre**, not just to the app's existing type system - Harvard shouldn't look like a SaaS landing page.
- **Public catalog endpoint** scoped deliberately (read-only, no user data) rather than defaulting everything to authenticated.
- **Print CSS isolates the printed artifact** (`.resume-print-root`) from the surrounding app chrome, rather than relying on the person to remember to hide the nav bar themselves.
- **Live gallery previews, not static images** - guarantees the gallery can never drift out of sync with what selecting a template actually produces.

## 10. Git commit message

```
feat(templates): implement resume template catalog and rendering engine

- Add resume_templates catalog table + template_id FK on resumes (V4),
  seeded with the required 20-template catalog
- Add TemplateService/TemplateController (public GET /api/v1/templates)
- Add ResumeService.selectTemplate (+ PATCH /resumes/{id}/template),
  reusing the existing ownership-check helper
- Extend ResumeResponse/ResumeSummaryResponse with template info
- Add TemplateServiceImplTest; extend ResumeServiceImplTest and
  ResumeControllerIntegrationTest for template selection (incl. public
  catalog access and seed-data verification)
- Add frontend template rendering engine: 20 theme presets
  (templateThemes.ts) driving two shared layout engines (Classic,
  Sidebar) and shared per-section renderers (templateSections.tsx) -
  no per-template bespoke components
- Add TemplateGalleryPage (live scaled-down previews via sample data)
  and ResumePreviewPage (full A4 render + Print/Save-as-PDF)
- Add @page/@media print rules (A4 sizing, app-chrome-free printing)
- Wire template selection + preview into the resume editor header
- Verified: frontend type-checks and production-builds clean
```
