# Switchkrr Future Integrations

## AI / LLM

### Resume Analysis

Use cases:
- Extract skills.
- Summarize experience.
- Identify target roles.
- Score resume for selected jobs.
- Suggest missing keywords.
- Generate profile summary.

Possible providers:
- OpenAI
- Anthropic
- Google Gemini
- Azure OpenAI

Implementation notes:
- Store original resume separately.
- Store structured analysis JSON.
- Add user consent before sending resume to LLM.
- Avoid making factual claims not present in resume.

## Resume Parsing

Use cases:
- Extract text from PDF/DOCX.
- Populate candidate profile.

Options:
- Server-side PDF text extraction.
- Cloud document parsing APIs.
- LLM-based structured parsing after text extraction.

## Email

Use cases:
- Signup verification.
- Password reset.
- Mentor request notification.
- Approval/decline notification.
- Weekly progress digest.

Providers:
- Resend
- SendGrid
- Postmark
- AWS SES

## File Storage

Use cases:
- Candidate resume uploads.
- Optional portfolio attachments.
- Mentor verification documents later.

Providers:
- Supabase Storage
- Cloudflare R2
- AWS S3

## Authentication Providers

Use cases:
- Google login.
- LinkedIn login later.

Options:
- Auth.js
- Clerk
- Supabase Auth
- Firebase Auth

## Payments Later

Use cases:
- Paid mentor plans.
- Premium candidate features.
- Platform fee.
- Pay-per-Hustle.

Providers:
- Stripe
- Razorpay
- Paddle

## Analytics

Use cases:
- User acquisition tracking.
- Funnel tracking.
- Feature usage.
- Retention.

Options:
- PostHog
- Plausible
- Google Analytics
- Mixpanel

## Product Monitoring

Use cases:
- Error tracking.
- Performance monitoring.
- API error alerts.

Options:
- Sentry
- Logtail/Better Stack
- Axiom
- Datadog later

## Notifications

Use cases:
- Email notifications.
- In-app notifications.
- WhatsApp reminders later.

Options:
- Resend for email.
- Twilio for WhatsApp/SMS.
- Firebase Cloud Messaging for push later.

## Calendar

Use cases:
- Interview reminders.
- Follow-up reminders.
- Mentor-candidate calls.

Options:
- Google Calendar API.
- Calendly integration.

## Job Data Sources

Use cases:
- Import open roles.
- Match jobs to candidate profile.

Options:
- Manual mentor posting first.
- Company career page scraping later.
- Job board APIs if available.
- LinkedIn scraping is legally and technically risky.

## LinkedIn

Use cases:
- Mentor profile verification.
- Candidate profile enrichment.

Notes:
- Official LinkedIn APIs are restricted.
- Avoid scraping LinkedIn without legal review.
- Start with manual LinkedIn URL field.

## Admin / CRM

Use cases:
- Manage mentor verification.
- Track reported users.
- Support tickets.

Options:
- Internal admin dashboard first.
- Retool later.
- Airtable sync later.

## Search

Use cases:
- Search mentors.
- Search candidates for admin.
- Search leads.

Options:
- PostgreSQL full-text search for MVP.
- Meilisearch later.
- Typesense later.
- Algolia later.
