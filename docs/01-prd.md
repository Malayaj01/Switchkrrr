# Switchkrr PRD

## Product Summary

Switchkrr is a mentor-led job switching platform. Candidates who want to switch jobs create a profile, discover relevant mentors, request help, and join shared workspaces called Hustles. Mentors approve candidates, share job leads, referrals, contacts, and guidance inside each Hustle. Candidates apply and update progress. Mentors and admins track outcomes.

## Problem

Job switchers often manage applications in spreadsheets while separately messaging mentors, referrers, alumni, recruiters, and friends. This creates scattered context, weak follow-up discipline, and poor visibility for anyone helping them.

Mentors also lack a structured way to help multiple candidates. They may share links or emails, but cannot easily see whether the candidate applied, followed up, received callbacks, or converted to interviews/offers.

## Target Users

### Candidate / Switcher

A candidate actively trying to switch jobs. They need mentor guidance, curated job leads, referrals, contacts, follow-up tracking, and accountability.

### Mentor

A professional who can help candidates by sharing job openings, referral paths, company context, contacts, and application advice.

### Super Admin

The platform operator who monitors users, activity, mentor quality, growth metrics, abuse, and platform health.

## Core Concepts

### Mentor Request

A candidate requests help from a mentor. The mentor can approve or decline. Approved requests automatically create a Hustle.

### Hustle

A shared workspace between one mentor and one candidate. It contains leads, contacts, comments, application statuses, and progress metrics.

### Mentor Code

A unique code generated for every mentor. It can be used later for private invites or manual matching, but the primary flow should create a Hustle automatically after request approval.

## User Journey: Mentor

1. Mentor signs up with:
   - name
   - email
   - username
   - password
   - current company
   - designation
   - years of experience
   - domain
   - LinkedIn profile
   - companies they can help with
2. Mentor account is created.
3. Mentor receives a unique mentor code.
4. Mentor profile is created with verification status `pending`.
5. Mentor can see candidate requests.
6. Mentor approves or declines requests.
7. Approved requests automatically create Hustles.
8. Mentor opens each Hustle and adds:
   - job openings
   - application links
   - referral/contact emails
   - recruiter names
   - follow-up dates
   - mentor comments
9. Mentor tracks candidate status across shared leads.

## User Journey: Candidate

1. Candidate signs up with:
   - name
   - email
   - username
   - password
   - current company
   - designation
   - goal role
   - target switch timeline
2. Candidate logs in.
3. Candidate completes profile with:
   - resume upload or resume text
   - skills
   - years of experience
   - preferred locations
   - expected salary range
   - target companies
   - preferred domains
   - job type preference
4. System recommends mentors based on profile match.
5. Candidate requests mentors.
6. Mentor approval creates Hustle automatically.
7. Candidate opens My Hustles.
8. Candidate sees mentor-shared leads and contacts.
9. Candidate updates each lead status:
   - To Apply
   - Applied
   - Callback
   - Interview
   - Offer
   - Rejected
10. Candidate adds notes and progress updates.

## User Journey: Super Admin

1. Admin logs into admin dashboard.
2. Admin sees platform metrics:
   - total candidates
   - total mentors
   - active Hustles
   - pending mentor requests
   - total leads posted
   - leads by domain/company
   - mentor activity
   - candidate progress
3. Admin reviews mentor verification queue.
4. Admin can inspect users, Hustles, leads, and reports.

## MVP Scope

### Must Have

- Signup/login for candidate, mentor, and admin.
- Role-specific onboarding.
- Candidate profile completion.
- Mentor profile creation with unique mentor code.
- Basic mentor matching from target companies/domain.
- Candidate can request mentor.
- Mentor can approve/decline.
- Approved request creates Hustle.
- Candidate max 5 active Hustles.
- Candidate max 10 pending mentor requests.
- Mentor max 10 active Hustles.
- Mentor can add job leads inside Hustle.
- Candidate can update lead status.
- Mentor can see candidate progress.
- Admin dashboard with basic metrics and tables.

### Should Have

- Search/filter mentors.
- Search/filter leads.
- Mentor comments and candidate comments.
- Follow-up dates.
- Profile completeness score.
- Manual mentor code join for private invite.

### Later

- Mentor verification workflow.
- LLM resume analysis.
- Email notifications.
- In-app messaging.
- Payments/subscriptions.
- Ratings/reviews.
- Public mentor profiles.
- Advanced analytics.

## Business Rules

- One candidate can have at most 5 active Hustles.
- One mentor can have at most 10 active Hustles.
- One candidate can have at most 10 pending mentor requests.
- Candidate cannot request the same mentor twice while a request or Hustle exists.
- Approved mentor request automatically creates a Hustle.
- Mentor code should not be the primary approval mechanism.
- Super admin can view all records.

## Success Metrics

- Candidate profile completion rate.
- Mentor request approval rate.
- Hustles created.
- Leads posted per Hustle.
- Candidate application completion rate.
- Callback/interview/offer rate.
- Mentor retention.
- Candidate weekly active usage.

## Open Product Decisions

- Whether mentors should be searchable publicly or only recommended after profile completion.
- Whether mentor approval should require profile completeness above a threshold.
- Whether mentors can charge in future.
- Whether candidates can invite mentors who are not yet on platform.
- Whether admin approval is required before mentor can accept candidates.
