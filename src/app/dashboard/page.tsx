import { UserRole } from "@prisma/client";
import {
  BriefcaseBusiness,
  CheckCircle2,
  Clock3,
  Handshake,
  Inbox,
  ShieldCheck,
  UserRoundCog,
  UsersRound,
} from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LogoutButton } from "@/components/auth/logout-button";
import { platformLimits } from "@/domain/limits";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/security/session";

const mentorRecommendationsRoute = "/dashboard/mentors" as Route;
const mentorRequestsRoute = "/dashboard/requests" as Route;
const hustlesRoute = "/dashboard/hustles" as Route;

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  if (user.role === UserRole.ADMIN) {
    return <AdminDashboard name={user.name} />;
  }

  if (user.role === UserRole.MENTOR) {
    const mentor = await prisma.mentorProfile.findUniqueOrThrow({
      where: { userId: user.id },
      include: {
        mentorRequests: { where: { status: "PENDING" } },
        hustles: { where: { status: "ACTIVE" } },
      },
    });
    const mentorCapacity = `${mentor.hustles.length} / ${platformLimits.maxActiveHustlesPerMentor}`;

    return (
      <DashboardShell eyebrow="Mentor dashboard" title={user.name} subtitle={`Mentor code: ${mentor.mentorCode}`}>
        <MetricGrid
          metrics={[
            { label: "Pending requests", value: mentor.mentorRequests.length, icon: <Clock3 /> },
            { label: "Active Hustles", value: mentor.hustles.length, icon: <Handshake /> },
            { label: "Can help with", value: mentor.helpCompanies.length, icon: <BriefcaseBusiness /> },
          ]}
        />
        <section className="dashboard-panel card">
          <div className="panel-head">
            <div>
              <h2>Review requests</h2>
              <p className="muted">
                Approve strong-fit candidates to start a Hustle, or decline with a short response.
              </p>
            </div>
            <span className="status-chip todo">
              <UsersRound size={16} />
              {mentorCapacity} active
            </span>
          </div>
          <div className="panel-actions">
            <Link className="button" href={mentorRequestsRoute}>
              <Inbox size={17} />
              Review requests
            </Link>
            <Link className="button secondary" href={hustlesRoute}>
              <Handshake size={17} />
              Open Hustles
            </Link>
          </div>
        </section>
      </DashboardShell>
    );
  }

  const candidate = await prisma.candidateProfile.findUniqueOrThrow({
    where: { userId: user.id },
    include: {
      mentorRequests: {
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          mentor: {
            select: {
              domain: true,
              yearsExperience: true,
              helpCompanies: true,
            },
          },
        },
      },
      hustles: { where: { status: "ACTIVE" } },
    },
  });
  const pendingRequests = candidate.mentorRequests.filter((request) => request.status === "PENDING");

  return (
    <DashboardShell
      eyebrow="Candidate dashboard"
      title={user.name}
      subtitle={`${candidate.currentCompany} - Goal: ${candidate.goalRole}`}
    >
      <MetricGrid
        metrics={[
          { label: "Pending requests", value: pendingRequests.length, icon: <Clock3 /> },
          { label: "Active Hustles", value: candidate.hustles.length, icon: <Handshake /> },
          { label: "Target companies", value: candidate.targetCompanies.length, icon: <BriefcaseBusiness /> },
        ]}
      />
      <section className="dashboard-panel card">
        <div className="panel-head">
          <div>
            <h2>{candidate.profileCompletedAt ? "Profile ready" : "Complete profile"}</h2>
            <p className="muted">
              {candidate.profileCompletedAt
                ? "Your matching details are ready. Next, mentor previews and requests will use this profile."
                : "Add skills, target companies, domains, location preference, salary range, job type preference, and resume text."}
            </p>
          </div>
          <span className={candidate.profileCompletedAt ? "success-chip" : "status-chip todo"}>
            {candidate.profileCompletedAt ? <CheckCircle2 size={16} /> : <UserRoundCog size={16} />}
            {candidate.profileCompletedAt ? "Complete" : "Needs setup"}
          </span>
        </div>
        <div className="profile-summary-grid">
          <SummaryItem label="Skills" value={candidate.skills.length} />
          <SummaryItem label="Target companies" value={candidate.targetCompanies.length} />
          <SummaryItem label="Domains" value={candidate.preferredDomains.length} />
          <SummaryItem label="Locations" value={candidate.preferredLocations.length} />
        </div>
        <div className="panel-actions">
          <Link className="button" href="/dashboard/profile">
            <UserRoundCog size={17} />
            {candidate.profileCompletedAt ? "Edit profile" : "Complete profile"}
          </Link>
          {candidate.profileCompletedAt && (
            <Link className="button secondary" href={mentorRecommendationsRoute}>
              Find mentors
            </Link>
          )}
          {candidate.hustles.length > 0 && (
            <Link className="button secondary" href={hustlesRoute}>
              Open Hustles
            </Link>
          )}
        </div>
      </section>
      <section className="dashboard-panel card">
        <div className="panel-head">
          <div>
            <h2>Mentor requests</h2>
            <p className="muted">Track the latest requests you have sent to mentor previews.</p>
          </div>
          <span className="status-chip todo">
            <Clock3 size={16} />
            {pendingRequests.length} pending
          </span>
        </div>
        {candidate.mentorRequests.length > 0 ? (
          <div className="request-status-list">
            {candidate.mentorRequests.map((request) => (
              <div className="request-status-row" key={request.id}>
                <div>
                  <strong>{request.mentor.domain} mentor</strong>
                  <p className="muted">
                    {toExperienceRange(request.mentor.yearsExperience)} - Helps with{" "}
                    {request.mentor.helpCompanies.slice(0, 2).join(", ") || "target companies"}
                  </p>
                </div>
                <span className={`request-status-chip ${request.status.toLowerCase()}`}>{formatStatus(request.status)}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="muted">No mentor requests yet. Complete your profile, then find mentors.</p>
        )}
      </section>
    </DashboardShell>
  );
}

function AdminDashboard({ name }: { name: string }) {
  return (
    <DashboardShell eyebrow="Super admin" title={name} subtitle="Platform visibility and controls">
      <MetricGrid
        metrics={[
          { label: "Users", value: 0, icon: <UsersRound /> },
          { label: "Hustles", value: 0, icon: <Handshake /> },
          { label: "Verification queue", value: 0, icon: <ShieldCheck /> },
        ]}
      />
    </DashboardShell>
  );
}

function DashboardShell({
  children,
  eyebrow,
  subtitle,
  title,
}: {
  children: React.ReactNode;
  eyebrow: string;
  subtitle: string;
  title: string;
}) {
  return (
    <main className="shell">
      <header className="dashboard-header">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
          <p className="muted">{subtitle}</p>
        </div>
        <LogoutButton />
      </header>
      <section className="dashboard-main">{children}</section>
    </main>
  );
}

function MetricGrid({ metrics }: { metrics: Array<{ icon: React.ReactNode; label: string; value: number }> }) {
  return (
    <section className="metric-grid">
      {metrics.map((metric) => (
        <article className="metric-card card" key={metric.label}>
          {metric.icon}
          <div>
            <strong>{metric.value}</strong>
            <span>{metric.label}</span>
          </div>
        </article>
      ))}
    </section>
  );
}

function SummaryItem({ label, value }: { label: string; value: number }) {
  return (
    <div className="summary-item">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function formatStatus(status: string) {
  return status
    .toLowerCase()
    .split("_")
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");
}

function toExperienceRange(years: number) {
  if (years >= 10) return "10+ years";
  if (years >= 7) return "7-9 years";
  if (years >= 4) return "4-6 years";
  return "0-3 years";
}
