import { UserRole } from "@prisma/client";
import { redirect } from "next/navigation";
import { BriefcaseBusiness, Clock3, Handshake, ShieldCheck, UsersRound } from "lucide-react";
import { LogoutButton } from "@/components/auth/logout-button";
import { getCurrentUser } from "@/lib/security/session";
import { prisma } from "@/lib/prisma";

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
          <h2>Next build slice</h2>
          <p className="muted">
            Mentor request approval, Hustle list, and lead posting will be implemented on top of this foundation.
          </p>
        </section>
      </DashboardShell>
    );
  }

  const candidate = await prisma.candidateProfile.findUniqueOrThrow({
    where: { userId: user.id },
    include: {
      mentorRequests: { where: { status: "PENDING" } },
      hustles: { where: { status: "ACTIVE" } },
    },
  });

  return (
    <DashboardShell
      eyebrow="Candidate dashboard"
      title={user.name}
      subtitle={`${candidate.currentCompany} · Goal: ${candidate.goalRole}`}
    >
      <MetricGrid
        metrics={[
          { label: "Pending requests", value: candidate.mentorRequests.length, icon: <Clock3 /> },
          { label: "Active Hustles", value: candidate.hustles.length, icon: <Handshake /> },
          { label: "Target companies", value: candidate.targetCompanies.length, icon: <BriefcaseBusiness /> },
        ]}
      />
      <section className="dashboard-panel card">
        <h2>Complete profile</h2>
        <p className="muted">
          The next candidate slice will add resume, skills, target companies, location preferences, and mentor matching.
        </p>
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
