# Switchkrr Technical Architecture

## Architecture Goal

Build a maintainable full-stack web app that supports multiple user roles, mentor-candidate matching, Hustle workspaces, persistent data, and future AI/payment/notification integrations.

## Recommended MVP Architecture

- Frontend: React app.
- Backend: Node API.
- Database: PostgreSQL.
- Auth: email/password with hashed passwords initially, then session/JWT hardening.
- File storage: object storage for resumes later.
- Hosting: Render/Railway/Fly for app, Supabase/Neon for Postgres.

## High-Level Components

### Web Frontend

Responsibilities:
- Signup/login screens.
- Role-specific onboarding.
- Candidate dashboard.
- Mentor dashboard.
- Hustle workspace.
- Admin dashboard.
- Tables, forms, filters, and charts.

### API Backend

Responsibilities:
- Authentication.
- Authorization by role.
- User/profile management.
- Mentor matching.
- Mentor request workflow.
- Hustle creation and limits.
- Lead/contact CRUD.
- Candidate progress tracking.
- Admin metrics.

### Database

Responsibilities:
- Store users, profiles, requests, Hustles, leads, contacts, updates, and admin data.
- Enforce core relational constraints.
- Support analytics queries.

### Background Jobs Later

Responsibilities:
- Email notifications.
- Resume parsing and LLM analysis.
- Scheduled reminders.
- Analytics aggregation.

## Core Data Model

### users

- id
- role: `candidate`, `mentor`, `admin`
- name
- username
- email
- password_hash
- created_at
- updated_at

### mentor_profiles

- id
- user_id
- current_company
- designation
- years_experience
- domain
- linkedin_url
- help_companies
- mentor_code
- verification_status: `pending`, `verified`, `rejected`
- bio

### candidate_profiles

- id
- user_id
- current_company
- designation
- goal_role
- target_timeline
- resume_url
- resume_text
- skills
- years_experience
- preferred_locations
- expected_salary_min
- expected_salary_max
- target_companies
- preferred_domains
- job_type_preference
- profile_completed_at
- resume_analysis_json

### mentor_requests

- id
- candidate_id
- mentor_id
- status: `pending`, `approved`, `declined`, `cancelled`
- candidate_message
- mentor_response
- created_at
- updated_at

### hustles

- id
- candidate_id
- mentor_id
- mentor_request_id
- status: `active`, `paused`, `completed`
- created_at
- updated_at

### leads

- id
- hustle_id
- created_by
- company
- role
- domain
- location
- job_link
- application_link
- contact_name
- contact_email
- priority
- status
- mentor_comment
- candidate_comment
- follow_up_date
- created_at
- updated_at

### progress_updates

- id
- lead_id
- user_id
- old_status
- new_status
- note
- created_at

### admin_events Later

- id
- actor_id
- action
- entity_type
- entity_id
- metadata
- created_at

## API Modules

### Auth

- `POST /api/auth/signup`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`

### Profiles

- `GET /api/profile`
- `PATCH /api/profile`
- `POST /api/candidate/profile/complete`
- `PATCH /api/mentor/profile`

### Mentors

- `GET /api/mentors/recommended`
- `GET /api/mentors/search`
- `POST /api/mentor-requests`
- `GET /api/mentor-requests`
- `PATCH /api/mentor-requests/:id`

### Hustles

- `GET /api/hustles`
- `GET /api/hustles/:id`
- `POST /api/hustles/join-by-code`
- `PATCH /api/hustles/:id`

### Leads

- `POST /api/hustles/:hustleId/leads`
- `GET /api/hustles/:hustleId/leads`
- `PATCH /api/leads/:id`
- `DELETE /api/leads/:id`
- `POST /api/leads/:id/progress`

### Admin

- `GET /api/admin/metrics`
- `GET /api/admin/users`
- `GET /api/admin/hustles`
- `GET /api/admin/leads`
- `PATCH /api/admin/mentors/:id/verification`

## Authorization Rules

- Candidate can view only their own profile, requests, Hustles, and leads.
- Mentor can view only requests and Hustles connected to them.
- Mentor can add leads only to their own Hustles.
- Candidate can update status only for leads in their own Hustles.
- Admin can view all records.
- Mentor cannot exceed 10 active Hustles.
- Candidate cannot exceed 5 active Hustles.
- Candidate cannot exceed 10 pending requests.

## Matching Logic MVP

Score mentors by:
- current company matches candidate target companies
- help companies overlap target companies
- domain overlap
- years of experience
- verification status boost later

Simple formula:
- exact current company match: +40
- help company overlap: +25
- domain overlap: +20
- years experience 3+: +10
- verified mentor later: +20

## Security Requirements

- Hash passwords using strong password hashing.
- Never return password hashes to frontend.
- Validate role on every protected API action.
- Use server-side authorization, not frontend-only checks.
- Rate-limit login and mentor request endpoints later.
- Store secrets only in environment variables.
- Use HTTPS in production.

## Deployment Shape

### MVP Hosting

- App hosting: Render/Railway.
- Database: Supabase/Neon PostgreSQL.
- Resume storage later: Supabase Storage/S3/Cloudflare R2.

### Environment Variables

- `DATABASE_URL`
- `DATABASE_SSL`
- `SESSION_SECRET` or `JWT_SECRET`
- `OPENAI_API_KEY` later
- `RESEND_API_KEY` or email provider key later
- `STORAGE_BUCKET` later

## Migration Plan From Current MVP

1. Add normalized Postgres tables.
2. Update auth to support `candidate`, `mentor`, `admin`.
3. Split profile data from user table.
4. Add mentor requests.
5. Add Hustles.
6. Move leads from direct switcher assignment to hustle assignment.
7. Add admin metrics.
8. Add resume/profile completion fields.
