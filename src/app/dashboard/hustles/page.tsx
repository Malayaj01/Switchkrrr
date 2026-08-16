import { HustleStatus, UserRole } from "@prisma/client";
import { BriefcaseBusiness, CalendarDays, Handshake } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { DashboardShell, EmptyState, Panel } from "@/components/dashboard/dashboard-shell";
import { bucketFollowUps, summarizeLeads } from "@/domain/dashboard";
import { formatEnumLabel, formatShortDate } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/security/session";

export default async function HustlesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const now = new Date();
  const hustles = await prisma.hustle.findMany({
    where:
      user.role === UserRole.MENTOR
        ? { mentor: { userId: user.id } }
        : user.role === UserRole.CANDIDATE
          ? { candidate: { userId: user.id } }
          : {},
    include: {
      candidate: {
        select: {
          goalRole: true,
          user: { select: { name: true } },
        },
      },
      mentor: {
        select: {
          domain: true,
          user: { select: { name: true } },
        },
      },
      leads: {
        select: {
          id: true,
          status: true,
          followUpDate: true,
        },
      },
    },
    // Active first, then most recently touched.
    orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
  });

  const isAdmin = user.role === UserRole.ADMIN;

  return (
    <DashboardShell
      eyebrow="Hustles"
      role={user.role}
      title={isAdmin ? "All Hustles" : "Your Hustles"}
      subtitle={
        isAdmin
          ? "Every mentor-candidate workspace on the platform."
          : "Approved mentor-candidate collaborations live here."
      }
    >
      {hustles.length > 0 ? (
        <section className="hustle-grid">
          {hustles.map((hustle) => {
            const leads = summarizeLeads(hustle.leads);
            const followUps = bucketFollowUps(hustle.leads, now);
            const heading = isAdmin
              ? `${hustle.candidate.user.name} + ${hustle.mentor.user.name}`
              : user.role === UserRole.MENTOR
                ? hustle.candidate.user.name
                : `${hustle.mentor.domain} mentor`;

            return (
              <article className="hustle-card card" key={hustle.id}>
                <div className="panel-head">
                  <div>
                    <p className="eyebrow">{formatEnumLabel(hustle.status)}</p>
                    <h2>{heading}</h2>
                    <p className="muted">
                      {hustle.candidate.goalRole} - {hustle.mentor.domain}
                    </p>
                  </div>
                  <span className={hustle.status === HustleStatus.ACTIVE ? "success-chip" : "request-status-chip"}>
                    <Handshake size={16} />
                    {formatEnumLabel(hustle.status)}
                  </span>
                </div>

                <div className="profile-summary-grid">
                  <SummaryTile icon={<BriefcaseBusiness size={16} />} label="Leads" value={leads.total} />
                  <SummaryTile label="Open" value={leads.open} />
                  <SummaryTile label="In process" value={leads.inProcess} />
                  <SummaryTile label="Offers" value={leads.offers} />
                </div>

                <div className="lead-meta-row">
                  <span>
                    <CalendarDays size={15} />
                    Started {formatShortDate(hustle.createdAt)}
                  </span>
                  {followUps.due.length > 0 && (
                    <span className="is-overdue">{followUps.due.length} follow-ups due</span>
                  )}
                </div>

                <Link className="button" href={`/dashboard/hustles/${hustle.id}` as Route}>
                  Open workspace
                </Link>
              </article>
            );
          })}
        </section>
      ) : (
        <Panel eyebrow="Workspaces" title="No Hustles yet">
          <EmptyState>Hustles appear here after a mentor approves a candidate request.</EmptyState>
        </Panel>
      )}
    </DashboardShell>
  );
}

function SummaryTile({ icon, label, value }: { icon?: React.ReactNode; label: string; value: number }) {
  return (
    <div className="summary-item">
      <span className="info-label">
        {icon}
        {label}
      </span>
      <strong className="info-value">{value}</strong>
    </div>
  );
}
