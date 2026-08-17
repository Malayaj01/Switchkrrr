/**
 * Streaming fallback for the dashboard routes. Every dashboard page is an async
 * server component running several queries, so without a fallback the user gets
 * a blank screen until the slowest query resolves.
 */
export function DashboardSkeleton({ metrics = 4, rows = 3 }: { metrics?: number; rows?: number }) {
  return (
    <main className="shell" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading</span>
      <header className="dashboard-header">
        <div style={{ display: "grid", gap: "10px" }}>
          <div className="skeleton skeleton-line" style={{ width: "7rem", height: "0.8rem" }} />
          <div className="skeleton skeleton-line" style={{ width: "16rem", height: "2.4rem" }} />
          <div className="skeleton skeleton-line" style={{ width: "22rem" }} />
        </div>
      </header>

      <div className="skeleton skeleton-nav" />

      <section className="dashboard-main">
        <section className="metric-grid">
          {Array.from({ length: metrics }).map((_, index) => (
            <article className="metric-card card" key={index}>
              <div className="skeleton skeleton-avatar" />
              <div style={{ display: "grid", gap: "8px", flex: 1 }}>
                <div className="skeleton skeleton-line" style={{ width: "3rem", height: "1.6rem" }} />
                <div className="skeleton skeleton-line" style={{ width: "70%" }} />
              </div>
            </article>
          ))}
        </section>

        {Array.from({ length: rows }).map((_, index) => (
          <section className="dashboard-panel card" key={index}>
            <div className="skeleton skeleton-line" style={{ width: "9rem", height: "1.2rem" }} />
            <div className="skeleton skeleton-line" style={{ width: "60%" }} />
            <div className="skeleton skeleton-line" style={{ width: "100%", height: "3rem" }} />
          </section>
        ))}
      </section>
    </main>
  );
}
