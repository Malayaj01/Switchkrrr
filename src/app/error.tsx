"use client";

export default function RootError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className="auth-page"><section className="auth-card card"><p className="eyebrow">Something went wrong</p><h1>We couldn&apos;t load that page.</h1><p className="muted">Please try again. If the problem persists, contact support.</p><button className="button" onClick={reset}>Try again</button></section></main>;
}
