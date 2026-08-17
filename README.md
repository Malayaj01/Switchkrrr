# Switchkrr

Switchkrr is a mentor-led job switching platform. It helps candidates switch jobs with structured guidance from mentors who understand their target domain, companies, and role path.

The product is built around a simple workflow: a candidate creates a profile, discovers relevant mentor previews, sends a request, and starts a private job-switching workspace called a Hustle after the mentor approves. Inside a Hustle, mentors can share leads and guidance while candidates track applications and progress.

## Core Idea

Most candidates apply to jobs alone, without clear direction, referrals, follow-ups, or accountability. Switchkrr turns job switching into a guided workflow between a candidate and a mentor.

Switchkrr is not just a job board. The main value is the mentor-candidate relationship, the approval-based Hustle workspace, and structured progress tracking from lead discovery to offer.

Before approval, candidates should only see anonymized mentor previews. Full mentor details should be visible only after the mentor accepts the candidate request.

## Features

- Candidate signup and login.
- Mentor signup and login.
- Signed HTTP-only session authentication.
- Candidate profile model with skills, target companies, preferred domains, location, salary, resume fields, and job type preference.
- Mentor profile model with company, designation, experience, domain, LinkedIn, bio, mentor code, and verification status.
- Mentor request model for candidate-to-mentor approval flow.
- Hustle model for approved mentor-candidate collaboration.
- Lead model for jobs, contacts, priorities, comments, links, and status tracking.
- Progress update model for lead history.
- Role-aware dashboard foundation.
- Landing page with Switchkrr branding, content sections, animated waves, and scroll reveal behavior.

## Tech Stack

- Next.js
- React
- TypeScript
- Prisma
- PostgreSQL
- Zod
- bcryptjs
- jose
- lucide-react

## Current Status

The project foundation is in place. The current codebase includes the Next.js app structure, Prisma schema, auth APIs, signup/login UI, session handling, dashboard shell, and landing page.

The main pending setup task is connecting a real PostgreSQL database. Earlier local Docker-based Postgres could not be started because Docker was not installed on the machine. Supabase or Neon is the recommended next option.

## Local Setup

Install dependencies:

```bash
npm install
```

Start PostgreSQL:

```bash
docker compose up -d
```

Create an environment file:

```bash
copy .env.example .env
```

Apply migrations and load development data:

```bash
npm run db:deploy
npm run db:seed
```

Start the development server:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

Seed accounts all use the password `Switchkrr@123`. Sign in as
`admin@switchkrr.test`, `nisha@switchkrr.test` (mentor) or
`riya@switchkrr.test` (candidate). See `CHECKPOINT.txt` for the full list.

## Useful Commands

```bash
npm run dev
npm run lint
npm run typecheck
npm test                                    # 116 unit tests, no database needed
npm run test:coverage
npm run build

npm run db:migrate -- --name what_changed   # create and apply a migration
npm run db:deploy                           # apply pending migrations
npm run db:status                           # compare database to migrations
npm run db:reset                            # rebuild and re-seed
npm run db:studio
```

Schema changes go through Prisma migrations. Do not use `prisma db push` — it
bypasses migration history and causes drift.

## Important Project Files

- `src/app/page.tsx` - landing page.
- `src/app/signup/page.tsx` - signup page.
- `src/app/login/page.tsx` - login page.
- `src/app/dashboard/page.tsx` - role-aware dashboard shell.
- `src/app/api/auth/signup/route.ts` - signup API.
- `src/app/api/auth/login/route.ts` - login API.
- `src/app/api/auth/logout/route.ts` - logout API.
- `src/app/api/me/route.ts` - current user API.
- `src/components/auth/signup-form.tsx` - signup form.
- `src/components/auth/login-form.tsx` - login form.
- `src/components/landing/animated-waves.tsx` - landing wave animation.
- `src/components/landing/reveal-section.tsx` - scroll reveal wrapper.
- `src/domain/limits.ts` - product limits.
- `src/domain/matching.ts` - matching-related domain logic.
- `prisma/schema.prisma` - database schema.
- `KT.md` - detailed intern knowledge transfer document.

## Roadmap

Short-term:

- Connect Supabase or Neon PostgreSQL.
- Run Prisma schema push.
- Complete candidate profile flow.
- Build mentor matching with private mentor previews.
- Build mentor request approval and decline flow.
- Auto-create Hustle after request approval.

Medium-term:

- Build Hustle workspace.
- Let mentors post leads and comments.
- Let candidates update application statuses.
- Track progress history.
- Build mentor dashboard.
- Build candidate dashboard.
- Enforce candidate and mentor active Hustle limits.

Long-term:

- Build admin dashboard.
- Add mentor verification.
- Add email notifications.
- Add resume file storage.
- Add LLM-based resume analysis.
- Deploy publicly using Vercel or Render.
- Add revenue features such as paid mentor sessions, candidate premium, and AI matching add-ons.

## Intern Handoff

Read `KT.md` before starting implementation work. It explains the product idea, feature scope, completed work, pending work, and technical notes in more detail.
