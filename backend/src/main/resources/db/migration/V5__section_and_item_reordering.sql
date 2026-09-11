-- Feature 6: drag-and-drop reordering.
--
-- Item-level reordering (experience, projects, skills/list-items) already had
-- a `sort_order` column on every relevant table since Feature 3 - this
-- migration only adds what was missing: an explicit, persisted order for the
-- top-level resume *sections* themselves (Experience before Education before
-- Projects, etc.), which until now was implicitly hardcoded in the frontend
-- template layout components.
--
-- Stored as a simple comma-separated list of section keys rather than a
-- separate join table: it's always read/written as one complete ordering for
-- one resume, never queried or filtered by individual key, so a join table
-- would add joins and no benefit. NOT NULL DEFAULT backfills every existing
-- resume with the canonical order the templates already rendered in.
ALTER TABLE resumes
    ADD COLUMN section_order VARCHAR(500) NOT NULL DEFAULT
        'EXPERIENCE,EDUCATION,PROJECTS,SKILLS,CERTIFICATIONS,AWARDS,PUBLICATIONS,VOLUNTEER,REFERENCES,CUSTOM_SECTIONS';
