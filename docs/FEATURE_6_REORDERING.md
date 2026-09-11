# Feature 6 — Drag-and-Drop Reordering

Status: **complete on both backend and frontend. Frontend fully verified in
this environment; backend needs one local step before you can trust it —
see §7.**

Adds drag-and-drop reordering for: Experience entries, Projects, Skills/
Tools/Frameworks/Languages/Interests (each as its own group), and — new to
this feature — the top-level *sections* of the resume itself (Experience
before Education before Projects, etc.), which previously had no backing
data at all and was simply hardcoded in the two layout engines.

## 1. Folder structure

```
backend/src/main/java/com/resumeai/
├── entity/Resume.java                    extended - sectionOrder column + SectionKey enum
├── util/
│   ├── SectionOrderCodec.java            new - encode/decode/validate the section_order CSV
│   └── ReorderSupport.java               new - shared "validate ids are an exact permutation" helper
├── exception/InvalidReorderException.java new - 400 INVALID_REORDER
├── dto/request/resume/
│   ├── ReorderRequest.java               new - { orderedIds } for Experience/Projects
│   ├── ReorderListItemsRequest.java      new - { section, orderedIds } for one skill group
│   └── SectionOrderRequest.java          new - { sectionOrder } for the top-level sections
├── dto/response/resume/ResumeResponse.java  extended - + sectionOrder
├── service/
│   ├── ResumeService(Impl).java          extended - + reorderSections()
│   ├── ResumeExperienceService.java      extended - + reorder()
│   ├── ResumeProjectService.java         extended - + reorder()
│   └── ResumeListItemService.java        extended - + reorder(), scoped to one Section group
└── controller/
    ├── ResumeController.java             + PATCH /{resumeId}/sections/reorder
    ├── ResumeExperienceController.java   + PATCH /{resumeId}/experience/reorder
    ├── ResumeProjectController.java      + PATCH /{resumeId}/projects/reorder
    └── ResumeListItemController.java     + PATCH /{resumeId}/list-items/reorder

backend/src/main/resources/db/migration/
└── V5__section_and_item_reordering.sql   new - adds resumes.section_order

frontend/src/
├── lib/reorderUtils.ts                   new - pure moveItem/reorderById/idsOf (no dnd-kit, no DOM)
├── components/resume/dnd/
│   ├── SortableItem.tsx                  new - useSortable wrapper + <DragHandle/>
│   └── SortableList.tsx                  new - generic DndContext+SortableContext wrapper
├── components/resume/
│   ├── ExperienceSection.tsx             extended - onReorder + drag handles
│   ├── ProjectsSection.tsx               extended - onReorder + drag handles (row extracted to ProjectRow)
│   ├── SkillsSection.tsx                 extended - draggable pills (TagGroup) + draggable rows (LanguageGroup)
│   └── SectionOrderPanel.tsx             new - drag the 10 top-level sections into a new order
├── components/templates/
│   ├── templateSections.tsx              extended - + orderedSections() helper
│   ├── ClassicLayout.tsx                 extended - renders sections via orderedSections()
│   ├── SidebarLayout.tsx                 extended - same, minus Skills/Certifications (pinned to sidebar)
│   └── sampleResume.ts                   fixed - now includes sectionOrder (tsc caught this)
├── hooks/useReorder.ts                   new - 3 optimistic-update mutations (see §5)
├── api/resumeApi.ts                      extended - + reorderSections
├── api/resumeSectionsApi.ts              extended - + .reorder on every section, list-items scoped by section
├── types/resume.types.ts                 extended - + sectionOrder, SECTION_KEYS, SECTION_LABELS
└── pages/resumes/ResumeEditor.tsx        extended - wires every onReorder, + "Section Order" tab
```

## 2. Database changes

One migration, `V5__section_and_item_reordering.sql`:

```sql
ALTER TABLE resumes
    ADD COLUMN section_order VARCHAR(500) NOT NULL DEFAULT
        'EXPERIENCE,EDUCATION,PROJECTS,SKILLS,CERTIFICATIONS,AWARDS,PUBLICATIONS,VOLUNTEER,REFERENCES,CUSTOM_SECTIONS';
```

