"use client";

import Link from "next/link";

/** Crash total (root layout ikut rusak): mandiri tanpa Tailwind/komponen. */
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
            justifyContent: "center",
            gap: "1rem",
            padding: "2.5rem 1rem",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          <div
            style={{
              border: "1px solid #E8ECE9",
              borderRadius: 20,
              padding: 20,
              background: "linear-gradient(to bottom, #EAF5ED, #FFFFFF)",
            }}
          >
            <h1 style={{ fontSize: "1.25rem", lineHeight: 1.3, fontWeight: 800, color: "#1C2826" }}>
              Halaman gagal dimuat
            </h1>
          </div>
          <p
            role="alert"
            style={{
              border: "1px solid #F3C2C2",
              background: "#FDECEC",
              borderRadius: 16,
              padding: "12px 16px",
              fontSize: "0.875rem",
              fontWeight: 600,
              color: "#BA1A1A",
            }}
          >
            Sesuatu bermasalah di sisi kami. Coba muat ulang — kalau masih gagal, kembali ke
            beranda.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
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
                border: "1px solid #E8ECE9",
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
