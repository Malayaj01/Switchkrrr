import { Prisma, UserRole } from "@prisma/client";
import type { Route } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { DashboardShell, EmptyState, Panel } from "@/components/dashboard/dashboard-shell";
import { formatLongDate } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/security/session";

const pageSize = 25;
type Props = { searchParams: Promise<{ q?: string; page?: string; role?: string }> };

export default async function AdminUsersPage({ searchParams }: Props) {
  const admin = await getCurrentUser(); if (!admin) redirect("/login"); if (admin.role !== UserRole.ADMIN) redirect("/dashboard");
  const params = await searchParams; const q = (params.q ?? "").trim(); const page = Math.max(1, Number(params.page) || 1);
  const role = Object.values(UserRole).includes(params.role as UserRole) ? params.role as UserRole : undefined;
  const where: Prisma.UserWhereInput = { ...(role ? { role } : {}), ...(q ? { OR: [
    { name: { contains: q, mode: "insensitive" } }, { username: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } },
    { candidateProfile: { is: { currentCompany: { contains: q, mode: "insensitive" } } } }, { candidateProfile: { is: { goalRole: { contains: q, mode: "insensitive" } } } },
    { mentorProfile: { is: { currentCompany: { contains: q, mode: "insensitive" } } } }, { mentorProfile: { is: { domain: { contains: q, mode: "insensitive" } } } },
  ] } : {}) };
  const [users, total] = await Promise.all([prisma.user.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * pageSize, take: pageSize, include: { candidateProfile: { select: { currentCompany: true, goalRole: true } }, mentorProfile: { select: { currentCompany: true, domain: true, verificationStatus: true } } } }), prisma.user.count({ where })]);
  const pages = Math.max(1, Math.ceil(total / pageSize)); const href = (target: number) => `/dashboard/admin/users?${new URLSearchParams({ ...(q ? { q } : {}), ...(role ? { role } : {}), page: String(target) })}` as Route;
  return <DashboardShell eyebrow="Admin" role={UserRole.ADMIN} title="User directory" subtitle="Search candidates and mentors across accounts and profile details.">
    <form action="/dashboard/admin/users" className="filter-search card" method="get"><input defaultValue={q} name="q" placeholder="Name, email, company, role or domain" type="search" /><select defaultValue={role ?? ""} name="role"><option value="">All roles</option>{Object.values(UserRole).map((value) => <option key={value} value={value}>{value}</option>)}</select><button className="button" type="submit">Search</button></form>
    <Panel eyebrow="Directory" title={`${total} users`}>
      {users.length ? <div className="request-status-list">{users.map((user) => <div className="request-status-row" key={user.id}><div><strong>{user.name}</strong><p className="muted">@{user.username} · {user.email} · joined {formatLongDate(user.createdAt)}</p><p className="muted">{user.candidateProfile ? `${user.candidateProfile.goalRole} · ${user.candidateProfile.currentCompany}` : user.mentorProfile ? `${user.mentorProfile.domain} · ${user.mentorProfile.currentCompany} · ${user.mentorProfile.verificationStatus}` : "Admin"}</p></div><span className="request-status-chip">{user.role}</span></div>)}</div> : <EmptyState>No users match this search.</EmptyState>}
      {pages > 1 && <div className="panel-actions"><Link className="button secondary" aria-disabled={page === 1} href={href(Math.max(1, page - 1))}>Previous</Link><span className="muted">Page {page} of {pages}</span><Link className="button secondary" aria-disabled={page === pages} href={href(Math.min(pages, page + 1))}>Next</Link></div>}
    </Panel>
  </DashboardShell>;
}