That's the only new column this feature needed. Item-level reordering
(Experience, Projects, Skills) already had a `sort_order` column on every
relevant table since Feature 3 — this feature exposes it via new endpoints
rather than adding new storage for it. Stored as a comma-separated string
rather than a join table: it's always read and written as one complete
ordering for one resume, never filtered or queried by individual key, so a
join table would add joins for no benefit. `NOT NULL DEFAULT` backfills
every existing resume with the exact order the layouts already rendered in,
so nothing changes visually for existing users until they actually drag
something.

## 3. What's actually reorderable (and what deliberately isn't)

Four independent things, each with its own endpoint and its own drag
surface in the UI:

- **Experience entries** — one flat list, `PATCH /experience/reorder`.
- **Projects** — one flat list, `PATCH /projects/reorder`.
- **Skills/Tools/Frameworks/Databases/Programming Languages/Interests/Spoken
  Languages** — these render as **independent groups** (see
  `SkillsSection.tsx`), so reordering is scoped to one group at a time:
  `PATCH /list-items/reorder` takes `{ section, orderedIds }`, not a
  whole-table reorder. Dragging a "React" pill only ever reorders it among
  the other Technical Skills, never against Tools or Spoken Languages.
- **Section order** (new concept) — the order Experience/Education/
  Projects/Skills/.../Custom Sections render in on the actual resume.
  `PATCH /sections/reorder` takes the full ordered list of all 10 section
  keys at once (it's rejected if it isn't an exact permutation — see §4).

**Deliberately out of scope for this pass**: Education, Certifications,
Awards, Publications, Volunteer Experience, and References all still use
the generic `GenericListSection` component and don't have drag-and-drop
yet. They're no less deserving of it, but adding it to a shared generic
component affects six section types at once and felt like its own
follow-up rather than something to fold silently into this feature. Their
`sort_order` columns already exist, so wiring drag-and-drop onto them later
is the same shape of work as everything in this feature, not a new
architecture.

**Also out of scope, structurally rather than by choice**: in the sidebar
template layout (`SidebarLayout.tsx`), Skills and Certifications render
fixed inside the sidebar column, not the reorderable main column — that's
a structural property of that specific template (a two-tone sidebar design
where certain content always lives in the colored panel), not a limitation
of the reordering feature. The section-order drag list still lets you
reorder them; `SidebarLayout` just doesn't have a slot to place SKILLS or
CERTIFICATIONS anywhere but the sidebar, so `orderedSections()` simply
never receives those two keys for that layout, and skips them.

## 4. Backend: validate-then-apply, not best-effort

Every reorder endpoint takes the *entire* ordered list of ids (or section
keys) for the thing it's reordering, not just "move id X to position N."
`ReorderSupport.reorder(existing, orderedIds, idExtractor)` (used by
Experience, Projects, and Skills) and `SectionOrderCodec.validate(...)`
(used by sections) both reject the request outright — throwing
`InvalidReorderException` → HTTP 400 `INVALID_REORDER` — if the ids/keys
given aren't an exact permutation of what actually exists: nothing missing,
nothing duplicated, nothing foreign. This was a deliberate choice over a
"best effort" reorder that silently drops or duplicates an item on a stale
or malformed request — losing someone's resume content silently is a much
worse failure mode than a rejected PATCH the frontend can retry.

`sortOrder` is then reassigned as the 0-based index in the validated list —
simple, and correct even if the previous ordering had gaps or duplicates
from something else going wrong earlier.

## 5. Frontend: optimistic updates

Every drag needs to feel instant, not "drop and wait for a round trip."
`hooks/useReorder.ts` has three mutations, all following the same shape:

1. `onMutate`: cancel in-flight queries for this resume, snapshot the
   current cache, write the reordered array straight into the
   `["resumes", resumeId]` cache (with `sortOrder` reassigned client-side
   to match), return the snapshot.
2. `onError`: roll the cache back to the snapshot if the PATCH fails.
3. `onSettled`: invalidate the query either way, so the cache is
   reconciled with whatever the server actually persisted.

