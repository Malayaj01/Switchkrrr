# Switchkrr KT Document

This document is for onboarding interns or new developers into the Switchkrr project. It explains what we are building, why it exists, what is already completed, and what needs to be built next.

## 1. Product Idea

Switchkrr is a mentor-led job switching platform for candidates who want to move into better roles, better companies, or better domains with guidance from people already working in those spaces.

The core idea is simple: a candidate should not search and apply alone. They should be able to find a relevant mentor, request help, and work with that mentor through a structured job-switching workflow. The mentor helps with direction, target companies, job leads, contacts, comments, and follow-ups. The candidate tracks applications, status changes, and progress in one place.

The platform is not just a generic job board. It is closer to a guided job-switching workspace. A mentor and a candidate work together inside a "Hustle". A Hustle starts only when a mentor approves the candidate's request. After that, both sides can collaborate around leads and progress.

An important privacy rule is part of the product direction: before a mentor approves a request, the candidate should not see the mentor's full private details. The candidate should only see an anonymized mentor preview, such as domain, company type, experience range, and areas where the mentor can help. Full mentor details can be revealed only after approval.

## 2. Main Features

The planned product has three primary user roles: candidate, mentor, and admin.

### Candidate Features

Candidates can sign up, create a profile, describe their current role, add their skills, mention target companies, choose preferred domains, and define location, salary, and job type preferences. This profile will be used later for mentor matching.

Candidates should be able to browse recommended mentor previews without seeing sensitive mentor information before approval. They can send a mentor request with a short message explaining what help they need. Once a mentor approves the request, the system creates a Hustle workspace between that candidate and mentor.

Inside the Hustle workspace, candidates should be able to see leads posted by the mentor, apply to jobs, update lead status, add comments, track callbacks/interviews/offers/rejections, and maintain a progress history.

### Mentor Features

Mentors can sign up with details such as current company, designation, years of experience, domain, LinkedIn URL, bio, companies they can help with, and a mentor code.

Mentors should be able to see pending requests from candidates and approve or decline them. On approval, a Hustle is created automatically. Mentors should be able to manage active Hustles, post job leads, add contacts, share comments, and monitor candidate progress.

There is a planned active candidate limit for mentors, currently expected to be 10 active candidates per mentor. This keeps the mentor workload realistic.

### Admin Features

The admin role is planned for platform operations. Admins should be able to view total users, mentors, candidates, Hustles, leads, and jobs by company or domain.

Admin should also eventually manage mentor verification. Mentor verification is not implemented yet, but the database schema already includes verification status fields.

### Collaboration Workflow

The main workflow is:

1. Candidate signs up and completes profile.
2. Mentor signs up and creates mentor profile.
3. Candidate gets matched with private mentor previews.
4. Candidate sends a mentor request.
5. Mentor approves or declines the request.
6. If approved, a Hustle is created.
7. Mentor posts leads and guidance inside the Hustle.
8. Candidate updates application progress.
9. Both sides can track the full job-switching journey.

## 3. What Is Done Yet

The whole core loop now works end to end against a real PostgreSQL database: a candidate signs up, completes a profile, browses anonymised mentor previews, sends a request, a mentor approves it, a Hustle opens, the mentor posts leads, and the candidate moves those leads through statuses while both dashboards track progress. An admin can see platform-wide numbers and verify mentors.

Foundation:

- Next.js 16 App Router with TypeScript, Turbopack and `typedRoutes`.
- Prisma 6 with PostgreSQL, run locally through Docker (`docker compose up -d`).
- Password hashing plus signed HTTP-only session cookies backed by hashed session rows.
- Landing page with animated waves and scroll-reveal sections.
- Typecheck and production build pass; the app has been smoke-tested with seed data.

Candidate features:

- Profile completion form and API.
- Mentor discovery with anonymised previews.
- Mentor requests, with limits enforced server-side (10 pending requests, 5 active Hustles).
- Requests page listing pending and decided requests.
- Dashboard: active Hustle summary, latest leads, upcoming follow-ups, request statuses and a computed next action.

Mentor features:

- Request review queue, approve or decline, approval auto-creates a Hustle.
- Capacity of 10 active candidates enforced in the API and surfaced in the UI.
- Dashboard: pending requests, active Hustles, candidate progress table, lead counts, follow-ups due, capacity bar, next action, recent lead movement.
- Read-only mentor profile page showing verification status and any admin note.

Admin features:

- Dashboard: total users, candidates, mentors, pending verifications, active Hustles, total leads, leads-by-status breakdown, merged recent-activity feed.
- Mentor verification page with status filters and search.
- Approve, reject or reset a mentor to pending, with an optional note.
- Verification is enforced: rejected mentors disappear from candidate recommendations and cannot receive new requests.
- Every decision records `verifiedAt`, `verifiedById` and `verificationNote`.

