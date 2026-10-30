"use client";

import { CircleAlert } from "lucide-react";
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
    <main className="mx-auto flex w-full max-w-[430px] flex-1 flex-col justify-center gap-4 px-4 py-10">
      <div className="flex flex-col gap-1 rounded-[20px] border border-[#E8ECE9] bg-gradient-to-b from-[#EAF5ED] to-white p-5">
        <h1 className="text-xl leading-snug font-extrabold tracking-tight text-[#1C2826]">
          Halaman gagal dimuat
        </h1>
      </div>
      <p
        role="alert"
        className="flex items-start gap-2 rounded-2xl border border-[#F3C2C2] bg-[#FDECEC] px-4 py-3 text-sm font-semibold text-[#BA1A1A]"
      >
        <CircleAlert className="mt-0.5 size-5 shrink-0" aria-hidden />
        Sesuatu bermasalah di sisi kami, bukan salahmu. Coba muat ulang — kalau masih gagal, kembali
        ke beranda dan mulai lagi dari sana.
      </p>
      <div className="flex w-full flex-col gap-2">
        <Button
          type="button"
          size="lg"
          className="min-h-12 w-full text-[15px]"
          onClick={() => reset()}
        >
          Coba lagi
        </Button>
        <Link
          href="/"
          className={buttonVariants({
            variant: "outline",
            size: "lg",
            className: "min-h-12 w-full text-[15px]",
          })}
        >
          Kembali ke beranda
        </Link>
      </div>
    </main>
  );
}
