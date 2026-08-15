import { UserRole } from "@prisma/client";
import { ArrowLeft, BriefcaseBusiness, CalendarDays, Handshake } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/security/session";

export default async function HustlesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const hustles = await prisma.hustle.findMany({
    where:
      user.role === UserRole.MENTOR
        ? { mentor: { userId: user.id } }
        : user.role === UserRole.CANDIDATE
          ? { candidate: { userId: user.id } }
          : {},
    include: {
      candidate: {
        include: {
          user: { select: { name: true } },
        },
      },
      mentor: {
        include: {
          user: { select: { name: true } },
        },
      },
      leads: {
        select: {
          id: true,
          status: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="shell">
      <header className="dashboard-header">
        <div>
          <p className="eyebrow">Hustles</p>
          <h1>Active workspaces</h1>
          <p className="muted">Approved mentor-candidate collaborations live here.</p>
        </div>
        <Link className="button secondary" href="/dashboard">
          <ArrowLeft size={17} />
          Dashboard
        </Link>
      </header>

      <section className="hustle-grid">
        {hustles.length > 0 ? (
          hustles.map((hustle) => {
            const href = `/dashboard/hustles/${hustle.id}` as Route;
            return (
              <article className="hustle-card card" key={hustle.id}>
                <div className="panel-head">
                  <div>
                    <p className="eyebrow">{hustle.status.toLowerCase()}</p>
                    <h2>
                      {user.role === UserRole.MENTOR ? hustle.candidate.user.name : `${hustle.mentor.domain} mentor`}
                    </h2>
                    <p className="muted">
                      {hustle.candidate.goalRole} - {hustle.mentor.domain}
                    </p>
                  </div>
                  <span className="success-chip">
                    <Handshake size={16} />
                    Active
                  </span>
                </div>
                <div className="profile-summary-grid">
                  <SummaryTile icon={<BriefcaseBusiness size={16} />} label="Leads" value={String(hustle.leads.length)} />
                  <SummaryTile label="Applied" value={String(hustle.leads.filter((lead) => lead.status === "APPLIED").length)} />
                  <SummaryTile label="Interviews" value={String(hustle.leads.filter((lead) => lead.status === "INTERVIEW").length)} />
                  <SummaryTile icon={<CalendarDays size={16} />} label="Started" value={formatDate(hustle.createdAt)} />
                </div>
                <Link className="button" href={href}>
                  Open workspace
                </Link>
              </article>
            );
          })
        ) : (
          <article className="dashboard-panel card">
            <h2>No Hustles yet</h2>
            <p className="muted">Hustles appear here after a mentor approves a candidate request.</p>
          </article>
        )}
      </section>
    </main>
  );
}

function SummaryTile({ icon, label, value }: { icon?: React.ReactNode; label: string; value: string }) {
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

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en", { day: "2-digit", month: "short" }).format(date);
}

