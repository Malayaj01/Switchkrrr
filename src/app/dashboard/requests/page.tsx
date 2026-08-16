import { UserRole } from "@prisma/client";
import { BriefcaseBusiness, Clock3, Target, UsersRound } from "lucide-react";
import { redirect } from "next/navigation";
import { DashboardShell, EmptyState, Panel } from "@/components/dashboard/dashboard-shell";
import { CapacityBar } from "@/components/dashboard/dashboard-shell";
import { RequestDecisionActions } from "@/components/mentor/request-decision-actions";
import { CancelRequestButton } from "@/components/candidate/cancel-request-button";
import { toCapacity } from "@/domain/dashboard";
import { platformLimits } from "@/domain/limits";
import { verificationLabel } from "@/domain/verification";
import { experienceRange, formatEnumLabel, formatList, formatLongDate } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/security/session";

export default async function RequestsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role === UserRole.ADMIN) redirect("/dashboard");

  if (user.role === UserRole.CANDIDATE) {
    return <CandidateRequests userId={user.id} />;
  }

  return <MentorRequestQueue userId={user.id} />;
}

async function CandidateRequests({ userId }: { userId: string }) {
  const candidate = await prisma.candidateProfile.findUniqueOrThrow({
    where: { userId },
    include: {
      mentorRequests: {
        orderBy: { createdAt: "desc" },
        include: {
          mentor: {
            select: {
              domain: true,
              yearsExperience: true,
              helpCompanies: true,
              verificationStatus: true,
            },
          },
          hustle: { select: { id: true } },
        },
      },
    },
  });

  const pending = candidate.mentorRequests.filter((request) => request.status === "PENDING");
  const decided = candidate.mentorRequests.filter((request) => request.status !== "PENDING");

  return (
    <DashboardShell
      eyebrow="Requests"
      role={UserRole.CANDIDATE}
      title="Your mentor requests"
      subtitle="Mentor identity stays hidden until a request is approved."
    >
      <Panel
        eyebrow="Waiting"
        title="Pending"
        meta={
          <span className="status-chip todo">
            <Clock3 size={16} />
            {pending.length} of {platformLimits.maxPendingMentorRequestsPerCandidate}
          </span>
        }
      >
        {pending.length > 0 ? (
          <div className="request-status-list">
            {pending.map((request) => (
              <div className="request-status-row" key={request.id}>
                <div>
                  <strong>{request.mentor.domain} mentor</strong>
                  <p className="muted">
                    {experienceRange(request.mentor.yearsExperience)} -{" "}
                    {verificationLabel(request.mentor.verificationStatus)} - Sent{" "}
                    {formatLongDate(request.createdAt)}
                  </p>
                  {request.candidateMessage && <p className="muted">You wrote: {request.candidateMessage}</p>}
                </div>
                <div className="panel-actions">
                  <span className="request-status-chip pending">Pending</span>
                  <CancelRequestButton requestId={request.id} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState>No pending requests. Browse mentor previews to send one.</EmptyState>
        )}
      </Panel>

      <Panel eyebrow="History" title="Decided requests">
        {decided.length > 0 ? (
          <div className="request-status-list">
            {decided.map((request) => (
              <div className="request-status-row" key={request.id}>
                <div>
                  <strong>{request.mentor.domain} mentor</strong>
                  <p className="muted">
                    {experienceRange(request.mentor.yearsExperience)} - Decided{" "}
                    {formatLongDate(request.updatedAt)}
                  </p>
                  {request.mentorResponse && <p className="muted">Mentor replied: {request.mentorResponse}</p>}
                </div>
                <span className={`request-status-chip ${request.status.toLowerCase()}`}>
                  {formatEnumLabel(request.status)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState>No decisions yet.</EmptyState>
        )}
      </Panel>
    </DashboardShell>
  );
}

async function MentorRequestQueue({ userId }: { userId: string }) {
  const mentor = await prisma.mentorProfile.findUniqueOrThrow({
    where: { userId },
    include: {
      mentorRequests: {
        where: { status: "PENDING" },
        orderBy: { createdAt: "asc" },
        include: {
          candidate: {
            include: {
              user: { select: { name: true, email: true } },
            },
          },
        },
      },
      hustles: {
        where: { status: "ACTIVE" },
        select: { id: true },
      },
    },
  });

  const capacity = toCapacity(mentor.hustles.length, platformLimits.maxActiveHustlesPerMentor);

  return (
    <DashboardShell
      eyebrow="Mentor requests"
      role={UserRole.MENTOR}
      title="Review candidate requests"
      subtitle="Approving a request creates an active Hustle workspace for you and the candidate."
    >
      <Panel
        eyebrow="Capacity"
        title="Active candidates"
        meta={
          <span className="status-chip todo">
            <UsersRound size={16} />
            {mentor.mentorRequests.length} pending
          </span>
        }
      >
        <CapacityBar
          isFull={capacity.isFull}
          isNearlyFull={capacity.isNearlyFull}
          label={
            capacity.isFull
              ? `Full at ${capacity.label} - approvals are blocked until a slot frees up`
              : `${capacity.label} slots used`
          }
          percent={capacity.percent}
        />
      </Panel>

      <section className="request-review-list">
        {mentor.mentorRequests.length > 0 ? (
          mentor.mentorRequests.map((request) => (
            <article className="request-review-card card" key={request.id}>
              <div className="panel-head">
                <div>
                  <p className="eyebrow">Candidate</p>
                  <h2>{request.candidate.user.name}</h2>
                  <p className="muted">
                    {request.candidate.currentCompany} - {request.candidate.designation} - Waiting since{" "}
                    {formatLongDate(request.createdAt)}
                  </p>
                </div>
                <span className="request-status-chip pending">Pending</span>
              </div>

              <div className="request-detail-grid">
                <InfoBlock icon={<Target size={17} />} label="Goal role" value={request.candidate.goalRole} />
                <InfoBlock
                  icon={<BriefcaseBusiness size={17} />}
                  label="Target companies"
                  value={formatList(request.candidate.targetCompanies)}
                />
                <InfoBlock label="Skills" value={formatList(request.candidate.skills, 6)} />
                <InfoBlock label="Domains" value={formatList(request.candidate.preferredDomains)} />
              </div>

              {request.candidateMessage && (
                <div className="message-block">
                  <strong>Candidate message</strong>
                  <p className="muted">{request.candidateMessage}</p>
                </div>
              )}

              {capacity.isFull ? (
                <p className="error">
                  You are at {capacity.label} active candidates. Complete or pause a Hustle before approving.
                </p>
              ) : (
                <RequestDecisionActions requestId={request.id} />
              )}
            </article>
          ))
        ) : (
          <Panel eyebrow="Inbox" title="No pending requests">
            <EmptyState>
              New candidate requests appear here after candidates request your mentor preview.
            </EmptyState>
          </Panel>
        )}
      </section>
    </DashboardShell>
  );
}

function InfoBlock({ icon, label, value }: { icon?: React.ReactNode; label: string; value: string }) {
  return (
    <div className="summary-item">
      <span className="info-label">
        {icon}
        {label}
      </span>
      <strong className="info-value">{value || "Not provided"}</strong>
    </div>
  );
}
