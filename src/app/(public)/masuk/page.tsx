import { Suspense } from "react";
import { GoogleSignIn } from "./google-sign-in";
import { MasukMotion } from "./masuk-motion";

async function MasukContent({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;
  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-10">
      <MasukMotion className="flex flex-col gap-6">
        <div className="flex flex-col gap-2 text-center">
          <h1 className="text-2xl font-bold">Masuk ke akun</h1>
          <p className="text-sm text-muted-foreground">
            Satu akun untuk mahasiswa, tenant, dan admin. Login memakai Google.
          </p>
        </div>
        {error === "oauth" && (
          <p
            role="alert"
            className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          >
            Login Google gagal. Silakan coba lagi.
          </p>
        )}
        <GoogleSignIn next={next} />
        <p className="text-center text-xs text-muted-foreground">
          Dengan masuk, kamu menyetujui penggunaan datamu untuk pencatatan dampak sesuai SOP
          keamanan pangan di Cara Kerja.
        </p>
      </MasukMotion>
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
