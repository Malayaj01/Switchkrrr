import Link from "next/link";
import {
  ArrowRight,
  BriefcaseBusiness,
  CalendarClock,
  Check,
  ListChecks,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
  UsersRound,
} from "lucide-react";
import { AnimatedWaves } from "@/components/landing/animated-waves";
import { RevealSection } from "@/components/landing/reveal-section";

export default function HomePage() {
  return (
    <main className="landing-shell">
      <nav className="site-nav" aria-label="Primary navigation">
        <Link className="logo-mark" href="/">
          Switchkrr
        </Link>
        <div className="nav-actions">
          <Link className="nav-link" href="/login">
            Log in
          </Link>
          <Link className="button nav-button" href="/signup">
            Get started
          </Link>
        </div>
      </nav>
      <AnimatedWaves />
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Mentor-led job switching</p>
          <h1>Mentor-led job switching, organized inside Hustles.</h1>
          <p className="muted">
            Candidates request mentors, approved requests create shared Hustles, and every lead, referral, follow-up,
            and status update stays in one place.
          </p>
          <div className="hero-actions">
            <Link className="button" href="/signup">
              Create account <ArrowRight size={18} />
            </Link>
            <Link className="button secondary" href="/login">
              Login
            </Link>
          </div>
        </div>
        <div className="match-preview" aria-label="Sample mentor match preview">
          <div className="preview-header">
            <div>
              <p className="eyebrow">Recommended mentor</p>
              <strong>Backend Engineering</strong>
            </div>
            <span className="privacy-chip">
              <LockKeyhole size={13} /> Private preview
            </span>
          </div>
          <div className="mentor-summary">
            <span className="mentor-avatar">M</span>
            <div>
              <strong>Mentor details hidden</strong>
              <p className="muted">Identity unlocks after request approval</p>
            </div>
          </div>
          <div className="match-signals">
            <span><Check size={14} /> Product companies</span>
            <span><Check size={14} /> Backend systems</span>
            <span><Check size={14} /> 8+ years experience</span>
          </div>
          <div className="hustle-preview">
            <p className="eyebrow">After approval</p>
            <p><BriefcaseBusiness size={16} /> A private Hustle opens for leads and progress tracking.</p>
          </div>
        </div>
      </section>

      <RevealSection className="landing-section about-section">
        <div>
          <p className="eyebrow">About us</p>
          <h2>Switchkrr is built for people who are serious about switching, not just saving jobs.</h2>
        </div>
        <p className="muted">
          Most job searches become messy: one spreadsheet, a few LinkedIn chats, random referral messages, and no clear
          follow-up system. Switchkrr turns that chaos into a guided workspace where a candidate and mentor can work
          together with context.
        </p>
      </RevealSection>

      <RevealSection className="journey-strip">
        <JourneyStage number="01" label="Complete profile" text="Goals, skills and target companies" />
        <JourneyStage number="02" label="Find a mentor" text="Matched by domain and company context" />
        <JourneyStage number="03" label="Open a Hustle" text="Approval starts a private workspace" />
        <JourneyStage number="04" label="Convert leads" text="Track applications through offers" />
      </RevealSection>

      <RevealSection className="landing-section">
        <div className="section-headline">
          <p className="eyebrow">Why this</p>
          <h2>Switching jobs needs more than a tracker.</h2>
        </div>
        <div className="content-grid">
          <InfoCard icon={<UsersRound />} title="Mentors bring context" text="A good mentor can point you to the right teams, companies, referrals, and follow-up paths." />
          <InfoCard icon={<ListChecks />} title="Candidates need discipline" text="Every lead needs ownership: apply, follow up, track callback, prepare, and update progress." />
          <InfoCard icon={<Sparkles />} title="The loop matters" text="Switchkrr keeps the mentor-candidate loop visible so help turns into action, not forgotten links." />
        </div>
      </RevealSection>

      <RevealSection className="landing-section split-section">
        <div>
          <p className="eyebrow">How we help</p>
          <h2>One Hustle, one mentor, one candidate, one clear progress board.</h2>
        </div>
        <div className="steps">
          <Step number="01" title="Build profile" text="Candidate adds goals, skills, preferred companies, locations, and switch timeline." />
          <Step number="02" title="Request mentors" text="Switchkrr recommends mentors based on companies, domain, and relevant experience." />
          <Step number="03" title="Start a Hustle" text="When a mentor approves, a shared Hustle opens automatically." />
          <Step number="04" title="Track outcomes" text="Mentor adds leads; candidate updates application, callback, interview, offer, or rejection status." />
        </div>
      </RevealSection>

      <RevealSection className="landing-section workspace-section">
        <div className="section-headline">
          <p className="eyebrow">Inside a Hustle</p>
          <h2>Shared work that keeps the next action obvious.</h2>
          <p className="muted">
            A mentor can add an opportunity, contact, referral path, comment, and follow-up date. The candidate keeps
            each outcome current, giving both people the same view of the search.
          </p>
        </div>
        <div className="lead-board" aria-label="Example job leads tracked inside a Hustle">
          <div className="board-header">
            <div>
              <strong>Backend Platform Hustle</strong>
              <p className="muted">3 active opportunities</p>
            </div>
            <span className="active-chip">Active</span>
          </div>
          <LeadRow company="Northstar Labs" role="Senior API Engineer" status="Interview" statusClass="interview" />
          <LeadRow company="OrbitPay" role="Platform Engineer" status="Applied" statusClass="applied" />
          <LeadRow company="CraftCloud" role="Backend Engineer" status="To apply" statusClass="todo" />
          <div className="followup-row">
            <CalendarClock size={16} />
            <span>Next follow-up: OrbitPay recruiter contact</span>
          </div>
        </div>
      </RevealSection>

      <RevealSection className="landing-section audience-section">
        <div className="section-headline">
          <p className="eyebrow">Made for both sides</p>
          <h2>The candidate moves faster. The mentor helps with clarity.</h2>
        </div>
        <div className="role-grid">
          <RoleColumn
            title="For candidates"
            items={[
              "Complete one switch profile with resume, skills and targets.",
              "Request mentors relevant to the companies and domain you want.",
              "See leads, contacts and follow-ups inside each active Hustle.",
              "Move opportunities from To Apply to Offer with notes attached.",
            ]}
          />
          <RoleColumn
            title="For mentors"
            items={[
              "Review candidates before committing to a mentorship request.",
              "Open a focused workspace automatically after approving.",
              "Share curated openings, referral routes and practical context.",
              "Track whether guidance becomes applications and interviews.",
            ]}
          />
        </div>
      </RevealSection>

      <RevealSection className="landing-section concept-section">
        <div>
          <p className="eyebrow">The concept</p>
          <h2>Not a job board. Not just mentorship. A working room for switching.</h2>
        </div>
        <p className="muted">
          Switchkrr sits between a job tracker, referral network, and mentor marketplace. The unique part is the Hustle:
          a private collaboration space where leads, contacts, comments, and progress stay connected to the person
          helping you.
        </p>
      </RevealSection>

      <RevealSection className="landing-section safeguards-section">
        <div className="section-headline">
          <p className="eyebrow">Designed with boundaries</p>
          <h2>Relevant access, manageable commitments, visible progress.</h2>
        </div>
        <div className="rules-list">
          <Rule
            icon={<LockKeyhole />}
            title="Private before approval"
            text="Candidates discover matching signals without receiving full mentor identity or details up front."
          />
          <Rule
            icon={<UsersRound />}
            title="Focused mentorship"
            text="Candidates can maintain up to 5 active Hustles; mentors can support up to 10 active Hustles."
          />
          <Rule
            icon={<ShieldCheck />}
            title="Accountable progress"
            text="Lead statuses and progress updates preserve the work history behind callbacks, interviews and offers."
          />
        </div>
      </RevealSection>

      <RevealSection className="cta-section">
        <p className="eyebrow">Your next switch</p>
        <h2>Bring structure to the search, and the right mentor into the work.</h2>
        <div className="hero-actions">
          <Link className="button" href="/signup">
            Create account <ArrowRight size={18} />
          </Link>
          <Link className="button secondary" href="/login">
            Sign in
          </Link>
        </div>
      </RevealSection>

      <footer className="landing-footer">
        <p className="closing-line">
          <span>Chal aaja,</span>
          <span>switch krte hai</span>
        </p>
      </footer>
    </main>
  );
}

