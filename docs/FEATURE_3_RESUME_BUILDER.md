# Feature 3 — Resume Builder

Status: **complete, awaiting your review before Feature 4.**

## 1. Folder structure

```
backend/src/main/java/com/resumeai/
├── entity/
│   ├── Resume.java                        (extended - personal info + summary columns added)
│   ├── ResumeExperience.java               ResumeEducation.java
│   ├── ResumeProject.java                  ResumeProjectImage.java
│   ├── ResumeListItem.java                 (unified Skills/Interests/Spoken Languages)
│   ├── ResumeCertification.java            ResumeAward.java
│   ├── ResumePublication.java              ResumeVolunteerExperience.java
│   ├── ResumeReference.java
│   └── ResumeCustomSection.java            ResumeCustomSectionItem.java
├── repository/          one per entity above, all simple findByResume(OrderBySortOrderAsc)
├── dto/request/resume/  one request record per section (+ CreateResumeRequest, UpdateResumeDetailsRequest)
├── dto/response/resume/ one response record per section (+ ResumeResponse, ResumeSummaryResponse)
├── mapper/ResumeMapper.java                single MapStruct mapper covering every section
├── service/
│   ├── ResumeService.java (+ impl)         core lifecycle + full-aggregate assembly
│   ├── ResumeExperienceService.java        ResumeEducationService.java
│   ├── ResumeProjectService.java           ResumeListItemService.java
│   ├── ResumeCertificationService.java     ResumeAwardService.java
│   ├── ResumePublicationService.java       ResumeVolunteerExperienceService.java
│   ├── ResumeReferenceService.java         ResumeCustomSectionService.java
│   └── (10 lean concrete services - see §9 on why these skip the interface layer)
├── controller/
│   ├── ResumeController.java               core: create/list/get/update/delete
│   └── one controller per section, nested under /resumes/{resumeId}/...
└── main/resources/db/migration/V3__resume_builder_schema.sql

backend/src/test/java/com/resumeai/
├── service/ResumeServiceImplTest.java
├── service/ResumeExperienceServiceTest.java   (representative of all 10 section services)
└── integration/ResumeControllerIntegrationTest.java

frontend/src/
├── types/resume.types.ts
├── api/resumeApi.ts              core endpoints + generic section-API factory
├── api/resumeSectionsApi.ts      concrete instances for all 10 sections
├── hooks/useResumes.ts           core queries + generic section-mutations factory
├── components/resume/
│   ├── RichTextEditor.tsx         PersonalInfoSection.tsx
│   ├── ExperienceSection.tsx      ProjectsSection.tsx
│   ├── SkillsSection.tsx          CustomSectionsEditor.tsx
│   └── GenericListSection.tsx     (config-driven; powers 5 of the simpler sections)
└── pages/resumes/ResumeList.tsx   ResumeEditor.tsx
```

## 2. Database changes

`V3__resume_builder_schema.sql` does two things:

**Extends** the `resumes` table Feature 2 created with personal information + summary columns (`full_name`, `email`, `phone`, `address`, `linkedin_url`, `github_url`, `portfolio_url`, `website_url`, `photo_url`, `summary`) — exactly the `ALTER TABLE` Feature 2's documentation said would happen here.

**Adds 12 new tables**, one per resume section, every one a child of `resumes` with `ON DELETE CASCADE`: `resume_experiences`, `resume_education`, `resume_projects` (+ `resume_project_images`), `resume_list_items`, `resume_certifications`, `resume_awards`, `resume_publications`, `resume_volunteer_experiences`, `resume_references`, `resume_custom_sections` (+ `resume_custom_section_items`).

**One deliberate consolidation worth calling out:** Skills (Technical/Soft/Tools/Frameworks/Databases/Programming Languages), Interests, and Spoken Languages are all, structurally, "a labelled tag belonging to a resume" — so they share one table, `resume_list_items`, differentiated by a `section` column, with `proficiency` populated only for spoken languages. This avoids seven nearly-identical tables (and seven nearly-identical services/controllers) for what's functionally one concept with a category flag. Every other section got its own table because their fields are genuinely different (an education entry and a certification don't share a shape).

## 3. Backend implementation

