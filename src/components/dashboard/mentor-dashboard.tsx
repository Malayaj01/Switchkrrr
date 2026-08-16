import { UserRole, VerificationStatus } from "@prisma/client";
import {
  AlertTriangle,
  ArrowRight,
  BriefcaseBusiness,
  CalendarClock,
  Clock3,
  Handshake,
  Inbox,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import {
  CapacityBar,
  DashboardShell,
  EmptyState,
  MetricGrid,
  Panel,
} from "@/components/dashboard/dashboard-shell";
import { bucketFollowUps, resolveMentorNextAction, summarizeLeads, toCapacity } from "@/domain/dashboard";
import { platformLimits } from "@/domain/limits";
import { verificationChipClassName, verificationLabel } from "@/domain/verification";
import {
  describeFollowUp,
  formatEnumLabel,
  formatList,
  formatShortDate,
  leadStatusClassName,
} from "@/lib/format";
import { prisma } from "@/lib/prisma";

type MentorDashboardProps = {
  name: string;
  userId: string;
};

export async function MentorDashboard({ name, userId }: MentorDashboardProps) {
  const now = new Date();
  const mentor = await prisma.mentorProfile.findUniqueOrThrow({
    where: { userId },
    include: {
      mentorRequests: {
        where: { status: "PENDING" },
        orderBy: { createdAt: "asc" },
        include: {
          candidate: {
            select: {
              goalRole: true,
              targetCompanies: true,
              user: { select: { name: true } },
            },
          },
        },
      },
      hustles: {
        where: { status: "ACTIVE" },
        orderBy: { updatedAt: "desc" },
        include: {
          candidate: {
            select: {
              goalRole: true,
              user: { select: { name: true } },
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

  const recentActivity = await prisma.progressUpdate.findMany({
    where: { lead: { hustle: { mentorId: mentor.id } } },
    orderBy: { createdAt: "desc" },
    take: 6,
    include: {
      user: { select: { name: true } },
      lead: { select: { company: true, role: true, hustleId: true } },
    },
  });

  const allLeads = mentor.hustles.flatMap((hustle) =>
    hustle.leads.map((lead) => ({
      ...lead,
      hustleId: hustle.id,
      candidateName: hustle.candidate.user.name,
    })),
  );
  const leadSummary = summarizeLeads(allLeads);
  const followUps = bucketFollowUps(allLeads, now);
  const capacity = toCapacity(mentor.hustles.length, platformLimits.maxActiveHustlesPerMentor);
  const isVerified = mentor.verificationStatus === VerificationStatus.VERIFIED;
  const hustlesWithoutLeads = mentor.hustles.filter((hustle) => hustle.leads.length === 0).length;
  const nextAction = resolveMentorNextAction({
    isVerified,
    pendingRequests: mentor.mentorRequests.length,
    followUpsDue: followUps.due.length,
    hustlesWithoutLeads,
  });

  return (
    <DashboardShell
      eyebrow="Mentor dashboard"
      role={UserRole.MENTOR}
      title={name}
      subtitle={`${mentor.designation} at ${mentor.currentCompany} - Mentor code ${mentor.mentorCode}`}
      action={
        <span className={`request-status-chip ${verificationChipClassName(mentor.verificationStatus)}`}>
          <ShieldCheck size={15} />
          {verificationLabel(mentor.verificationStatus)}
        </span>
      }
    >
      {!isVerified && (
        <section className={`notice-banner ${mentor.verificationStatus === VerificationStatus.REJECTED ? "is-danger" : ""}`}>
          <AlertTriangle size={18} />
          <div>
            <strong>
              {mentor.verificationStatus === VerificationStatus.REJECTED
                ? "Your mentor profile was rejected"
                : "Your mentor profile is awaiting verification"}
            </strong>
            <p className="muted">
              {mentor.verificationStatus === VerificationStatus.REJECTED
                ? "You are hidden from candidate recommendations and cannot receive new requests. Contact an admin to appeal."
                : "You are shown to candidates as unverified until an admin reviews your profile. Existing Hustles are unaffected."}
            </p>
            {mentor.verificationNote && <p className="muted">Admin note: {mentor.verificationNote}</p>}
          </div>
        </section>
      )}

      <MetricGrid
        metrics={[
          {
            label: "Pending requests",
            value: mentor.mentorRequests.length,
            icon: <Clock3 />,
            href: "/dashboard/requests",
          },
          {
            label: "Active Hustles",
            value: mentor.hustles.length,
            hint: `${capacity.remaining} of ${capacity.max} slots free`,
            icon: <Handshake />,
            href: "/dashboard/hustles",
          },
          {
            label: "Open leads",
            value: leadSummary.open,
            hint: `${leadSummary.total} posted`,
            icon: <BriefcaseBusiness />,
          },
          {
            label: "Follow-ups due",
            value: followUps.due.length,
            hint: `${followUps.upcoming.length} upcoming`,
            icon: <CalendarClock />,
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
        eyebrow="Capacity"
        title="Mentoring load"
        actions={
          <p className="muted">
            You can mentor up to {capacity.max} candidates at a time. Approving a request uses one slot.
          </p>
        }
        meta={
          <span className="status-chip todo">
            <UsersRound size={16} />
            {capacity.label} active
          </span>
        }
      >
        <CapacityBar
          isFull={capacity.isFull}
          isNearlyFull={capacity.isNearlyFull}
          label={
            capacity.isFull
              ? "Full - decline or complete a Hustle to free a slot"
              : `${capacity.remaining} slot${capacity.remaining === 1 ? "" : "s"} free`
          }
          percent={capacity.percent}
        />
      </Panel>

      <Panel
        eyebrow="Inbox"
        title="Pending requests"
        meta={
          <Link className="button secondary" href="/dashboard/requests">
            <Inbox size={17} />
            Review all
          </Link>
        }
      >
        {mentor.mentorRequests.length > 0 ? (
          <div className="request-status-list">
            {mentor.mentorRequests.slice(0, 5).map((request) => (
              <div className="request-status-row" key={request.id}>
                <div>
                  <strong>{request.candidate.user.name}</strong>
                  <p className="muted">
                    Goal: {request.candidate.goalRole}
                    {request.candidate.targetCompanies.length > 0
                      ? ` - Targets ${formatList(request.candidate.targetCompanies, 3)}`
                      : ""}
                  </p>
                </div>
                <span className="request-status-chip pending">Waiting {formatShortDate(request.createdAt)}</span>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState>No pending requests. New candidate requests land here.</EmptyState>
        )}
      </Panel>

      <Panel
        eyebrow="Candidates"
        title="Candidate progress"
        meta={<span className="request-status-chip">{mentor.hustles.length} active</span>}
      >
        {mentor.hustles.length > 0 ? (
          <div className="progress-table">
            <div className="progress-row progress-head">
              <span>Candidate</span>
              <span>Leads</span>
              <span>Applied</span>
              <span>In process</span>
              <span>Offers</span>
              <span />
            </div>
            {mentor.hustles.map((hustle) => {
              const hustleLeads = summarizeLeads(hustle.leads);
              return (
                <Link
                  className="progress-row"
                  href={`/dashboard/hustles/${hustle.id}` as Route}
                  key={hustle.id}
                >
                  <span>
                    <strong>{hustle.candidate.user.name}</strong>
                    <small className="muted">{hustle.candidate.goalRole}</small>
                  </span>
                  <span>{hustleLeads.total}</span>
                  <span>{hustleLeads.applied}</span>
                  <span>{hustleLeads.inProcess}</span>
                  <span>{hustleLeads.offers}</span>
                  <span className="progress-cta">
                    {hustleLeads.total === 0 ? "Post first lead" : "Open"}
                    <ArrowRight size={15} />
                  </span>
                </Link>
              );
            })}
          </div>
        ) : (
          <EmptyState>No active Hustles yet. Approve a request to start mentoring.</EmptyState>
        )}
      </Panel>

      <section className="dashboard-grid-two">
        <Panel
          eyebrow="Schedule"
          title="Follow-ups due"
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
                        {lead.candidateName} - {lead.role}
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
            <EmptyState>Nothing due. Add follow-up dates to leads to track them here.</EmptyState>
          )}
        </Panel>

        <Panel eyebrow="Activity" title="Recent lead movement">
          {recentActivity.length > 0 ? (
            <div className="request-status-list">
              {recentActivity.map((update) => (
                <Link
                  className="request-status-row"
                  href={`/dashboard/hustles/${update.lead.hustleId}` as Route}
                  key={update.id}
                >
                  <div>
                    <strong>{update.lead.company}</strong>
                    <p className="muted">
                      {update.user.name} moved {update.lead.role} to {formatEnumLabel(update.newStatus)}
                    </p>
                  </div>
                  <span className={`status-chip ${leadStatusClassName(update.newStatus)}`}>
                    {formatShortDate(update.createdAt)}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState>No progress updates yet.</EmptyState>
          )}
        </Panel>
      </section>
    </DashboardShell>
  );
}
