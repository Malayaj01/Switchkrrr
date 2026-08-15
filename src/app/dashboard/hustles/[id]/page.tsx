import { LeadStatus, UserRole } from "@prisma/client";
import { ArrowLeft, CalendarDays, ExternalLink, Mail, MapPin } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { LeadCreateForm } from "@/components/hustle/lead-create-form";
import { LeadStatusForm } from "@/components/hustle/lead-status-form";
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
  if (!isMentor && !isCandidate && user.role !== UserRole.ADMIN) redirect("/dashboard");

  return (
    <main className="shell">
      <header className="dashboard-header">
        <div>
          <p className="eyebrow">Hustle workspace</p>
          <h1>{isMentor ? hustle.candidate.user.name : `${hustle.mentor.domain} mentor`}</h1>
          <p className="muted">
            {hustle.candidate.goalRole} - {hustle.status.toLowerCase()} since {formatDate(hustle.createdAt)}
          </p>
        </div>
        <Link className="button secondary" href={hustlesRoute}>
          <ArrowLeft size={17} />
          Hustles
        </Link>
      </header>

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

          <section className="dashboard-panel card">
            <h2>Mentor</h2>
            <p className="muted">{isMentor ? hustle.mentor.user.name : `${hustle.mentor.domain} mentor`}</p>
            <p>{hustle.mentor.designation}</p>
            <p>{hustle.mentor.yearsExperience}+ years experience</p>
            <div className="match-signals">
              {hustle.mentor.helpCompanies.slice(0, 4).map((company) => (
                <span key={company}>{company}</span>
              ))}
            </div>
          </section>

          {isMentor && <LeadCreateForm hustleId={hustle.id} />}
        </aside>

        <section className="workspace-main">
          <div className="panel-head">
            <div>
              <p className="eyebrow">Lead board</p>
              <h2>{hustle.leads.length} leads</h2>
            </div>
            <span className="success-chip">{hustle.status}</span>
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
                    <span className={`status-chip ${statusClassName(lead.status)}`}>{formatEnum(lead.status)}</span>
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
                        Follow up {formatDate(lead.followUpDate)}
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

                  {isCandidate && (
                    <LeadStatusForm currentComment={lead.candidateComment} currentStatus={lead.status} leadId={lead.id} />
                  )}

                  <div className="timeline">
                    <h3>Progress history</h3>
                    {lead.progressUpdates.length > 0 ? (
                      lead.progressUpdates.map((update) => (
                        <div className="timeline-item" key={update.id}>
                          <div />
                          <p>
                            <strong>{formatEnum(update.newStatus)}</strong>
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
    </main>
  );
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en", { day: "2-digit", month: "short", year: "numeric" }).format(date);
}

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
  }).format(date);
}

function formatEnum(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");
}

function statusClassName(status: LeadStatus) {
  if (status === LeadStatus.INTERVIEW || status === LeadStatus.CALLBACK || status === LeadStatus.OFFER) return "interview";
  if (status === LeadStatus.APPLIED) return "applied";
  return "todo";
}
