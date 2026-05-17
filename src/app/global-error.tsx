"use client";

import * as React from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error("Global error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          fontFamily: "system-ui, -apple-system, sans-serif",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "1.5rem",
          background:
            "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)",
          color: "#e2e8f0",
          margin: 0,
        }}
      >
        <div style={{ maxWidth: 480, textAlign: "center" }}>
          <div
            style={{
              width: 80,
              height: 80,
              margin: "0 auto",
              borderRadius: 16,
              background:
                "linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 36,
              fontWeight: 700,
            }}
          >
            !
          </div>
          <h1 style={{ marginTop: 24, fontSize: 24, fontWeight: 700 }}>
            Application failed to load
          </h1>
          <p style={{ marginTop: 8, fontSize: 14, color: "#94a3b8" }}>
            A critical error occurred. Please refresh or try again in a moment.
          </p>
          {error.digest && (
            <p
              style={{
                marginTop: 4,
                fontSize: 11,
                color: "#64748b",
                fontFamily: "ui-monospace, monospace",
              }}
            >
              ref · {error.digest}
            </p>
          )}
          <button
            onClick={reset}
            style={{
              marginTop: 24,
              padding: "0.5rem 1rem",
              borderRadius: 8,
              border: "none",
              background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
              color: "#fff",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Retry
          </button>
        </div>
      </body>
    </html>
  );
}