Hustle workspace:

- Lead board ordered by priority, mentor lead creation, candidate status updates, comments, follow-up dates and full progress history.

Current important files:

- `src/app/page.tsx` - landing page.
- `src/app/dashboard/page.tsx` - role router that picks the right dashboard.
- `src/components/dashboard/candidate-dashboard.tsx` - candidate dashboard.
- `src/components/dashboard/mentor-dashboard.tsx` - mentor dashboard.
- `src/components/dashboard/admin-dashboard.tsx` - admin dashboard.
- `src/components/dashboard/dashboard-shell.tsx` - shared shell, metric grid, panels, capacity bar.
- `src/components/dashboard/dashboard-nav.tsx` - role-filtered nav with active highlighting.
- `src/app/dashboard/admin/mentors/page.tsx` - mentor verification queue.
- `src/app/api/admin/mentors/[id]/verification/route.ts` - verification API.
- `src/domain/dashboard.ts` - lead summaries, follow-up buckets, capacity, next actions.
- `src/domain/verification.ts` - the verification product rule in one place.
- `src/domain/mentor-preview.ts` - the anonymised shape a candidate may see.
- `src/domain/matching.ts` - mentor scoring.
- `src/domain/limits.ts` - product limits.
- `src/lib/format.ts` - shared date, enum and status formatting.
- `prisma/schema.prisma` - database schema.
- `prisma/seed.ts` - development seed data.

## 4. What Needs To Be Done

The database blocker from earlier checkpoints is resolved: Postgres runs in Docker and the schema is pushed and seeded.

Known gaps:

- Test coverage stops at the domain layer. `npm test` runs 116 Vitest tests over `src/domain` and `src/lib/format.ts` with about 91% statement coverage, but no route, database or browser behaviour is covered automatically.
- Resume upload does not exist. `CandidateProfile.resumeUrl` is in the schema but unused, so candidates can only paste resume text.
- No email is ever sent. Request decisions and verification outcomes are silent, and there is no password reset flow.
- Admins can verify, reassign and search, but cannot suspend or delete a user.
- Auth throttling only honours `x-forwarded-for` when `TRUST_PROXY_HEADERS=true` or when running on Vercel. Behind any other proxy that variable must be set, otherwise every request is bucketed together as a direct connection.

Open product question: KT says full mentor details may be revealed after approval, but the code still anonymises the mentor inside the Hustle workspace for candidates. Pick one and make the code and this document agree.

Long-term product work:

- Email notifications for request decisions and verification outcomes.
- File storage for resumes.
- LLM-based resume analysis and job matching.
- Deployment on Vercel or Render with Supabase or Neon.
- Paid features: candidate premium, paid mentor sessions, AI add-ons, company hiring plans.

## 5. Technical Notes For Interns

This is a Next.js App Router project. Pages live inside `src/app`. Reusable UI components live inside `src/components`. Domain rules should go into `src/domain` instead of being scattered across UI files.

Prisma is the source of truth for the database structure. If you need to add or change data models, update `prisma/schema.prisma` first, then run the relevant Prisma command.

Do not expose full mentor details before a request is approved. This is a product-level privacy rule and should be respected in API responses and UI.

Before building a feature, check whether the database schema already supports it. Many future models already exist in Prisma, even if the pages and APIs are not implemented yet.

Domain rules live in `src/domain`. Before adding a rule to a page or an API route, check whether it belongs there instead. Verification rules are in `src/domain/verification.ts`, dashboard aggregation in `src/domain/dashboard.ts`, and the anonymised mentor shape in `src/domain/mentor-preview.ts`. Keeping the anonymised preview type in one place is what stops a private mentor field leaking into a candidate-facing response by accident.

Useful commands:

```bash
docker compose up -d   # start local PostgreSQL
npm install
npm run db:deploy      # apply migrations
npm run db:seed        # load development data
npm run dev
npm run lint
npm run typecheck
npm test               # Vitest, no database needed
npm run test:coverage
npm run build
```

Domain logic is unit tested. When you add a rule to `src/domain`, add a test
beside it as `*.test.ts` — those tests run without a database or a server, so
there is no reason to skip them.

Schema changes go through migrations, not `db push`. Edit `prisma/schema.prisma`,
then run `npm run db:migrate -- --name what_changed` to generate and apply a
migration. `npm run db:status` shows whether the database matches the migration
history, and `npm run db:reset` rebuilds it from scratch and re-seeds.

Seed accounts all use the password `Switchkrr@123`. See `CHECKPOINT.txt` for the full list; the useful ones are `admin@switchkrr.test`, `nisha@switchkrr.test` (verified mentor with an active Hustle), `ishita@switchkrr.test` (mentor pending verification) and `riya@switchkrr.test` (candidate with leads and follow-ups).

