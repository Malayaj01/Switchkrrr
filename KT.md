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

The project has already been rebuilt as a clean Next.js application using TypeScript, Prisma, and PostgreSQL.

The old Vite/Node prototype was removed. The current codebase is the main direction going forward.

Completed foundation:

- Next.js app structure is in place.
- TypeScript is configured.
- Prisma is installed and configured.
- PostgreSQL is selected as the database.
- Prisma schema exists for users, mentor profiles, candidate profiles, mentor requests, Hustles, leads, progress updates, and sessions.
- Signup API exists.
- Login API exists.
- Logout API exists.
- Current user API exists.
- Password hashing is implemented.
- Signed HTTP-only session cookie foundation is implemented.
- Candidate and mentor signup forms exist.
- Basic role-aware dashboard shell exists.
- Landing page has been redesigned for Switchkrr.
- Landing page includes animated waves and multiple content sections.
- Scroll reveal component exists for landing sections.
- Project build and typecheck were passing at the previous checkpoint.

Current important files:

- `src/app/page.tsx` - landing page.
- `src/app/signup/page.tsx` - signup page.
- `src/app/login/page.tsx` - login page.
- `src/app/dashboard/page.tsx` - basic dashboard shell.
- `src/app/api/auth/signup/route.ts` - signup API.
- `src/app/api/auth/login/route.ts` - login API.
- `src/app/api/auth/logout/route.ts` - logout API.
- `src/app/api/me/route.ts` - current user API.
- `src/components/auth/signup-form.tsx` - signup form.
- `src/components/auth/login-form.tsx` - login form.
- `src/components/landing/animated-waves.tsx` - landing animation.
- `src/components/landing/reveal-section.tsx` - scroll reveal component.
- `src/domain/limits.ts` - product limits.
- `src/domain/matching.ts` - matching-related domain logic.
- `prisma/schema.prisma` - database schema.

## 4. What Needs To Be Done

The biggest current blocker is the database connection. A real PostgreSQL database is not connected yet. Docker was not installed on the machine earlier, so local Postgres could not be started. The next practical option is to use Supabase or Neon and put the connection string in `DATABASE_URL`.

Immediate next steps:

1. Create a PostgreSQL database using Supabase or Neon.
2. Add the real connection string to `.env` as `DATABASE_URL`.
3. Run `npm run db:push` to push the Prisma schema.
4. Start the app with `npm run dev`.
5. Test signup and login with real persistence.

Short-term product work:

- Build candidate profile completion flow.
- Add resume text or upload placeholder.
- Add skills, target companies, preferred domains, location preference, salary range, and job type preference fields.
- Build mentor matching based on domain, target companies, experience, and candidate preferences.
- Show anonymized mentor previews before approval.
- Build mentor request flow.
- Let mentors approve or decline requests.
- Auto-create a Hustle when a mentor approves a request.
- Add Hustle workspace pages for candidate and mentor.

Medium-term product work:

- Let mentors post job leads inside Hustles.
- Let mentors add contacts, comments, and follow-up details.
- Let candidates update lead status.
- Track progress updates whenever lead status changes.
- Build mentor dashboard with pending requests, active Hustles, and candidate progress.
- Build candidate dashboard with profile status, recommended mentors, pending requests, and active Hustles.
- Enforce product limits such as max 5 active Hustles per candidate and max 10 active candidates per mentor.

Long-term product work:

- Build super admin dashboard.
- Add mentor verification workflow.
- Add email notifications.
- Add file storage for resumes.
- Add LLM-based resume analysis.
- Add deployment using Vercel or Render.
- Add paid features such as candidate premium, paid mentor sessions, AI resume/job matching, and company hiring plans.

## 5. Technical Notes For Interns

This is a Next.js App Router project. Pages live inside `src/app`. Reusable UI components live inside `src/components`. Domain rules should go into `src/domain` instead of being scattered across UI files.

Prisma is the source of truth for the database structure. If you need to add or change data models, update `prisma/schema.prisma` first, then run the relevant Prisma command.

Do not expose full mentor details before a request is approved. This is a product-level privacy rule and should be respected in API responses and UI.

Before building a feature, check whether the database schema already supports it. Many future models already exist in Prisma, even if the pages and APIs are not implemented yet.

Useful commands:

```bash
npm install
npm run dev
npm run typecheck
npm run build
npm run db:push
```

