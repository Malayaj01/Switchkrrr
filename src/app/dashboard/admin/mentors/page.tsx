import { Prisma, UserRole, VerificationStatus } from "@prisma/client";
import { Handshake, Linkedin, Mail, Search, ShieldCheck, UsersRound } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { MentorVerificationActions } from "@/components/admin/mentor-verification-actions";
import { DashboardShell, EmptyState, MetricGrid, Panel } from "@/components/dashboard/dashboard-shell";
import { verificationChipClassName, verificationLabel } from "@/domain/verification";
import { formatDateTime, formatList, formatLongDate } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/security/session";

type PageProps = { searchParams: Promise<{ status?: string; q?: string; page?: string }> };

const filters = [
  { key: "PENDING", label: "Pending" },
  { key: "VERIFIED", label: "Verified" },
  { key: "REJECTED", label: "Rejected" },
  { key: "ALL", label: "All" },
] as const;

function parseStatusFilter(value: string | undefined) {
  const upper = (value ?? "PENDING").toUpperCase();
  return filters.some((filter) => filter.key === upper) ? (upper as (typeof filters)[number]["key"]) : "PENDING";
}

export default async function AdminMentorsPage({ searchParams }: PageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== UserRole.ADMIN) redirect("/dashboard");

  const params = await searchParams;
  const statusFilter = parseStatusFilter(params.status);
  const query = (params.q ?? "").trim();
  const page = Math.max(1, Number(params.page) || 1);
  const pageSize = 25;

  const searchFilter: Prisma.MentorProfileWhereInput = query
    ? {
        OR: [
          { currentCompany: { contains: query, mode: "insensitive" } },
          { designation: { contains: query, mode: "insensitive" } },
          { domain: { contains: query, mode: "insensitive" } },
          { mentorCode: { contains: query, mode: "insensitive" } },
          { user: { name: { contains: query, mode: "insensitive" } } },
          { user: { email: { contains: query, mode: "insensitive" } } },
        ],
      }
    : {};

  const [mentors, counts, total] = await Promise.all([
    prisma.mentorProfile.findMany({
      where: {
        ...searchFilter,
        ...(statusFilter === "ALL" ? {} : { verificationStatus: statusFilter as VerificationStatus }),
      },
      // Oldest first while reviewing the queue so nobody waits indefinitely;
      // newest decisions first when looking at already-reviewed mentors.
      orderBy: statusFilter === "PENDING" ? { createdAt: "asc" } : { updatedAt: "desc" },
      skip: (page - 1) * pageSize, take: pageSize,
      include: {
        user: { select: { name: true, email: true, createdAt: true } },
        verifiedBy: { select: { name: true } },
        _count: { select: { hustles: true, mentorRequests: true } },
      },
    }),
    prisma.mentorProfile.groupBy({ by: ["verificationStatus"], _count: { verificationStatus: true } }),
    prisma.mentorProfile.count({ where: { ...searchFilter, ...(statusFilter === "ALL" ? {} : { verificationStatus: statusFilter as VerificationStatus }) } }),
  ]);

  const countFor = (status: VerificationStatus) =>
    counts.find((row) => row.verificationStatus === status)?._count.verificationStatus ?? 0;
  const totalMentors = counts.reduce((total, row) => total + row._count.verificationStatus, 0);

  function filterHref(key: string) {
    const search = new URLSearchParams();
    search.set("status", key);
    if (query) search.set("q", query);
    search.set("page", "1"); return `/dashboard/admin/mentors?${search.toString()}` as Route;
  }

  return (
    <DashboardShell
      eyebrow="Admin"
      role={UserRole.ADMIN}
      title="Mentor verification"
      subtitle="Approve, reject or re-open mentor profiles. Rejected mentors are hidden from candidates."
    >
      <MetricGrid
        metrics={[
          { label: "All mentors", value: totalMentors, icon: <UsersRound /> },
          { label: "Pending", value: countFor(VerificationStatus.PENDING), icon: <ShieldCheck /> },
          { label: "Verified", value: countFor(VerificationStatus.VERIFIED), icon: <ShieldCheck /> },
          { label: "Rejected", value: countFor(VerificationStatus.REJECTED), icon: <ShieldCheck /> },
        ]}
      />

      <section className="filter-bar card">
        <div className="filter-tabs">
          {filters.map((filter) => (
            <Link
              className={filter.key === statusFilter ? "is-active" : undefined}
              href={filterHref(filter.key)}
              key={filter.key}
            >
              {filter.label}
              {filter.key !== "ALL" && (
                <span className="filter-count">{countFor(filter.key as VerificationStatus)}</span>
              )}
            </Link>
          ))}
        </div>
        <form action="/dashboard/admin/mentors" className="filter-search" method="get">
          <input type="hidden" name="status" value={statusFilter} />
          <Search size={16} />
          <input
            aria-label="Search mentors"
            defaultValue={query}
            name="q"
            placeholder="Search name, email, company, domain or mentor code"
            type="search"
          />
          <button className="button secondary" type="submit">
            Search
          </button>
        </form>
      </section>

      {mentors.length > 0 ? (
        <section className="request-review-list">
          {mentors.map((mentor) => (
            <article className="request-review-card card" key={mentor.id}>
              <div className="panel-head">
                <div>
                  <p className="eyebrow">{mentor.mentorCode}</p>
                  <h2>{mentor.user.name}</h2>
                  <p className="muted">
                    {mentor.designation} at {mentor.currentCompany} - {mentor.yearsExperience} years -{" "}
                    {mentor.domain}
                  </p>
                </div>
                <span className={`request-status-chip ${verificationChipClassName(mentor.verificationStatus)}`}>
                  <ShieldCheck size={15} />
                  {verificationLabel(mentor.verificationStatus)}
                </span>
              </div>

              <div className="request-detail-grid">
                <InfoBlock
                  icon={<Mail size={16} />}
                  label="Email"
                  value={mentor.user.email}
                />
                <InfoBlock label="Joined" value={formatLongDate(mentor.user.createdAt)} />
                <InfoBlock
                  icon={<Handshake size={16} />}
                  label="Hustles / requests"
                  value={`${mentor._count.hustles} / ${mentor._count.mentorRequests}`}
                />
                <InfoBlock
                  icon={<Linkedin size={16} />}
                  label="LinkedIn"
                  value={mentor.linkedinUrl ?? ""}
                  href={mentor.linkedinUrl}
                />
                <InfoBlock label="Can help with" value={formatList(mentor.helpCompanies, 6)} />
                <InfoBlock
                  label="Last decision"
                  value={
                    mentor.verifiedAt
                      ? `${formatDateTime(mentor.verifiedAt)}${mentor.verifiedBy ? ` by ${mentor.verifiedBy.name}` : ""}`
                      : ""
                  }
                />
              </div>

              {mentor.bio && (
                <div className="message-block">
                  <strong>Bio</strong>
                  <p className="muted">{mentor.bio}</p>
                </div>
              )}

              {mentor.verificationNote && (
                <div className="message-block">
                  <strong>Previous admin note</strong>
                  <p className="muted">{mentor.verificationNote}</p>
                </div>
              )}

              <MentorVerificationActions currentStatus={mentor.verificationStatus} mentorId={mentor.id} />
            </article>
          ))}
        </section>
      ) : (
        <Panel eyebrow="Verification" title="No mentors match this view">
          <EmptyState>
            {query
              ? `No mentors match "${query}" in the ${statusFilter === "ALL" ? "full" : verificationLabel(statusFilter).toLowerCase()} list.`
              : "Nothing to review here right now."}
          </EmptyState>
        </Panel>
      )}
      {total > pageSize && <div className="panel-actions"><Link className="button secondary" href={`/dashboard/admin/mentors?status=${statusFilter}&q=${encodeURIComponent(query)}&page=${Math.max(1, page - 1)}` as Route}>Previous</Link><span className="muted">Page {page} of {Math.ceil(total / pageSize)}</span><Link className="button secondary" href={`/dashboard/admin/mentors?status=${statusFilter}&q=${encodeURIComponent(query)}&page=${Math.min(Math.ceil(total / pageSize), page + 1)}` as Route}>Next</Link></div>}
    </DashboardShell>
  );
}

function InfoBlock({
  href,
  icon,
  label,
  value,
}: {
  href?: string | null;
  icon?: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="summary-item">
      <span className="info-label">
        {icon}
        {label}
      </span>
      {value && href ? (
        <a className="info-value info-link" href={href} rel="noreferrer" target="_blank">
          {value}
        </a>
      ) : (
        <strong className="info-value">{value || "Not provided"}</strong>
      )}
    </div>
  );
}
