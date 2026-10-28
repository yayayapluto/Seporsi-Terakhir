"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const NAV = [
  { href: "/cara-kerja", label: "Cara Kerja" },
  { href: "/#keamanan", label: "Keamanan Pangan" },
  { href: "/#faq", label: "FAQ" },
];

export function SiteHeader() {
  const [signedIn, setSignedIn] = useState(false);
  const router = useRouter();

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    try {
      const supabase = createClient();
      supabase.auth.getUser().then(({ data }) => setSignedIn(!!data.user));
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((event, session) => {
        setSignedIn(!!session?.user);
        // TOKEN_REFRESHED/INITIAL_SESSION fire hourly/on load — no refetch needed.
        if (event === "SIGNED_IN" || event === "SIGNED_OUT") router.refresh();
      });
      unsubscribe = () => subscription.unsubscribe();
    } catch {
      setSignedIn(false);
    }
    return () => unsubscribe?.();
  }, [router]);

  return (
    <header className="sticky top-0 z-10 border-b bg-card/90 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-2 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-heading text-lg font-bold">
          <Image
            src="/images/Logo_UPNVJ.png"
            alt="Logo UPN Veteran Jakarta"
            width={32}
            height={32}
            className="size-8 object-contain"
          />
          Porsi Terakhir
          <span className="hidden rounded-full bg-secondary px-2 py-0.5 text-[11px] font-semibold text-primary sm:inline">
            Tahap Awal
          </span>
        </Link>
        <nav className="hidden items-center gap-1 text-sm lg:flex" aria-label="Navigasi utama">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="rounded-lg px-3 py-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <nav className="flex items-center gap-2 text-sm" aria-label="Navigasi akun">
          {signedIn ? (
            <>
              <Link
                href="/profil"
                className="rounded-lg px-3 py-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                Profil
              </Link>
              <button
                type="button"
                onClick={async () => {
                  await createClient().auth.signOut();
                  router.push("/");
                  router.refresh();
                }}
                className="rounded-lg px-3 py-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                Keluar
              </button>
            </>
          ) : (
            <>
              <Link
                href="/cara-kerja"
                className="hidden rounded-lg px-3 py-2 font-medium transition-colors hover:bg-muted md:inline"
              >
                Jadi Tenant
              </Link>
              <Link
                href="/masuk"
                className="rounded-lg bg-primary px-4 py-2 font-semibold text-primary-foreground transition-colors hover:bg-[#256640]"
              >
                Masuk
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