`useReorderListItems` additionally has to reorder *only* the dragged
group's items in the cache and leave every other group's items untouched
(mirrors the backend's per-group scoping in §3). `useReorderSections` is
the simplest of the three — it just swaps in the new key order directly.

## 6. The dnd-kit primitives

`SortableList.tsx` wraps `DndContext` + `SortableContext` once, generically
over any `{ id: string }`-shaped array, and hands the reordered array back
via `onReorder` — callers decide what to do with it (in this app, always
one of the hooks in §5). `SortableItem.tsx` + `<DragHandle/>` share drag
listeners via React context, so the drag affordance can be a small,
explicit icon rather than making an entire row (with its Edit/Delete
buttons) a drag target. The one exception is Skills pills (`SortablePill`
inside `SkillsSection.tsx`) — small enough that the whole pill is the drag
target, with `onPointerDown` on the "×" remove button stopping propagation
so removing a skill doesn't get mistaken for the start of a drag.

`PointerSensor` uses a 4px activation distance everywhere, specifically so
an ordinary click on a nested button doesn't get intercepted as a drag
attempt before it's clear the user meant to drag rather than click.

## 7. Testing

**Backend** — 15 new tests across 2 new files plus additions to 2 existing ones:

- **`ReorderSupportTest.java`** (5 tests) — correct reordering, and
  rejecting a missing/duplicated/foreign id.
- **`SectionOrderCodecTest.java`** (8 tests) — encode/decode round-trip,
  accepting a full valid permutation, and rejecting a missing/duplicated/
  unknown section key.
- **`ResumeExperienceServiceTest.java`** (+2 tests) — reorder assigns
  `sortOrder` by requested index; reorder throws `InvalidReorderException`
  on a mismatched id list and never calls `saveAll` in that case.
- **`ResumeControllerIntegrationTest.java`** (+1 real-Postgres integration
  test) — creates a resume, adds 2 experience entries + 2 projects + 2
  skills in the same group, reorders each via its real HTTP endpoint,
  confirms the new order round-trips through `GET`, confirms an incomplete
  reorder request is rejected with `400 INVALID_REORDER` and leaves the
  existing order untouched, and confirms the resume's `sectionOrder`
  defaults to the canonical order and can be rearranged via its own
  endpoint (with the same "reject an incomplete list" check).

**⚠️ I could not run `mvn test` in this environment** — this sandbox has no
Maven Central access and no cached `.m2` repository, and that's not
something I can work around from here. Every backend file was written and
then re-read carefully against the actual method signatures, field names,
and constructor argument orders already in the codebase (not just written
from a mental model of Spring conventions), and every cross-reference
(DTO field order matching `ResumeResponse`'s constructor call, repository
method names, entity getter names used in method references, etc.) was
checked by hand. That's a real check, but it isn't the same guarantee as a
green `mvn test` run. **Please run this locally before treating the backend
as done:**

```bash
cd backend
mvn test   # expect: all existing tests + 15 new ones passing
```

If anything doesn't compile, it's most likely a copy-paste mismatch in one
of the new files against a signature I mis-transcribed — all of them are
listed in §1, so that's a short list to check first.

**Frontend** — verified in full in this environment. 31 new tests across 5
new files, on top of the 81 from Feature 5 — **112 total, all passing**:

- **`reorderUtils.test.ts`** (14 tests) — `moveItem`/`reorderById`/`idsOf`
  pure logic: forward/backward moves, every no-op edge case (same index,
  out-of-range, negative, single-item list, unmatched id), and
  non-mutation of the input array.
- **`SortableList.test.tsx`** (4 tests) — renders every item, renders one
  drag handle per item, empty-list case, render order preserved. Actual
  drag *interactions* aren't simulated here (jsdom pointer-event physics
  for dnd-kit is fragile and low-value to fake) — that's what
  `reorderUtils.test.ts` covers instead, same principle as `pageMetrics.ts`
  vs. `usePageCount()` in Feature 5.
- **`orderedSections.test.tsx`** (6 tests) — renders in the given order,
  skips a key with no corresponding block (the SidebarLayout Skills/
  Certifications case), appends rather than drops a block missing from
  `sectionOrder`, falls back to the blocks' own order when `sectionOrder`
  is empty/null, ignores a duplicated key.
