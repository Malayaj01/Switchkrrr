import { UserRole } from "@prisma/client";
import type { Route } from "next";
import Link from "next/link";
import { LogoutButton } from "@/components/auth/logout-button";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";

type DashboardShellProps = {
  children: React.ReactNode;
  eyebrow: string;
  role: UserRole;
  subtitle?: string;
  title: string;
  /** Optional header action rendered next to the logout button. */
  action?: React.ReactNode;
};

export function DashboardShell({ action, children, eyebrow, role, subtitle, title }: DashboardShellProps) {
  return (
    <main className="shell">
      <header className="dashboard-header">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
          {subtitle && <p className="muted">{subtitle}</p>}
        </div>
        <div className="dashboard-header-actions">
          {action}
          <LogoutButton />
        </div>
      </header>
      <DashboardNav role={role} />
      <section className="dashboard-main">{children}</section>
    </main>
  );
}

export type Metric = {
  icon?: React.ReactNode;
  label: string;
  value: number | string;
  hint?: string;
  href?: string;
};

export function MetricGrid({ metrics }: { metrics: Metric[] }) {
  return (
    <section className="metric-grid">
      {metrics.map((metric) => {
        const body = (
          <>
            {metric.icon}
            <div>
              <strong>{metric.value}</strong>
              <span>{metric.label}</span>
              {metric.hint && <small className="metric-hint">{metric.hint}</small>}
            </div>
          </>
        );

        return metric.href ? (
          <Link className="metric-card card is-linked" href={metric.href as Route} key={metric.label}>
            {body}
          </Link>
        ) : (
          <article className="metric-card card" key={metric.label}>
            {body}
          </article>
        );
      })}
    </section>
  );
}

export function Panel({
  actions,
  children,
  eyebrow,
  meta,
  title,
}: {
  actions?: React.ReactNode;
  children: React.ReactNode;
  eyebrow?: string;
  meta?: React.ReactNode;
  title: string;
}) {
  return (
    <section className="dashboard-panel card">
      <div className="panel-head">
        <div>
          {eyebrow && <p className="eyebrow">{eyebrow}</p>}
          <h2>{title}</h2>
          {actions}
        </div>
        {meta}
      </div>
      {children}
    </section>
  );
}

export function EmptyState({ children }: { children: React.ReactNode }) {
  return <p className="muted empty-state">{children}</p>;
}

export function SummaryItem({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="summary-item">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

/** Horizontal usage bar used for mentor capacity and candidate Hustle slots. */
export function CapacityBar({
  isFull,
  isNearlyFull,
  label,
  percent,
}: {
  isFull: boolean;
  isNearlyFull: boolean;
  label: string;
  percent: number;
}) {
  const tone = isFull ? "is-full" : isNearlyFull ? "is-warning" : "";

  return (
    <div className="capacity-bar">
      <div className="capacity-track" aria-hidden>
        <div className={`capacity-fill ${tone}`} style={{ width: `${percent}%` }} />
      </div>
      <span className="capacity-label">{label}</span>
    </div>
  );
}
