"use client";

export default function DashboardError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <section className="dashboard-panel card"><p className="eyebrow">Dashboard unavailable</p><h1>We couldn&apos;t load this section.</h1><p className="muted">Your account may still be setting up. Please try again.</p><button className="button" onClick={reset}>Try again</button></section>;
}
