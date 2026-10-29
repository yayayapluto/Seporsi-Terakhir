"use client";

import { LogIn, UserRound } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { buttonVariants } from "@/components/ui/button";
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
        </Link>
        <nav className="hidden items-center gap-1 text-sm lg:flex" aria-label="Navigasi utama">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="inline-flex min-h-11 items-center rounded-lg px-3 py-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <nav className="flex items-center gap-2 text-sm" aria-label="Navigasi akun">
          {signedIn ? (
            <Link
              href="/profil"
              className="inline-flex min-h-11 items-center gap-1.5 rounded-lg px-3 py-2 font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <UserRound className="size-5" aria-hidden />
              Profil
            </Link>
          ) : (
            <Link
              href="/masuk"
              aria-label="Masuk ke akun"
              className={buttonVariants({ size: "sm", className: "min-h-11 gap-1.5" })}
            >
              Masuk
              <LogIn className="size-4" aria-hidden />
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
