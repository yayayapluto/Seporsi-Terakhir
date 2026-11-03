import Link from "next/link";
import { Suspense } from "react";
import { SieraAlert, SieraCard } from "@/components/siera";

import { ROUTES } from "@/lib/routes";
import { DevLoginCard } from "./dev-login-card";
import { EmailSignIn } from "./email-sign-in";
import { GoogleSignIn } from "./google-sign-in";

async function MasukContent({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;
  return (
    <div className="mx-auto flex w-full max-w-[430px] flex-1 flex-col justify-center gap-4 px-4 py-10">
      <div className="flex flex-col gap-1 rounded-[20px] border border-line bg-gradient-to-b from-[#EAF5ED] to-white p-5">
        <h1 className="text-xl leading-snug font-extrabold tracking-tight text-[#1C2826]">
          Selamat datang kembali
        </h1>
        <p className="text-sm text-[#1E5A36]">Pilih cara masuk favoritmu. Tanpa kata sandi.</p>
      </div>
      {(error === "oauth" || error === "magic-link") && (
        <SieraAlert variant="error">
          {error === "oauth"
            ? "Login Google gagal. Silakan coba lagi."
            : "Tautan tidak valid atau kedaluwarsa. Minta tautan baru di bawah."}
        </SieraAlert>
      )}
      <SieraCard className="p-4">
        <GoogleSignIn next={next} />
      </SieraCard>
      <div className="flex items-center gap-3 text-xs text-muted-foreground" aria-hidden="true">
        <span className="h-px flex-1 bg-border" />
        atau
        <span className="h-px flex-1 bg-border" />
      </div>
      <SieraCard className="flex flex-col gap-4 p-4">
        <EmailSignIn next={next} />
        <p className="border-t border-dashed border-line pt-3 text-center text-[12px] leading-relaxed text-[#64746B]">
          Dengan masuk, kamu menyetujui penggunaan datamu untuk pencatatan dampak sesuai{" "}
          <Link
            href={ROUTES.caraKerja}
            className="font-semibold text-[#1E5A36] underline underline-offset-2 outline-none focus-visible:ring-2 focus-visible:ring-[#2E7D4F]"
          >
            SOP keamanan pangan di Cara Kerja
          </Link>
          .
        </p>
      </SieraCard>
      {process.env.NODE_ENV !== "production" && <DevLoginCard next={next} />}
    </div>
  );
}

export default function MasukPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  return (
    <Suspense>
      <MasukContent searchParams={searchParams} />
    </Suspense>
  );
}