- **`ResumeService`/`ResumeServiceImpl`** owns the aggregate root: create (seeding personal info from the account so the form isn't blank), list, full read (assembles all 10 sections into one `ResumeResponse` by querying each section repository), update core details, and soft delete. It also exposes `getOwnedResumeOrThrow(resumeId, userId)`, shared by every section service so ownership checking isn't reimplemented ten times.
- **Ten lean section services** (Experience, Education, Project, ListItem, Certification, Award, Publication, VolunteerExperience, Reference, CustomSection) each do add/update/delete scoped to a resume the caller owns. Every one follows the same shape: load the owned resume, load-and-verify the child entity belongs to that resume (this is the IDOR — Insecure Direct Object Reference — protection: a child entity ID alone is never enough, it must also belong to a resume owned by the caller), apply the change, save.
- **`ResumeMapper`** is one MapStruct interface with a mapping method (and its list variant) per section, rather than 10+ mapper files, since none of the mappings need custom logic beyond what MapStruct infers from matching field names.
- Creating a resume now also calls `ActivityEventService.record(...)` (the hook Feature 2 introduced), so "Recent activity" and the resume count on the Dashboard both reflect real usage immediately — verified directly in the integration test.

## 4. Frontend implementation

- **`resumeApi.ts`** exports a `createSectionApi<TRequest, TResponse>(sectionPath)` factory — since all 10 backend sections expose the same add/update/delete shape, the frontend API layer doesn't hand-write it 10 times either. `resumeSectionsApi.ts` instantiates it once per section, plus the two with nested children (Projects' images, Custom Sections' items) get a couple of extra methods appended.
- **`useResumes.ts`** mirrors that with a generic `useSectionMutations` hook wrapping any section API in `add`/`update`/`remove` TanStack Query mutations that invalidate the resume query on success.
- **`GenericListSection`** is a config-driven component (pass a list of `{name, label, type}` field definitions) that powers Certifications, Awards, Publications, Volunteer Experience, and References — five sections, one component. Experience, Education (via `GenericListSection` with a `number` field for CGPA), Projects, and Skills got bespoke components because they have real structural differences (current-job toggle, image sub-list, category grouping) that don't fit a generic config.
- **`RichTextEditor`** is a small `contentEditable`-based component (bold/italic/bullet list via `document.execCommand`) rather than pulling in a rich-text library outside the agreed stack — it's genuinely all the summary field needs.
- **`SkillsSection`** renders the eight `resume_list_items` categories as tag inputs (type + Enter to add), with spoken languages getting an extra proficiency dropdown — one component instead of eight.

## 5. API endpoints

Base: `/api/v1/resumes` (all require a Bearer token).

| Method | Path | Purpose |
|---|---|---|
| POST | `/resumes` | Create a resume (title optional, defaults to "Untitled Resume") |
| GET | `/resumes` | List the user's resumes, most recently updated first |
| GET | `/resumes/{id}` | Full resume with every section |
| PUT | `/resumes/{id}` | Update title, personal info, and summary |
| DELETE | `/resumes/{id}` | Soft-delete a resume |
| POST/PUT/DELETE | `/resumes/{id}/experience[/{id}]` | Experience entries |
| POST/PUT/DELETE | `/resumes/{id}/education[/{id}]` | Education entries |
| POST/PUT/DELETE | `/resumes/{id}/projects[/{id}]` | Projects |
| POST/DELETE | `/resumes/{id}/projects/{id}/images[/{id}]` | Project images |
| POST/PUT/DELETE | `/resumes/{id}/list-items[/{id}]` | Skills, Interests, Spoken Languages |
| POST/PUT/DELETE | `/resumes/{id}/certifications[/{id}]` | Certifications |
| POST/PUT/DELETE | `/resumes/{id}/awards[/{id}]` | Awards |
| POST/PUT/DELETE | `/resumes/{id}/publications[/{id}]` | Publications |
| POST/PUT/DELETE | `/resumes/{id}/volunteer-experience[/{id}]` | Volunteer experience |
| POST/PUT/DELETE | `/resumes/{id}/references[/{id}]` | References |
| POST/PUT/DELETE | `/resumes/{id}/custom-sections[/{id}]` | Custom sections |
| POST/PUT/DELETE | `/resumes/{id}/custom-sections/{id}/items[/{id}]` | Custom section items |

Every response (except `ResumeSummaryResponse` from list) returns the affected sub-tree — e.g. adding a project image returns the whole `Project` (with its updated `images` array), so the frontend never needs a second round trip to see the result.

## 6. Validation

Every request DTO carries Bean Validation matching its DB column: `@NotBlank` on required text fields (company, position, school, title, name, organization...), `@Size(max=...)` matching each `VARCHAR` length exactly, `@Email` on email fields, `@DecimalMin/@DecimalMax(0-10)` on CGPA. A day-to-day example of defense in depth from this feature: marking an experience entry "current" always clears its `endDate` server-side (`ResumeExperienceService.apply`), regardless of what the client sent — so the data can't end up contradicting itself (current job with an end date in the past) even if the frontend has a bug.

## 7. Testing

- **`ResumeServiceImplTest`** — title defaulting, personal-info seeding from the account, ownership-check failure, full-aggregate assembly with every section empty, soft delete, and full details update.
- **`ResumeExperienceServiceTest`** — representative of the pattern shared by all 10 section services: successful add, the current-job → null-end-date rule, and (critically) the **IDOR test**: updating an experience entry whose `resume_id` doesn't match the resume in the URL throws `ResourceNotFoundException`, not a silent cross-resume update.
- **`ResumeControllerIntegrationTest`** (Testcontainers) — the full lifecycle against real Postgres: create → verify personal info was seeded → update core details → add experience/education/a project with an image/a skill → read back the full aggregate and confirm every section is populated → **cross-feature check**: hit `/api/v1/dashboard` and confirm `resumeCount` is now `1` and profile completion moved from 33% to 67% (creating a resume satisfies that step) → delete → confirm it's gone from the list and returns `404`. A second test confirms one user can never fetch another user's resume by ID.

```bash
cd backend
mvn test      # unit tests
mvn verify     # + all integration test classes (Auth, Dashboard, Resume)
```

**Frontend verification:** unlike the Java backend (no reachable Maven repository in the environment this was built in), the frontend's dependencies were installable, so this feature's code was actually type-checked (`tsc --noEmit`, zero errors across all three features) and production-built (`vite build`, succeeds) rather than only reviewed by eye. Two real bugs were caught and fixed this way: a missing `vite-env.d.ts` (so `import.meta.env` wasn't typed - a gap from Feature 1 too) and a missing `placeholder` prop on one local input component.

## 8. UI implementation

The editor is a single page with a horizontal tab bar (Personal Info, Experience, Education, Projects, Skills, Certifications, Awards, Publications, Volunteer, References, Custom Sections) rather than a multi-step wizard — resumes get revisited and edited out of order, so jumping straight to one section matters more than a linear flow. No visual resume preview or template rendering yet — that's Features 4 and 5 (Templates, Live Preview) by design; this feature is purely the data layer and editing forms.

## 9. Best practices applied

- **IDOR protection everywhere**: every section service verifies the child entity belongs to a resume owned by the calling user - a valid access token plus a guessed/enumerated child ID is never enough on its own (covered explicitly in `ResumeExperienceServiceTest`).
- **Consolidation where the domain genuinely repeats, not before**: `resume_list_items` unifies eight structurally-identical concepts into one table/entity/service/controller; `GenericListSection` does the same on the frontend for five sections. Sections that only *look* similar but differ structurally (Experience's current-job logic, Projects' image sub-list) got bespoke code instead of being forced into the generic shape.
- **Convention deviation, stated plainly**: the 10 section services skip the interface+impl split every other service in this codebase uses (`AuthService`, `DashboardService`, `ResumeService` all have one). For thin, single-implementation CRUD services, Mockito mocks the concrete class directly in tests just as easily, and an interface with exactly one implementation forever wasn't earning its keep here. If a second implementation is ever needed, adding the interface later is a mechanical change.
- **Soft delete stays consistent**: every new entity extends `BaseEntity`, same as Features 1 and 2 - deleting a resume, an experience entry, or a project image never hard-deletes a row.
- **No premature ordering/drag-and-drop UI**: every section has a `sortOrder` column (schema-ready), but the reorder endpoints and drag-and-drop interactions are explicitly left for the Drag and Drop feature later in the build order, matching how the master prompt itself separates these into different features.

## 10. Git commit message

```
feat(resume-builder): implement full resume data model and editor

- Extend resumes table with personal info + summary columns (V3 migration)
- Add 12 child tables for every resume section, including a unified
  resume_list_items table covering Skills/Interests/Spoken Languages
- Add ResumeService (core lifecycle + full-aggregate assembly) and 10 lean
  section services, all sharing ResumeService's ownership-check helper
  (IDOR protection on every child-entity mutation)
- Add ResumeMapper (single MapStruct interface, all sections)
- Add ResumeController + 10 nested section controllers
  (POST/PUT/DELETE under /resumes/{id}/{section})
- Wire resume creation into ActivityEventService (Feature 2's activity feed)
- Add ResumeServiceImplTest, ResumeExperienceServiceTest (IDOR-focused),
  ResumeControllerIntegrationTest (full lifecycle + cross-feature Dashboard check)
- Add React resume editor: tabbed sections, RichTextEditor, generic
  createSectionApi/useSectionMutations factories, GenericListSection
  (config-driven, powers 5 sections), bespoke Experience/Education/
  Projects/Skills components
- Add vite-env.d.ts (fixes import.meta.env typing, a gap from Feature 1)
- Verified: full frontend type-checks clean and production-builds
  successfully across Features 1-3
```
