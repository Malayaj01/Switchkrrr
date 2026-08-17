import { UserRole } from "@prisma/client";
import { ArrowLeft, CalendarDays, ExternalLink, Mail, MapPin } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { LeadCreateForm } from "@/components/hustle/lead-create-form";
import { LeadStatusForm } from "@/components/hustle/lead-status-form";
import { HustleStatusActions } from "@/components/hustle/hustle-status-actions";
import { ReassignHustleForm } from "@/components/admin/reassign-hustle-form";
import { summarizeLeads } from "@/domain/dashboard";
import {
  describeFollowUp,
  formatDateTime,
  formatEnumLabel,
  formatLongDate,
  leadStatusClassName,
} from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/security/session";

type PageProps = {
  params: Promise<{ id: string }>;
};

const hustlesRoute = "/dashboard/hustles" as Route;

export default async function HustleDetailPage({ params }: PageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const hustle = await prisma.hustle.findUnique({
    where: { id },
    include: {
      candidate: {
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      },
      mentor: {
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      },
      leads: {
        include: {
          progressUpdates: {
            include: {
              user: { select: { name: true } },
            },
            orderBy: { createdAt: "desc" },
          },
        },
        orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
      },
    },
  });

  if (!hustle) notFound();

  const isMentor = user.role === UserRole.MENTOR && hustle.mentor.userId === user.id;
  const isCandidate = user.role === UserRole.CANDIDATE && hustle.candidate.userId === user.id;
  const isAdmin = user.role === UserRole.ADMIN;
  if (!isMentor && !isCandidate && !isAdmin) redirect("/dashboard");
  const replacementMentors = isAdmin && hustle.mentor.verificationStatus === "REJECTED" ? await prisma.mentorProfile.findMany({ where: { verificationStatus: "VERIFIED", id: { not: hustle.mentorId } }, select: { id: true, currentCompany: true, user: { select: { name: true } } }, orderBy: { user: { name: "asc" } } }) : [];

  const now = new Date();
  const leadSummary = summarizeLeads(hustle.leads);
  // Admins can audit a workspace, but the candidate's anonymity rule still
  // applies to the candidate's own view of the mentor.
  const heading = isCandidate ? `${hustle.mentor.domain} mentor` : hustle.candidate.user.name;

  return (
    <DashboardShell
      eyebrow="Hustle workspace"
      role={user.role}
      title={heading}
      subtitle={`${hustle.candidate.goalRole} - ${formatEnumLabel(hustle.status)} since ${formatLongDate(hustle.createdAt)}`}
      action={
        <Link className="button secondary" href={hustlesRoute}>
          <ArrowLeft size={17} />
          Hustles
        </Link>
      }
    >
      <section className="workspace-layout">
        <aside className="workspace-sidebar">
          <section className="dashboard-panel card">
            <h2>Candidate</h2>
            <p className="muted">{hustle.candidate.user.name}</p>
            <p>{hustle.candidate.currentCompany}</p>
            <p>{hustle.candidate.designation}</p>
            <div className="match-signals">
              {hustle.candidate.skills.slice(0, 5).map((skill) => (
                <span key={skill}>{skill}</span>
              ))}
            </div>
          </section>

          {isAdmin && replacementMentors.length > 0 && <section className="dashboard-panel card"><p className="eyebrow">Admin control</p><h2>Rejected mentor</h2><p className="muted">Pause this workspace or reassign it to a verified mentor.</p><ReassignHustleForm hustleId={hustle.id} mentors={replacementMentors.map((mentor) => ({ id: mentor.id, name: mentor.user.name, company: mentor.currentCompany }))} /></section>}

          <section className="dashboard-panel card">
            <h2>Mentor</h2>
            <p className="muted">{isCandidate ? `${hustle.mentor.domain} mentor` : hustle.mentor.user.name}</p>
            <p>{hustle.mentor.designation}</p>
            <p>{hustle.mentor.yearsExperience}+ years experience</p>
            <div className="match-signals">
              {hustle.mentor.helpCompanies.slice(0, 4).map((company) => (
                <span key={company}>{company}</span>
              ))}
            </div>
          </section>

          <section className="dashboard-panel card">
            <p className="eyebrow">Workspace status</p>
            <h2>{formatEnumLabel(hustle.status)}</h2>
            <p className="muted">
              Paused and completed Hustles stay available as history and no longer consume either participant&apos;s capacity.
            </p>
            <HustleStatusActions hustleId={hustle.id} status={hustle.status} />
          </section>

          {isMentor && hustle.status === "ACTIVE" && <LeadCreateForm hustleId={hustle.id} />}
        </aside>

        <section className="workspace-main">
          <div className="panel-head">
            <div>
              <p className="eyebrow">Lead board</p>
              <h2>{leadSummary.total} leads</h2>
              <p className="muted">
                {leadSummary.open} open - {leadSummary.inProcess} in process - {leadSummary.offers} offers -{" "}
                {leadSummary.rejected} rejected
              </p>
            </div>
            <span className="success-chip">{formatEnumLabel(hustle.status)}</span>
          </div>

          {hustle.leads.length > 0 ? (
            <div className="workspace-lead-list">
              {hustle.leads.map((lead) => (
                <article className="workspace-lead-card card" key={lead.id}>
                  <div className="panel-head">
                    <div>
                      <h2>{lead.role}</h2>
                      <p className="muted">
                        {lead.company}
                        {lead.domain ? ` - ${lead.domain}` : ""}
                      </p>
                    </div>
                    <span className={`status-chip ${leadStatusClassName(lead.status)}`}>
                      {formatEnumLabel(lead.status)}
                    </span>
                  </div>

                  <div className="lead-meta-row">
                    {lead.location && (
                      <span>
                        <MapPin size={15} />
                        {lead.location}
                      </span>
                    )}
                    {lead.followUpDate && (
                      <span>
                        <CalendarDays size={15} />
                        Follow up {formatLongDate(lead.followUpDate)} - {describeFollowUp(lead.followUpDate, now)}
                      </span>
                    )}
                    {lead.contactEmail && (
                      <span>
                        <Mail size={15} />
                        {lead.contactEmail}
                      </span>
                    )}
                  </div>

                  <div className="panel-actions">
                    {lead.jobLink && (
                      <a className="button secondary" href={lead.jobLink} target="_blank" rel="noreferrer">
                        <ExternalLink size={15} />
                        Job
                      </a>
                    )}
                    {lead.applicationLink && (
                      <a className="button secondary" href={lead.applicationLink} target="_blank" rel="noreferrer">
                        <ExternalLink size={15} />
                        Apply
                      </a>
                    )}
                  </div>

                  {lead.mentorComment && (
                    <div className="message-block">
                      <strong>Mentor comment</strong>
                      <p className="muted">{lead.mentorComment}</p>
                    </div>
                  )}

                  {lead.candidateComment && (
                    <div className="message-block">
                      <strong>Candidate update</strong>
                      <p className="muted">{lead.candidateComment}</p>
                    </div>
                  )}

                  {isCandidate && hustle.status === "ACTIVE" && (
                    <LeadStatusForm currentComment={lead.candidateComment} currentStatus={lead.status} leadId={lead.id} />
                  )}

                  <div className="timeline">
                    <h3>Progress history</h3>
                    {lead.progressUpdates.length > 0 ? (
                      lead.progressUpdates.map((update) => (
                        <div className="timeline-item" key={update.id}>
                          <div />
                          <p>
                            <strong>{formatEnumLabel(update.newStatus)}</strong>
                            <span className="muted">
                              {update.user.name} - {formatDateTime(update.createdAt)}
                            </span>
                            {update.note && <span>{update.note}</span>}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="muted">No progress updates yet.</p>
                    )}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <article className="dashboard-panel card">
              <h2>No leads yet</h2>
              <p className="muted">
                {isMentor ? "Add the first lead for this candidate." : "Your mentor has not posted leads yet."}
              </p>
            </article>
          )}
        </section>
      </section>
    </DashboardShell>
  );
}
