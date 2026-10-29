"use client";

import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

/** Crash total (root layout ikut rusak): layout mandiri + tombol beranda. */
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
            maxWidth: "36rem",
            minHeight: "100dvh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "1rem",
            padding: "4rem 1rem",
            textAlign: "center",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          <h1 style={{ fontSize: "1.875rem", fontWeight: 700 }}>Halaman gagal dimuat</h1>
          <p style={{ color: "#555" }}>
            Sesuatu bermasalah di sisi kami. Coba muat ulang — kalau masih gagal, kembali ke
            beranda.
          </p>
          <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
            <button
              type="button"
              onClick={() => reset()}
              style={{
                minHeight: 44,
                padding: "0 1.25rem",
                borderRadius: 8,
                border: "none",
                background: "#2E7D4F",
                color: "#fff",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Coba lagi
            </button>
            <Link
              href="/"
              className={buttonVariants({ variant: "outline", size: "lg", className: "min-h-11" })}
            >
              Kembali ke beranda
            </Link>
          </div>
        </main>
      </body>
    </html>
  );
}
