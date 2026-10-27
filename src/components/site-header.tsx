import { Recycle } from "lucide-react";
import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-10 border-b bg-card/90 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-heading text-lg font-bold">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Recycle className="size-5" aria-hidden />
          </span>
          Porsi Terakhir
        </Link>
        <nav className="flex items-center gap-2 text-sm">
          <Link
            href="/cara-kerja"
            className="rounded-lg px-3 py-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            Cara Kerja
          </Link>
          <Link
            href="/katalog"
            className="rounded-lg bg-primary px-4 py-2 font-semibold text-primary-foreground transition-colors hover:bg-[#256640]"
          >
            Lihat Katalog
          </Link>
        </nav>
      </div>
    </header>
  );
}
