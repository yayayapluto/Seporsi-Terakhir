import { Suspense } from "react";
import { EmailSignIn } from "./email-sign-in";
import { GoogleSignIn } from "./google-sign-in";

async function MasukContent({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;
  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-6 px-4 py-10">
      <div className="flex flex-col gap-2 border-b-2 border-foreground pb-6 text-center">
        <h1 className="text-2xl font-extrabold tracking-tight">
          Masuk ke akun mahasiswa, tenant, admin
        </h1>
        <p className="text-sm text-muted-foreground">
          Satu akun untuk mahasiswa, tenant, dan admin. Pilih caramu masuk.
        </p>
      </div>
      {error === "oauth" && (
        <p
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          Login Google gagal. Silakan coba lagi.
        </p>
      )}
      <EmailSignIn next={next} />
      <div className="flex items-center gap-3 text-xs text-muted-foreground" aria-hidden="true">
        <span className="h-px flex-1 bg-border" />
        atau
        <span className="h-px flex-1 bg-border" />
      </div>
      <GoogleSignIn next={next} />
      <p className="border-t pt-4 text-center text-xs text-muted-foreground">
        Dengan masuk, kamu menyetujui penggunaan datamu untuk pencatatan dampak sesuai SOP keamanan
        pangan di Cara Kerja.
      </p>
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
