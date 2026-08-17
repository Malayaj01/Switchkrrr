import Link from "next/link";

export default function NotFound() {
  return (
    <main className="auth-shell">
      <section className="auth-card card">
        <p className="eyebrow">404</p>
        <h1>That page does not exist.</h1>
        <p className="muted">The link may be out of date, or the page may have moved.</p>
        <div className="form-actions">
          <Link className="button" href="/">
            Back to home
          </Link>
          <Link className="button secondary" href="/dashboard">
            Go to dashboard
          </Link>
        </div>
      </section>
    </main>
  );
}
