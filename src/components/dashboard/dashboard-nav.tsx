"use client";

import { UserRole } from "@prisma/client";
import { BriefcaseBusiness, Handshake, Inbox, LayoutDashboard, ShieldCheck, UserRoundCog, UsersRound } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";

type DashboardNavProps = {
  role: UserRole;
};

type NavItem = {
  href: string;
  icon: React.ReactNode;
  label: string;
  roles: UserRole[];
};

const navItems: NavItem[] = [
  {
    href: "/dashboard",
    icon: <LayoutDashboard size={16} />,
    label: "Dashboard",
    roles: [UserRole.CANDIDATE, UserRole.MENTOR, UserRole.ADMIN],
  },
  {
    href: "/dashboard/profile",
    icon: <UserRoundCog size={16} />,
    label: "Profile",
    roles: [UserRole.CANDIDATE, UserRole.MENTOR],
  },
  {
    href: "/dashboard/mentors",
    icon: <BriefcaseBusiness size={16} />,
    label: "Find mentors",
    roles: [UserRole.CANDIDATE],
  },
  {
    href: "/dashboard/requests",
    icon: <Inbox size={16} />,
    label: "Requests",
    roles: [UserRole.CANDIDATE, UserRole.MENTOR],
  },
  {
    href: "/dashboard/hustles",
    icon: <Handshake size={16} />,
    label: "Hustles",
    roles: [UserRole.CANDIDATE, UserRole.MENTOR, UserRole.ADMIN],
  },
  {
    href: "/dashboard/admin/mentors",
    icon: <ShieldCheck size={16} />,
    label: "Admin",
    roles: [UserRole.ADMIN],
  },
  { href: "/dashboard/admin/users", icon: <UsersRound size={16} />, label: "Users", roles: [UserRole.ADMIN] },
];

/**
 * `/dashboard` would otherwise match every child route, so it only counts as
 * active on an exact match. Deeper routes stay active for their own subtree.
 */
function isActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function DashboardNav({ role }: DashboardNavProps) {
  const pathname = usePathname();
  const items = navItems.filter((item) => item.roles.includes(role));

  return (
    <nav className="dashboard-nav" aria-label="Dashboard navigation">
      {items.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <Link
            aria-current={active ? "page" : undefined}
            className={active ? "is-active" : undefined}
            href={item.href as Route}
            key={item.href}
          >
            {item.icon}
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
