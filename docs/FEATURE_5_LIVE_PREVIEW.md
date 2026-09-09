# Feature 5 — Live Preview

Status: **complete, awaiting your review before Feature 6.**

Pure frontend feature — no backend changes. Everything here is about how the
data and rendering engine from Features 3/4 are *presented* while editing.

## 1. Folder structure

```
frontend/src/
├── components/templates/
│   ├── pageMetrics.ts            A4 constants + calculatePageCount() + usePageCount() hook
│   ├── PageBreakOverlay.tsx      dashed lines + "Page N" labels on the continuous view
│   ├── PrintPreviewPages.tsx     new - windowed pagination (discrete A4 sheets)
│   ├── PreviewToolbar.tsx        new - zoom controls + Continuous/Print-preview toggle
│   └── TemplateRenderer.tsx      extended - showPageBreaks, onPageCountChange
├── components/resume/
│   ├── LivePreviewPanel.tsx      new - assembles toolbar + renderer, used in 2 places
│   └── PersonalInfoSection.tsx   extended - onDraftChange fires on every keystroke
├── pages/resumes/
│   ├── ResumeEditor.tsx          extended - split layout with an embedded live panel
│   └── ResumePreview.tsx         rewritten - now uses LivePreviewPanel
└── (3 new test files - see §7)
```

## 2. Database changes

None. This feature doesn't introduce or need any new persisted state.

## 3. "Update instantly while editing" - what's actually live, and what isn't

This is the one place in the feature worth being precise about, rather than a blanket "everything updates instantly" claim:

- **Personal Info + Summary**: genuinely instant, keystroke-by-keystroke. `PersonalInfoSection` already held local form state (so typing doesn't hit the network); it now also calls a new `onDraftChange` callback on every change. `ResumeEditor` merges that draft into a `previewResume` object (`{ ...resume, ...draftDetails }`) that's what actually gets handed to the preview panel — so the panel is rendering what you just typed, before you've clicked "Save changes."
- **Every list-based section** (Experience, Education, Projects, Skills, Certifications, ...): updates the moment its own add/edit/delete mutation succeeds — typically well under a second, no page reload, no navigation. This is "live" in the sense that matters for a structured list editor (nobody expects a preview to update mid-keystroke while filling out an "add experience" modal that hasn't been submitted yet). This part needed no new code — TanStack Query's cache invalidation on each mutation has produced this behavior since Feature 3.

## 4. Zoom

`PreviewToolbar` — buttons for −10%/+10% between 40% and 150%, and clicking the percentage resets to 100%. Implemented via the `scale` prop `TemplateRenderer` already had from Feature 4 (a CSS `transform: scale(...)`), so zooming is pure paint-time scaling — it never changes measured content height (`scrollHeight` is transform-independent by definition), which is exactly why page-count calculations stay correct at any zoom level without extra guarding.

## 5. Page breaks

`pageMetrics.ts` holds the logic: `calculatePageCount(contentHeightPx, pageHeightPx)` is a small pure function (deliberately separated from any DOM/React code so it's trivially unit-testable), and `usePageCount(ref, deps)` wraps it in a `ResizeObserver` so the count stays correct as the user edits, with no manual "recalculate" call anywhere. `PageBreakOverlay` draws a dashed line + "Page N" badge at each page-height interval directly over the continuously-flowing content — purely visual (`pointer-events-none`, `aria-hidden`), never altering layout.

One non-obvious implementation detail: **1mm = 96/25.4 px is a CSS specification constant**, not a measured approximation — it holds in every standards-compliant browser regardless of zoom or OS display scaling, which is why the page-height math can be a plain constant instead of something measured at runtime.

## 6. Print preview

Two distinct things share this name here, deliberately:

- **On-screen "Print preview" mode** (`PrintPreviewPages`) splits the continuous content into discrete stacked A4 sheets — a well-known lightweight technique: render the full resume once per page, each copy clipped to exactly one A4 height and shifted up by that page's offset, so each frame shows only its slice of the content. It's a genuinely useful on-screen approximation, not a claim of pixel-perfect accuracy.
- **Actual printing** (the "Print / Save as PDF" button, `window.print()`) **always uses the real, continuously-flowing render** (`TemplateRenderer`, no windowing), regardless of which on-screen mode is currently selected. Printing the windowed pages directly would have included their visual gaps and "Page X of Y" labels in the output, with no guarantee the browser's own page breaks land exactly at each frame boundary. `LivePreviewPanel` handles this with Tailwind's `print:` variant — the on-screen Print Preview view gets `print:hidden`, and a hidden-on-screen (`hidden print:block`) copy of the real continuous content takes over for the printed/PDF output. The browser's `@page` rules (from Feature 4) remain the single source of truth for actual pagination; the on-screen views exist purely to give a heads-up before committing to print.

## 7. Testing

All frontend (no backend changes). 19 new tests across 3 new files, on top of the 62 from before — **81 total**:

- **`pageMetrics.test.ts`** (8 tests) — the pure `calculatePageCount` function: under/exactly/just-over one page, multi-page rounding, the zero/negative-height edge case, and the real A4-pixel-height default.
- **`PageBreakOverlay.test.tsx`** (4 tests) — no markers for one page, correct count and labels for multi-page, and that it's marked decorative (`aria-hidden`, `pointer-events-none`).
- **`PreviewToolbar.test.tsx`** (7 tests) — zoom in/out stepping, reset-to-100% on clicking the percentage, min/max disabling, view-mode switching, and the page-count indicator only appearing when there's more than one page.

```bash
cd frontend
npm run test   # 81/81 passing
npm run build  # tsc -b && vite build - clean
```

`usePageCount`'s `ResizeObserver` dependency doesn't exist in jsdom; the hook already guards against that (`if (typeof ResizeObserver === "undefined") return;`) so nothing crashes, and a minimal stub was added to `test/setup.ts` anyway so any future test that renders `TemplateRenderer`/`PrintPreviewPages` directly behaves closer to a real browser.

## 8. UI implementation

`ResumeEditor` is now a responsive split view: `grid-cols-1 lg:grid-cols-[minmax(0,1fr)_440px]` — a single stacked column on narrow viewports (the preview panel appears below the form, not hidden), side-by-side with a sticky preview column once there's room for it. The embedded panel defaults to a lower zoom (42%) than the dedicated Preview page (80%), since it has roughly a third of the horizontal space. `PersonalInfoSection` gained a small "Unsaved changes are already shown in the preview →" hint that only appears once the draft actually differs from the last-saved state.

## 9. Best practices applied

- **Pure logic separated from DOM-observing code** (`calculatePageCount` vs. `usePageCount`) specifically so the actual math is unit-testable without mocking `ResizeObserver`.
- **Honest scoping of "instant"**: documented plainly (§3) rather than overclaiming a uniform "everything updates on every keystroke" that the architecture doesn't actually deliver for list sections — and doesn't need to.
- **Print correctness over on-screen cleverness**: when the two would conflict (windowed print-preview vs. real print output), the real, browser-verified pagination always wins for anything that actually leaves the screen.
- **Reuse over duplication**: one `LivePreviewPanel` component serves both the embedded editor panel and the dedicated full-page Preview screen — the only difference is a `compact` flag and a container class.
- **Zoom is presentation-only**: implemented as a CSS transform specifically because it doesn't affect layout measurement, so page-count logic never needs to know or care what zoom level is active.

## 10. Git commit message

```
feat(live-preview): add zoom, page-break markers, and print preview

- Add pageMetrics.ts: A4 constants, pure calculatePageCount(), and a
  ResizeObserver-backed usePageCount() hook
- Add PageBreakOverlay: dashed lines + "Page N" labels on the continuous view
- Add PrintPreviewPages: windowed-pagination technique showing discrete
  A4 page sheets on screen
- Add PreviewToolbar: zoom in/out/reset (40-150%), Continuous/Print
  Preview toggle, page count indicator
- Extend TemplateRenderer with showPageBreaks + onPageCountChange
- Add LivePreviewPanel, assembling toolbar + renderer; ensures actual
  printing always uses the real continuous render regardless of which
  on-screen view mode is active (via Tailwind's print: variant)
- Extend PersonalInfoSection with onDraftChange, firing on every keystroke
- Restructure ResumeEditor into a responsive split view with an embedded
  live preview panel fed by draft (unsaved) personal info + summary state
- Rewrite ResumePreview to use LivePreviewPanel (zoom, page breaks,
  print-preview mode) instead of a bare static render
- Add pageMetrics.test.ts, PageBreakOverlay.test.tsx, PreviewToolbar.test.tsx
  (19 new tests, 81 total)
- Add a ResizeObserver stub to the frontend test setup
- Verified: 81/81 tests pass, tsc --noEmit clean, vite build succeeds
```
