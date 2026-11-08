"use client";

import { RotateCcw } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

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
    <main className="mx-auto flex w-full max-w-[430px] flex-1 flex-col items-center justify-center gap-5 px-5 py-10 text-center">
      <div className="flex flex-col items-center gap-2">
        <div className="flex size-12 items-center justify-center rounded-full border border-line bg-[#EAF5ED] text-[#2E7D4F]">
          <RotateCcw className="size-5" aria-hidden />
        </div>
        <h1 className="text-xl leading-snug font-extrabold tracking-tight text-[#1C2826]">
          Halaman gagal dimuat
        </h1>
        <p className="text-sm text-muted-foreground">Coba muat ulang, atau kembali ke beranda.</p>
      </div>
      <div className="flex w-full flex-col gap-2">
        <Button
          type="button"
          size="lg"
          className="min-h-12 w-full text-[15px]"
          onClick={() => reset()}
        >
          Coba lagi
        </Button>
        <Button type="button" size="lg" variant="outline" className="min-h-12 w-full text-[15px]">
          <Link href="/">Kembali ke beranda</Link>
        </Button>
      </div>
    </main>
  );
}