- **`useReorder.test.tsx`** (4 tests) — optimistic `sortOrder` reassignment,
  rollback on a failed mutation, per-group scoping (reordering one Skills
  group leaves Spoken Languages untouched), and section-order updates.
- **`SectionOrderPanel.test.tsx`** (3 tests) — renders every section label
  in order, one drag handle per section, the "always stay at the top"
  copy is present.

```bash
cd frontend
npm run test   # 112/112 passing
npx tsc --noEmit  # clean
npx vite build    # clean (pre-existing >500kB chunk-size warning, unrelated to this feature)
```

## 8. UI implementation

Drag handles are a small 6-dot grip icon (`<DragHandle/>`), not the whole
row, for Experience/Projects/Spoken Languages/Section Order — so Edit/
Delete buttons on the same row stay ordinary clickable buttons. Skills
pills are the one exception (§6) since a separate handle icon would clutter
something that small. "Section Order" is a new tab in `ResumeEditor`,
positioned last, with a one-line explanation that name/summary always stay
fixed at the top regardless of what's dragged.

## 9. Best practices applied

- **Pure logic separated from DOM/dnd-kit wiring** (`reorderUtils.ts` vs.
  `SortableList.tsx`, `orderedSections()` vs. the layout components that
  call it) — same principle as Feature 5's `pageMetrics.ts`, applied here
  specifically because dnd-kit's pointer-event machinery is not realistically
  unit-testable in jsdom, but the actual array math absolutely is.
- **Validate-then-apply over best-effort** (§4): a malformed reorder
  request is rejected outright rather than silently dropping or duplicating
  content.
- **Reuse over duplication**: one `SortableList`/`SortableItem` pair, and
  one `ReorderSupport.reorder()` helper, serve Experience, Projects, Skills,
  and Section Order rather than each having its own bespoke drag/validation
  code.
- **Honest scoping** (§3): documented plainly which sections don't have
  drag-and-drop yet and why, and which sidebar-layout behavior is
  structural rather than a gap in this feature — same spirit as Feature 5's
  §3 on what "live" actually means.
- **Optimistic UI where it matters for feel, without abandoning
  correctness**: every reorder mutation updates instantly and rolls back
  cleanly on failure (§5), rather than either blocking on the network or
  trusting the optimistic state as final.

## 10. Git commit message

```
feat(reordering): add drag-and-drop reordering for experience, projects,
skills, and resume section order

Backend:
- Add V5 migration: resumes.section_order (defaults to the canonical order)
- Add Resume.SectionKey enum + sectionOrder field
- Add SectionOrderCodec (encode/decode/validate) and ReorderSupport
  (shared "orderedIds must be an exact permutation" validation)
- Add InvalidReorderException -> 400 INVALID_REORDER
- Add ReorderRequest, ReorderListItemsRequest, SectionOrderRequest DTOs
- Add reorder() to ResumeExperienceService, ResumeProjectService
  (whole-list), ResumeListItemService (scoped per Section group), and
  reorderSections() to ResumeService
- Add PATCH .../reorder endpoints to the corresponding controllers, and
  PATCH /{resumeId}/sections/reorder to ResumeController
- Add sectionOrder to ResumeResponse
- 15 new/updated backend tests (unit + a real-Postgres integration test)

Frontend:
- Add reorderUtils.ts (pure moveItem/reorderById/idsOf)
- Add SortableList/SortableItem/DragHandle dnd-kit primitives
- Add useReorderSectionItems/useReorderListItems/useReorderSections with
  optimistic cache updates + rollback-on-error
- Wire drag-and-drop into ExperienceSection, ProjectsSection (extracted
  ProjectRow), SkillsSection (pills + spoken languages)
- Add SectionOrderPanel + a new "Section Order" tab in ResumeEditor
- Add orderedSections() and use it in ClassicLayout/SidebarLayout so
  section render order is data-driven instead of hardcoded
- 31 new frontend tests (112/112 total passing), tsc --noEmit clean,
  vite build clean
```
