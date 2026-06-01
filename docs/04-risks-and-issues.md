# Switchkrr Risks And Issues

## Product Risks

### Mentor Quality

Risk: Fake, unhelpful, or low-quality mentors can damage trust.

Mitigation:
- Add LinkedIn URL from day one.
- Add verification status.
- Add admin review later.
- Add reporting and ratings later.

### Candidate Spam

Risk: Candidates may request too many mentors or send low-quality requests.

Mitigation:
- Max 10 pending mentor requests.
- Max 5 active Hustles.
- Prevent duplicate mentor requests.
- Add request message quality guidance later.

### Mentor Overload

Risk: Mentors may accept too many candidates and provide poor help.

Mitigation:
- Max 10 active Hustles per mentor.
- Mentor dashboard should show workload.
- Add pause/close Hustle option.

### Too Many Steps

Risk: Mentor code request plus manual joining creates friction.

Mitigation:
- Auto-create Hustle after mentor approval.
- Keep mentor code only for private/manual invite later.

### Weak Differentiation

Risk: Job tracking/referral products already exist.

Mitigation:
- Emphasize mentor-led Hustle workspace.
- Focus on accountability and tracked outcomes.
- Build progress visibility for mentors and candidates.

## Trust And Safety Risks

### Fake Job Leads

Risk: Mentors may post fake or low-quality leads.

Mitigation:
- Track mentor lead quality over time.
- Allow candidate reports.
- Admin review for repeated abuse.

### Privacy Leakage

Risk: Candidate resume, salary expectations, or current company info may be sensitive.

Mitigation:
- Candidate controls profile visibility later.
- Do not expose candidate data to mentors until request is approved.
- Encrypt sensitive fields later if needed.

### Harassment Or Misuse

Risk: Mentor-candidate communication can become inappropriate.

Mitigation:
- Keep early communication structured through comments.
- Add reporting/blocking.
- Add admin moderation tools.

## Technical Risks

### Bad Authorization

Risk: One mentor/candidate could access another user's data.

Mitigation:
- Server-side authorization on every API.
- Tests for role permissions.
- Never rely only on frontend hiding.

### Scaling JSON Storage

Risk: Local JSON is not suitable for public hosting.

Mitigation:
- Use PostgreSQL before public launch.

### Resume Upload Costs

Risk: File storage and LLM analysis can add cost.

Mitigation:
- Start with resume text upload.
- Add file upload after storage is configured.
- Add LLM only after user workflow is validated.

### LLM Privacy

Risk: Sending resumes to an AI provider needs user consent and data handling clarity.

Mitigation:
- Explicit consent.
- Store minimal LLM output.
- Allow delete.
- Publish privacy policy before launch.

### Notification Deliverability

Risk: Emails may go to spam.

Mitigation:
- Use trusted email provider.
- Configure DNS records.
- Keep transactional emails clean.

## Business Risks

### Free Product With High Support

Risk: Free users may create high moderation/support burden.

Mitigation:
- Limit usage in free tier.
- Add invite-only beta.
- Add admin controls early.

### Mentor Incentive Problem

Risk: Mentors may not stay active without incentive.

Mitigation:
- Recognition, public profile, impact stats.
- Later: paid mentor plans, success fees, premium visibility.

### Candidate Outcome Risk

Risk: Candidates may expect guaranteed jobs.

Mitigation:
- Clear messaging: mentors improve search process, not guarantee offers.
- Track effort and outcomes transparently.

### Legal / Compliance

Risk: Handling resumes and salary data creates privacy obligations.

Mitigation:
- Terms of service.
- Privacy policy.
- Data deletion flow.
- Avoid collecting unnecessary sensitive data.

## Operational Risks

### Admin Bottleneck

Risk: Mentor verification and abuse review can become manual-heavy.

Mitigation:
- Start with lightweight verification.
- Add queues and admin filters.
- Automate obvious checks later.

### Cold Start

Risk: Candidates need mentors; mentors need candidates.

Mitigation:
- Start with a niche.
- Recruit mentors manually.
- Use invite-only beta.
- Focus on one domain first, such as APM/product roles.
