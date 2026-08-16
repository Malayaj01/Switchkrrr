import { UserRole, VerificationStatus } from "@prisma/client";
import {
  ArrowRight,
  BriefcaseBusiness,
  CalendarClock,
  CheckCircle2,
  Clock3,
  Handshake,
  ShieldCheck,
  Sparkles,
  UserRoundCog,
} from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import {
  CapacityBar,
  DashboardShell,
  EmptyState,
  MetricGrid,
  Panel,
  SummaryItem,
} from "@/components/dashboard/dashboard-shell";
import { bucketFollowUps, resolveCandidateNextAction, summarizeLeads, toCapacity } from "@/domain/dashboard";
import { platformLimits } from "@/domain/limits";
import { verificationLabel } from "@/domain/verification";
import {
  describeFollowUp,
  experienceRange,
  formatEnumLabel,
  formatShortDate,
  leadStatusClassName,
} from "@/lib/format";
import { prisma } from "@/lib/prisma";

type CandidateDashboardProps = {
  name: string;
  userId: string;
};

export async function CandidateDashboard({ name, userId }: CandidateDashboardProps) {
  const now = new Date();
  const candidate = await prisma.candidateProfile.findUniqueOrThrow({
    where: { userId },
    include: {
      mentorRequests: {
        orderBy: { createdAt: "desc" },
        take: 6,
        include: {
          mentor: {
            select: {
              domain: true,
              yearsExperience: true,
              helpCompanies: true,
              verificationStatus: true,
            },
          },
        },
      },
      hustles: {
        where: { status: "ACTIVE" },
        orderBy: { updatedAt: "desc" },
        include: {
          mentor: {
            select: {
              domain: true,
              yearsExperience: true,
              verificationStatus: true,
            },
          },
          leads: {
            select: {
              id: true,
              company: true,
              role: true,
              status: true,
              followUpDate: true,
              updatedAt: true,
            },
          },
        },
      },
    },
  });

  // Flatten every lead across active Hustles once, keeping the Hustle it came
  // from so each row can link straight to its workspace.
  const allLeads = candidate.hustles.flatMap((hustle) =>
    hustle.leads.map((lead) => ({ ...lead, hustleId: hustle.id, mentorDomain: hustle.mentor.domain })),
  );
  const leadSummary = summarizeLeads(allLeads);
  const followUps = bucketFollowUps(allLeads, now);
  const latestLeads = [...allLeads].sort((left, right) => right.updatedAt.getTime() - left.updatedAt.getTime());
  const pendingRequests = candidate.mentorRequests.filter((request) => request.status === "PENDING");
  const capacity = toCapacity(candidate.hustles.length, platformLimits.maxActiveHustlesPerCandidate);
  const nextAction = resolveCandidateNextAction({
    profileCompleted: Boolean(candidate.profileCompletedAt),
    activeHustles: candidate.hustles.length,
    pendingRequests: pendingRequests.length,
    leadsToApply: leadSummary.toApply,
    followUpsDue: followUps.due.length,
  });

  return (
    <DashboardShell
      eyebrow="Candidate dashboard"
      role={UserRole.CANDIDATE}
      title={name}
      subtitle={`${candidate.currentCompany} - Goal: ${candidate.goalRole}`}
    >
      <MetricGrid
        metrics={[
          {
            label: "Active Hustles",
            value: candidate.hustles.length,
            hint: `${capacity.remaining} of ${capacity.max} slots free`,
            icon: <Handshake />,
            href: "/dashboard/hustles",
          },
          {
            label: "Open leads",
            value: leadSummary.open,
            hint: `${leadSummary.total} total`,
            icon: <BriefcaseBusiness />,
          },
          {
            label: "Follow-ups due",
            value: followUps.due.length,
            hint: `${followUps.upcoming.length} upcoming`,
            icon: <CalendarClock />,
          },
          {
            label: "Pending requests",
            value: pendingRequests.length,
            icon: <Clock3 />,
            href: "/dashboard/requests",
          },
        ]}
      />

      <section className="next-action-card card">
        <div>
          <p className="eyebrow">Next action</p>
          <h2>{nextAction.title}</h2>
          <p className="muted">{nextAction.description}</p>
        </div>
        <Link className="button" href={nextAction.href as Route}>
          {nextAction.cta}
          <ArrowRight size={17} />
        </Link>
      </section>

      <Panel
        eyebrow="Profile"
        title={candidate.profileCompletedAt ? "Profile ready for matching" : "Profile needs setup"}
        meta={
          <span className={candidate.profileCompletedAt ? "success-chip" : "status-chip todo"}>
            {candidate.profileCompletedAt ? <CheckCircle2 size={16} /> : <UserRoundCog size={16} />}
            {candidate.profileCompletedAt ? "Complete" : "Incomplete"}
          </span>
        }
      >
        <div className="profile-summary-grid">
          <SummaryItem label="Skills" value={candidate.skills.length} />
          <SummaryItem label="Target companies" value={candidate.targetCompanies.length} />
          <SummaryItem label="Domains" value={candidate.preferredDomains.length} />
          <SummaryItem label="Offers" value={leadSummary.offers} />
        </div>
        <div className="panel-actions">
          <Link className="button secondary" href="/dashboard/profile">
            <UserRoundCog size={17} />
            {candidate.profileCompletedAt ? "Edit profile" : "Complete profile"}
          </Link>
          {candidate.profileCompletedAt && !capacity.isFull && (
            <Link className="button secondary" href="/dashboard/mentors">
              <Sparkles size={17} />
              Find mentors
            </Link>
          )}
        </div>
      </Panel>

      <Panel
        eyebrow="Hustles"
        title="Active Hustles"
        meta={
          <CapacityBar
            isFull={capacity.isFull}
            isNearlyFull={capacity.isNearlyFull}
            label={`${capacity.label} slots used`}
            percent={capacity.percent}
          />
        }
      >
        {candidate.hustles.length > 0 ? (
          <div className="request-status-list">
            {candidate.hustles.map((hustle) => {
              const hustleLeads = summarizeLeads(hustle.leads);
              return (
                <Link
                  className="request-status-row"
                  href={`/dashboard/hustles/${hustle.id}` as Route}
                  key={hustle.id}
                >
                  <div>
                    <strong>{hustle.mentor.domain} mentor</strong>
                    <p className="muted">
                      {experienceRange(hustle.mentor.yearsExperience)} - {hustleLeads.total} leads -{" "}
                      {hustleLeads.open} open - {hustleLeads.inProcess} in process
                    </p>
                  </div>
                  <span className="inline-chips">
                    {hustle.mentor.verificationStatus === VerificationStatus.VERIFIED && (
                      <span className="request-status-chip approved">
                        <ShieldCheck size={14} />
                        Verified
                      </span>
                    )}
                    <span className="request-status-chip">Open</span>
                  </span>
                </Link>
              );
            })}
          </div>
        ) : (
          <EmptyState>
            No active Hustles yet. A Hustle opens automatically once a mentor approves your request.
          </EmptyState>
        )}
      </Panel>

      <section className="dashboard-grid-two">
        <Panel
          eyebrow="Leads"
          title="Latest leads"
          meta={<span className="request-status-chip">{leadSummary.total} total</span>}
        >
          {latestLeads.length > 0 ? (
            <div className="request-status-list">
              {latestLeads.slice(0, 5).map((lead) => (
                <Link
                  className="request-status-row"
                  href={`/dashboard/hustles/${lead.hustleId}` as Route}
                  key={lead.id}
                >
                  <div>
                    <strong>{lead.company}</strong>
                    <p className="muted">
                      {lead.role} - updated {formatShortDate(lead.updatedAt)}
                    </p>
                  </div>
                  <span className={`status-chip ${leadStatusClassName(lead.status)}`}>
                    {formatEnumLabel(lead.status)}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState>No leads yet. Your mentor posts leads inside the Hustle workspace.</EmptyState>
          )}
        </Panel>

        <Panel
          eyebrow="Schedule"
          title="Upcoming follow-ups"
          meta={
            followUps.overdue.length > 0 ? (
              <span className="status-chip overdue">{followUps.overdue.length} overdue</span>
            ) : (
              <span className="request-status-chip">{followUps.all.length} scheduled</span>
            )
          }
        >
          {followUps.all.length > 0 ? (
            <div className="request-status-list">
              {followUps.all.slice(0, 6).map((lead) => {
                const isOverdue = followUps.overdue.includes(lead);
                return (
                  <Link
                    className="request-status-row"
                    href={`/dashboard/hustles/${lead.hustleId}` as Route}
                    key={lead.id}
                  >
                    <div>
                      <strong>{lead.company}</strong>
                      <p className="muted">
                        {lead.role} - {formatShortDate(lead.followUpDate!)}
                      </p>
                    </div>
                    <span className={`status-chip ${isOverdue ? "overdue" : "todo"}`}>
                      {describeFollowUp(lead.followUpDate!, now)}
                    </span>
                  </Link>
                );
              })}
            </div>
          ) : (
            <EmptyState>No follow-ups scheduled. Add follow-up dates to leads to see them here.</EmptyState>
          )}
        </Panel>
      </section>

      <Panel
        eyebrow="Requests"
        title="Mentor request status"
        meta={
          <span className="status-chip todo">
            <Clock3 size={16} />
            {pendingRequests.length} pending
          </span>
        }
        actions={
          <p className="muted">Mentor identity stays hidden until a request is approved.</p>
        }
      >
        {candidate.mentorRequests.length > 0 ? (
          <div className="request-status-list">
            {candidate.mentorRequests.map((request) => (
              <div className="request-status-row" key={request.id}>
                <div>
                  <strong>{request.mentor.domain} mentor</strong>
                  <p className="muted">
                    {experienceRange(request.mentor.yearsExperience)} -{" "}
                    {verificationLabel(request.mentor.verificationStatus)} - Sent{" "}
                    {formatShortDate(request.createdAt)}
                  </p>
                  {request.mentorResponse && <p className="muted">Reply: {request.mentorResponse}</p>}
                </div>
                <span className={`request-status-chip ${request.status.toLowerCase()}`}>
                  {formatEnumLabel(request.status)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState>No mentor requests yet. Complete your profile, then browse mentor previews.</EmptyState>
        )}
      </Panel>
    </DashboardShell>
  );
}
