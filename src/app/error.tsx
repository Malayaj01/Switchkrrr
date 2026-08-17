"use client";

import { useEffect } from "react";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // Without this the error is swallowed entirely in production. `digest` is the
  // id shown to the user, so it can be matched against server logs.
  useEffect(() => {
    console.error("[app] unhandled render error", error);
  }, [error]);

  return (
    <main className="auth-shell">
      <section className="auth-card card">
        <p className="eyebrow">Something went wrong</p>
        <h1>We couldn&apos;t load that page.</h1>
        <p className="muted">Please try again. If it keeps happening, contact support.</p>
        {error.digest && <p className="muted">Reference: {error.digest}</p>}
        <div className="form-actions">
          <button className="button" onClick={reset} type="button">
            Try again
          </button>
        </div>
      </section>
    </main>
  );
}