function InfoCard({ icon, text, title }: { icon: React.ReactNode; text: string; title: string }) {
  return (
    <article className="info-card card">
      <div>{icon}</div>
      <h3>{title}</h3>
      <p className="muted">{text}</p>
    </article>
  );
}

function Step({ number, text, title }: { number: string; text: string; title: string }) {
  return (
    <article className="step-row">
      <span>{number}</span>
      <div>
        <h3>{title}</h3>
        <p className="muted">{text}</p>
      </div>
    </article>
  );
}

function JourneyStage({ label, number, text }: { label: string; number: string; text: string }) {
  return (
    <article className="journey-stage">
      <span>{number}</span>
      <strong>{label}</strong>
      <p className="muted">{text}</p>
    </article>
  );
}

function LeadRow({
  company,
  role,
  status,
  statusClass,
}: {
  company: string;
  role: string;
  status: string;
  statusClass: string;
}) {
  return (
    <div className="lead-row">
      <div>
        <strong>{company}</strong>
        <p className="muted">{role}</p>
      </div>
      <span className={`status-chip ${statusClass}`}>{status}</span>
    </div>
  );
}

function RoleColumn({ items, title }: { items: string[]; title: string }) {
  return (
    <article className="role-column">
      <h3>{title}</h3>
      <ul>
        {items.map((item) => (
          <li key={item}>
            <Check size={16} />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}

function Rule({ icon, text, title }: { icon: React.ReactNode; text: string; title: string }) {
  return (
    <article className="rule">
      <div>{icon}</div>
      <div>
        <h3>{title}</h3>
        <p className="muted">{text}</p>
      </div>
    </article>
  );
}
