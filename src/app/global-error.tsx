"use client";

import Link from "next/link";

/** Crash total: mandiri tanpa Tailwind/komponen. */
export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="id">
      <body>
        <main
          style={{
            margin: "0 auto",
            maxWidth: "430px",
            minHeight: "100dvh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "1.25rem",
            padding: "2.5rem 1rem",
            fontFamily: "system-ui, sans-serif",
            textAlign: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 8,
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                border: "1px solid var(--line)",
                background: "#EAF5ED",
                color: "#2E7D4F",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
                <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                <path d="M16 16h5v5" />
              </svg>
            </div>
            <div>
              <h1
                style={{ fontSize: "1.25rem", lineHeight: 1.3, fontWeight: 800, color: "#1C2826" }}
              >
                Halaman gagal dimuat
              </h1>
              <p style={{ marginTop: 6, fontSize: "0.875rem", color: "#556168" }}>
                Coba muat ulang, atau kembali ke beranda.
              </p>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", width: "100%" }}>
            <button
              type="button"
              onClick={() => reset()}
              style={{
                minHeight: 48,
                width: "100%",
                borderRadius: 14,
                border: "none",
                background: "#2E7D4F",
                color: "#fff",
                fontSize: 15,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Coba lagi
            </button>
            <Link
              href="/"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: 48,
                width: "100%",
                borderRadius: 14,
                border: "1px solid var(--line)",
                background: "#fff",
                color: "#1C2826",
                fontSize: 15,
                fontWeight: 700,
                textDecoration: "none",
              }}
            >
              Kembali ke beranda
            </Link>
          </div>
        </main>
      </body>
    </html>
  );
}
