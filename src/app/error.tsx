"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Button, buttonVariants } from "@/components/ui/button";

export default function ErrorPage({
  error: cause,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(cause);
  }, [cause]);

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      <p className="text-sm font-semibold text-muted-foreground">Ada kendala</p>
      <h1 className="text-balance font-display text-3xl font-bold">Halaman gagal dimuat</h1>
      <p className="text-pretty text-muted-foreground">
        Sesuatu bermasalah di sisi kami, bukan salahmu. Coba muat ulang — kalau masih gagal, kembali
        ke beranda dan mulai lagi dari sana.
      </p>
      <div className="mt-2 flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
        <Button type="button" size="lg" className="min-h-11" onClick={() => reset()}>
          Coba lagi
        </Button>
        <Link
          href="/"
          className={buttonVariants({ variant: "outline", size: "lg", className: "min-h-11" })}
        >
          Kembali ke beranda
        </Link>
      </div>
    </main>
  );
}
