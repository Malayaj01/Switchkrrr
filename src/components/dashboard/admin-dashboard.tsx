import { LeadStatus, UserRole, VerificationStatus } from "@prisma/client";
import {
  ArrowRight,
  BriefcaseBusiness,
  Clock3,
  Handshake,
  ShieldCheck,
  UserPlus,
  UserRoundCog,
  UsersRound,
} from "lucide-react";
import Link from "next/link";
import { DashboardShell, EmptyState, MetricGrid, Panel } from "@/components/dashboard/dashboard-shell";
import { formatDateTime, formatEnumLabel, leadStatusClassName } from "@/lib/format";
import { prisma } from "@/lib/prisma";

type AdminDashboardProps = {
  name: string;
};

type ActivityEntry = {
  id: string;
  at: Date;
  kind: "signup" | "request" | "progress";
  title: string;
  detail: string;
};

export async function AdminDashboard({ name }: AdminDashboardProps) {
  const [
    totalUsers,
    totalCandidates,
    totalMentors,
    mentorsByStatus,
    activeHustles,
    totalHustles,
    totalLeads,
    leadsByStatus,
    verificationQueue,
    recentSignups,
    recentRequests,
    recentProgress,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.candidateProfile.count(),
    prisma.mentorProfile.count(),
    prisma.mentorProfile.groupBy({ by: ["verificationStatus"], _count: { verificationStatus: true } }),
    prisma.hustle.count({ where: { status: "ACTIVE" } }),
    prisma.hustle.count(),
    prisma.lead.count(),
    prisma.lead.groupBy({ by: ["status"], _count: { status: true } }),
    prisma.mentorProfile.findMany({
      where: { verificationStatus: VerificationStatus.PENDING },
      orderBy: { createdAt: "asc" },
      take: 5,
      include: { user: { select: { name: true, email: true } } },
    }),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      select: { id: true, name: true, role: true, createdAt: true },
    }),
    prisma.mentorRequest.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      include: {
        candidate: { select: { user: { select: { name: true } } } },
        mentor: { select: { domain: true } },
      },
    }),
    prisma.progressUpdate.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      include: {
        user: { select: { name: true } },
        lead: { select: { company: true, role: true } },
      },
    }),
  ]);

  const mentorStatusCount = (status: VerificationStatus) =>
    mentorsByStatus.find((row) => row.verificationStatus === status)?._count.verificationStatus ?? 0;
  const pendingMentors = mentorStatusCount(VerificationStatus.PENDING);
  const verifiedMentors = mentorStatusCount(VerificationStatus.VERIFIED);
  const rejectedMentors = mentorStatusCount(VerificationStatus.REJECTED);
  const leadStatusCount = (status: LeadStatus) =>
    leadsByStatus.find((row) => row.status === status)?._count.status ?? 0;

  // One merged feed so admins see platform movement in time order rather than
  // three separate lists they have to reconcile by hand.
  const activity: ActivityEntry[] = [
    ...recentSignups.map((user) => ({
      id: `signup-${user.id}`,
      at: user.createdAt,
      kind: "signup" as const,
      title: user.name,
      detail: `Signed up as ${formatEnumLabel(user.role)}`,
    })),
    ...recentRequests.map((request) => ({
      id: `request-${request.id}`,
      at: request.createdAt,
      kind: "request" as const,
      title: request.candidate.user.name,
      detail: `${formatEnumLabel(request.status)} request to a ${request.mentor.domain} mentor`,
    })),
    ...recentProgress.map((update) => ({
      id: `progress-${update.id}`,
      at: update.createdAt,
      kind: "progress" as const,
      title: update.lead.company,
      detail: `${update.user.name} moved ${update.lead.role} to ${formatEnumLabel(update.newStatus)}`,
    })),
  ]
    .sort((left, right) => right.at.getTime() - left.at.getTime())
    .slice(0, 10);

  return (
    <DashboardShell
      eyebrow="Super admin"
      role={UserRole.ADMIN}
      title={name}
      subtitle="Platform health, supply verification and activity"
      action={
        pendingMentors > 0 ? (
          <Link className="button" href="/dashboard/admin/mentors">
            <ShieldCheck size={17} />
            Verify {pendingMentors}
          </Link>
        ) : undefined
      }
    >
      <MetricGrid
        metrics={[
          { label: "Total users", value: totalUsers, icon: <UsersRound /> },
          { label: "Candidates", value: totalCandidates, icon: <UserRoundCog /> },
          {
            label: "Mentors",
            value: totalMentors,
            hint: `${verifiedMentors} verified`,
            icon: <ShieldCheck />,
            href: "/dashboard/admin/mentors",
          },
          {
            label: "Pending verifications",
            value: pendingMentors,
            hint: rejectedMentors > 0 ? `${rejectedMentors} rejected` : undefined,
            icon: <Clock3 />,
            href: "/dashboard/admin/mentors",
          },
          {
            label: "Active Hustles",
            value: activeHustles,
            hint: `${totalHustles} all time`,
            icon: <Handshake />,
            href: "/dashboard/hustles",
          },
          { label: "Total leads", value: totalLeads, icon: <BriefcaseBusiness /> },
        ]}
      />

      <section className="dashboard-grid-two">
        <Panel
          eyebrow="Verification queue"
          title="Mentors awaiting review"
          meta={
            <Link className="button secondary" href="/dashboard/admin/mentors">
              Manage
              <ArrowRight size={16} />
            </Link>
          }
        >
          {verificationQueue.length > 0 ? (
            <div className="request-status-list">
              {verificationQueue.map((mentor) => (
                <div className="request-status-row" key={mentor.id}>
                  <div>
                    <strong>{mentor.user.name}</strong>
                    <p className="muted">
                      {mentor.designation} - {mentor.currentCompany} - {mentor.domain}
                    </p>
                  </div>
                  <span className="request-status-chip pending">Pending</span>
                </div>
              ))}
              {pendingMentors > verificationQueue.length && (
                <p className="muted">
                  +{pendingMentors - verificationQueue.length} more in the verification queue.
                </p>
              )}
            </div>
          ) : (
            <EmptyState>No mentors waiting for verification.</EmptyState>
          )}
        </Panel>

        <Panel eyebrow="Leads" title="Leads by status">
          {totalLeads > 0 ? (
            <div className="status-breakdown">
              {Object.values(LeadStatus).map((status) => {
                const count = leadStatusCount(status);
                const percent = totalLeads > 0 ? Math.round((count / totalLeads) * 100) : 0;
                return (
                  <div className="status-breakdown-row" key={status}>
                    <span className="status-breakdown-label">{formatEnumLabel(status)}</span>
                    <div className="status-breakdown-track" aria-hidden>
                      <div
                        className={`status-breakdown-fill ${leadStatusClassName(status)}`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <span className="status-breakdown-value">
                      {count}
                      <small className="muted"> ({percent}%)</small>
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState>No leads posted yet.</EmptyState>
          )}
        </Panel>
      </section>

      <Panel eyebrow="Activity" title="Recent platform activity">
        {activity.length > 0 ? (
          <div className="request-status-list">
            {activity.map((entry) => (
              <div className="request-status-row" key={entry.id}>
                <div>
                  <strong>
                    <span className="activity-icon">{activityIcon(entry.kind)}</span>
                    {entry.title}
                  </strong>
                  <p className="muted">{entry.detail}</p>
                </div>
                <span className="request-status-chip">{formatDateTime(entry.at)}</span>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState>Nothing has happened on the platform yet.</EmptyState>
        )}
      </Panel>
    </DashboardShell>
  );
}

function activityIcon(kind: ActivityEntry["kind"]) {
  if (kind === "signup") return <UserPlus size={15} />;
  if (kind === "request") return <Handshake size={15} />;
  return <BriefcaseBusiness size={15} />;
}
