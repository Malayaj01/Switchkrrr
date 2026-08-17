"use client";

import { useEffect } from "react";

/**
 * Catches errors thrown by the root layout itself, which `error.tsx` cannot
 * reach. It replaces the whole document, so it has to render html and body and
 * cannot rely on the app stylesheet being present.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app] root layout error", error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#f7f2ea",
          color: "#17212b",
          fontFamily: "Inter, system-ui, -apple-system, Segoe UI, sans-serif",
          padding: "24px",
        }}
      >
        <main style={{ maxWidth: "34rem", textAlign: "center" }}>
          <p style={{ color: "#cf4f2f", fontWeight: 900, textTransform: "uppercase", fontSize: "0.78rem" }}>
            Switchkrr
          </p>
          <h1 style={{ fontSize: "1.9rem", margin: "8px 0" }}>Something went badly wrong.</h1>
          <p style={{ color: "#667085" }}>
            The application failed to start. Please reload, and contact support if it continues.
          </p>
          {error.digest && <p style={{ color: "#667085" }}>Reference: {error.digest}</p>}
          <button
            onClick={reset}
            style={{
              marginTop: "18px",
              minHeight: "44px",
              padding: "0 18px",
              border: 0,
              borderRadius: "8px",
              background: "#0f766e",
              color: "white",
              fontWeight: 800,
              cursor: "pointer",
            }}
            type="button"
          >
            Reload
          </button>
        </main>
      </body>
    </html>
  );
}
