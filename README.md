# ResumeAI

An AI-powered resume, cover letter, and career platform.

This repository is being built **feature by feature**, per the project's output strategy — each feature ships with its own folder structure, DB migration, backend + frontend code, API docs, tests, and UI, and waits for review before the next one starts.

**Feature 1 — Authentication: ✅ complete.** See [`docs/FEATURE_1_AUTHENTICATION.md`](docs/FEATURE_1_AUTHENTICATION.md) for the full write-up.

**Feature 2 — Dashboard: ✅ complete.** See [`docs/FEATURE_2_DASHBOARD.md`](docs/FEATURE_2_DASHBOARD.md) for the full write-up.

**Feature 3 — Resume Builder: ✅ complete.** See [`docs/FEATURE_3_RESUME_BUILDER.md`](docs/FEATURE_3_RESUME_BUILDER.md) for the full write-up.

**Feature 4 — Resume Templates: ✅ complete.** See [`docs/FEATURE_4_RESUME_TEMPLATES.md`](docs/FEATURE_4_RESUME_TEMPLATES.md) for the full write-up.

**Feature 5 — Live Preview: ✅ complete.** See [`docs/FEATURE_5_LIVE_PREVIEW.md`](docs/FEATURE_5_LIVE_PREVIEW.md) for the full write-up.

## Tech stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS, React Router, React Hook Form, TanStack Query, Axios, Zod, Zustand
- **Backend:** Java 21, Spring Boot 3, Spring Security, JWT + OAuth2 (Google), Spring Data JPA, PostgreSQL, Redis, MapStruct, Flyway
- **Infra:** Docker / Docker Compose, GitHub Actions (CI to be added with a later feature)

## Running Feature 1 locally

### Option A — Docker Compose (recommended)

```bash
cp backend/.env.example backend/.env   # fill in JWT_SECRET, Google OAuth creds, SMTP creds
docker compose up --build
```

- Backend: http://localhost:8080 (Swagger UI at `/swagger-ui.html`)
- Frontend: http://localhost:5173

### Option B — Run each side manually

**Backend**
```bash
cd backend
cp .env.example .env   # fill in real values, then export them or use a tool like direnv
mvn spring-boot:run
```
Requires Maven and JDK 21 installed locally (or use Docker Compose above, which builds with `maven:3.9-eclipse-temurin-21` and needs nothing installed on your machine). Also requires a local PostgreSQL (`resumeai` DB) and Redis — or point `DB_URL`/`REDIS_HOST` at hosted Neon/Upstash instances.

**Frontend**
```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

## Testing

```bash
cd backend && mvn test          # unit tests
cd backend && mvn verify        # + Testcontainers integration tests (needs Docker)
cd frontend && npm run test        # frontend unit tests (added as features grow)
```

## What's next

Feature 6 — **Drag and Drop** (reordering sections, skills, projects, and experience) is next once Feature 5 is reviewed and approved. It builds on the `sortOrder` column every resume section has carried since Feature 3.
