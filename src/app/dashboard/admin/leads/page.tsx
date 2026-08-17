import { LeadStatus, Prisma, UserRole } from "@prisma/client";
import { BriefcaseBusiness, CalendarClock, Search, TrendingUp } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { DashboardShell, EmptyState, MetricGrid, Panel } from "@/components/dashboard/dashboard-shell";
import { bucketFollowUps, openLeadStatuses } from "@/domain/dashboard";
import { describeFollowUp, formatEnumLabel, formatShortDate, leadStatusClassName } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/security/session";

const pageSize = 25;

type PageProps = {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
};

function parseStatus(value: string | undefined) {
  const upper = (value ?? "").toUpperCase();
  return Object.values(LeadStatus).includes(upper as LeadStatus) ? (upper as LeadStatus) : undefined;
}

export default async function AdminLeadsPage({ searchParams }: PageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== UserRole.ADMIN) redirect("/dashboard");

  const params = await searchParams;
  const query = (params.q ?? "").trim();
  const status = parseStatus(params.status);
  const page = Math.max(1, Number(params.page) || 1);
  const now = new Date();

  const where: Prisma.LeadWhereInput = {
    ...(status ? { status } : {}),
    ...(query
      ? {
          OR: [
            { company: { contains: query, mode: "insensitive" } },
            { role: { contains: query, mode: "insensitive" } },
            { domain: { contains: query, mode: "insensitive" } },
            { location: { contains: query, mode: "insensitive" } },
            { contactName: { contains: query, mode: "insensitive" } },
            { contactEmail: { contains: query, mode: "insensitive" } },
            { hustle: { candidate: { user: { name: { contains: query, mode: "insensitive" } } } } },
            { hustle: { mentor: { user: { name: { contains: query, mode: "insensitive" } } } } },
          ],
        }
      : {}),
  };

  const [leads, total, statusGroups, allForFollowUps] = await Promise.all([
    prisma.lead.findMany({
      where,
      orderBy: [{ updatedAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        hustle: {
          select: {
            id: true,
            status: true,
            candidate: { select: { user: { select: { name: true } } } },
            mentor: { select: { user: { select: { name: true } } } },
          },
        },
      },
    }),
    prisma.lead.count({ where }),
    prisma.lead.groupBy({ by: ["status"], _count: { status: true }, where }),
    prisma.lead.findMany({ where, select: { status: true, followUpDate: true } }),
  ]);

  const countByStatus = (status: LeadStatus) =>
    statusGroups.find((group) => group.status === status)?._count.status ?? 0;
  const openCount = openLeadStatuses.reduce((total, status) => total + countByStatus(status), 0);
  const inProcessCount = countByStatus(LeadStatus.CALLBACK) + countByStatus(LeadStatus.INTERVIEW);
  const followUps = bucketFollowUps(allForFollowUps, now);
  const pages = Math.max(1, Math.ceil(total / pageSize));

  const buildHref = (overrides: { status?: string; page?: number }) => {
    const search = new URLSearchParams();
    if (query) search.set("q", query);
    const nextStatus = overrides.status ?? status ?? "";
    if (nextStatus) search.set("status", nextStatus);
    search.set("page", String(overrides.page ?? 1));
    return `/dashboard/admin/leads?${search.toString()}` as Route;
  };

  return (
    <DashboardShell
      eyebrow="Admin"
      role={UserRole.ADMIN}
      title="Lead search"
      subtitle="Search every lead on the platform by company, role, contact, candidate or mentor."
    >
      <MetricGrid
        metrics={[
          { label: "Matching leads", value: total, icon: <BriefcaseBusiness /> },
          { label: "Open", value: openCount, hint: `${inProcessCount} in process`, icon: <TrendingUp /> },
          { label: "Offers", value: countByStatus(LeadStatus.OFFER), icon: <TrendingUp /> },
          {
            label: "Follow-ups due",
            value: followUps.due.length,
            hint: `${followUps.overdue.length} overdue`,
            icon: <CalendarClock />,
          },
        ]}
      />

      <section className="filter-bar card">
        <div className="filter-tabs">
          <Link className={!status ? "is-active" : undefined} href={buildHref({ status: "" })}>
            All
          </Link>
          {Object.values(LeadStatus).map((value) => (
            <Link
              className={status === value ? "is-active" : undefined}
              href={buildHref({ status: value })}
              key={value}
            >
              {formatEnumLabel(value)}
              <span className="filter-count">
                {statusGroups.find((group) => group.status === value)?._count.status ?? 0}
              </span>
            </Link>
          ))}
        </div>
        <form action="/dashboard/admin/leads" className="filter-search" method="get">
          {status && <input name="status" type="hidden" value={status} />}
          <Search size={16} />
          <input
            aria-label="Search leads"
            defaultValue={query}
            name="q"
            placeholder="Company, role, domain, contact, candidate or mentor"
            type="search"
          />
          <button className="button secondary" type="submit">
            Search
          </button>
        </form>
      </section>

      <Panel
        eyebrow="Results"
        title={`${total} lead${total === 1 ? "" : "s"}`}
        meta={pages > 1 ? <span className="request-status-chip">{`Page ${page} of ${pages}`}</span> : undefined}
      >
        {leads.length > 0 ? (
          <div className="request-status-list">
            {leads.map((lead) => (
              <Link
                className="request-status-row"
                href={`/dashboard/hustles/${lead.hustle.id}` as Route}
                key={lead.id}
              >
                <div>
                  <strong>
                    {lead.company} - {lead.role}
                  </strong>
                  <p className="muted">
                    {lead.hustle.candidate.user.name} with {lead.hustle.mentor.user.name}
                    {lead.hustle.status !== "ACTIVE" ? ` - Hustle ${formatEnumLabel(lead.hustle.status)}` : ""}
                  </p>
                  <p className="muted">
                    Updated {formatShortDate(lead.updatedAt)}
                    {lead.followUpDate ? ` - ${describeFollowUp(lead.followUpDate, now)}` : ""}
                    {lead.contactEmail ? ` - ${lead.contactEmail}` : ""}
                  </p>
                </div>
                <span className={`status-chip ${leadStatusClassName(lead.status)}`}>
                  {formatEnumLabel(lead.status)}
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState>
            {query || status ? "No leads match this search." : "No leads have been posted yet."}
          </EmptyState>
        )}

        {pages > 1 && (
          <div className="pagination-row">
            {page > 1 ? (
              <Link className="button secondary" href={buildHref({ page: page - 1 })}>
                Previous
              </Link>
            ) : (
              <span className="button secondary is-disabled" aria-disabled="true">
                Previous
              </span>
            )}
            <span className="muted">
              Page {page} of {pages}
            </span>
            {page < pages ? (
              <Link className="button secondary" href={buildHref({ page: page + 1 })}>
                Next
              </Link>
            ) : (
              <span className="button secondary is-disabled" aria-disabled="true">
                Next
              </span>
            )}
          </div>
        )}
      </Panel>
    </DashboardShell>
  );
}
