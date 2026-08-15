import { UserRole } from "@prisma/client";
import { ArrowLeft, BriefcaseBusiness, Clock3, Target } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { RequestDecisionActions } from "@/components/mentor/request-decision-actions";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/security/session";

export default async function MentorRequestsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== UserRole.MENTOR) redirect("/dashboard");

  const mentor = await prisma.mentorProfile.findUniqueOrThrow({
    where: { userId: user.id },
    include: {
      mentorRequests: {
        where: { status: "PENDING" },
        orderBy: { createdAt: "asc" },
        include: {
          candidate: {
            include: {
              user: {
                select: {
                  name: true,
                  email: true,
                },
              },
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

  return (
    <main className="shell">
      <header className="dashboard-header">
        <div>
          <p className="eyebrow">Mentor requests</p>
          <h1>Review candidate requests</h1>
          <p className="muted">
            Approving a request creates an active Hustle workspace for you and the candidate.
          </p>
        </div>
        <Link className="button secondary" href="/dashboard">
          <ArrowLeft size={17} />
          Dashboard
        </Link>
      </header>

      <section className="dashboard-panel card">
        <div className="panel-head">
          <div>
            <h2>Capacity</h2>
            <p className="muted">
              Active candidates: {mentor.hustles.length} / 10
            </p>
          </div>
          <span className="status-chip todo">
            <Clock3 size={16} />
            {mentor.mentorRequests.length} pending
          </span>
        </div>
      </section>

      <section className="request-review-list">
        {mentor.mentorRequests.length > 0 ? (
          mentor.mentorRequests.map((request) => (
            <article className="request-review-card card" key={request.id}>
              <div className="panel-head">
                <div>
                  <p className="eyebrow">Candidate</p>
                  <h2>{request.candidate.user.name}</h2>
                  <p className="muted">
                    {request.candidate.currentCompany} - {request.candidate.designation}
                  </p>
                </div>
                <span className="request-status-chip">Pending</span>
              </div>

              <div className="request-detail-grid">
                <InfoBlock icon={<Target size={17} />} label="Goal role" value={request.candidate.goalRole} />
                <InfoBlock
                  icon={<BriefcaseBusiness size={17} />}
                  label="Target companies"
                  value={formatList(request.candidate.targetCompanies)}
                />
                <InfoBlock label="Skills" value={formatList(request.candidate.skills)} />
                <InfoBlock label="Domains" value={formatList(request.candidate.preferredDomains)} />
              </div>

              {request.candidateMessage && (
                <div className="message-block">
                  <strong>Candidate message</strong>
                  <p className="muted">{request.candidateMessage}</p>
                </div>
              )}

              <RequestDecisionActions requestId={request.id} />
            </article>
          ))
        ) : (
          <article className="dashboard-panel card">
            <h2>No pending requests</h2>
            <p className="muted">New candidate requests will appear here after candidates request your mentor preview.</p>
          </article>
        )}
      </section>
    </main>
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

function formatList(values: string[]) {
  return values.length > 0 ? values.slice(0, 4).join(", ") : "";
}

