import Link from "next/link";

export default function DashboardNotFound() {
  return <section className="dashboard-panel card"><p className="eyebrow">Not found</p><h1>That workspace does not exist.</h1><p className="muted">It may have been removed or you may not have access to it.</p><Link className="button" href="/dashboard">Return to dashboard</Link></section>;
}
