"use client";

import { useEffect } from "react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[dashboard] unhandled render error", error);
  }, [error]);

  return (
    <section className="dashboard-panel card">
      <p className="eyebrow">Dashboard unavailable</p>
      <h1>We couldn&apos;t load this section.</h1>
      <p className="muted">
        Your account may still be setting up, or the database may be unreachable. Try again in a moment.
      </p>
      {error.digest && <p className="muted">Reference: {error.digest}</p>}
      <div className="form-actions">
        <button className="button" onClick={reset} type="button">
          Try again
        </button>
      </div>
    </section>
  );
}
