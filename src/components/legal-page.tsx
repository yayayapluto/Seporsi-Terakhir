import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

/** Dokumen legal publik (Read mode): kolom baca sempit, garis pemisah bab. */
export function LegalPage({
  title,
  updated,
  intro,
  children,
}: {
  title: string;
  updated: string;
  intro: string;
  children: ReactNode;
}) {
  return (
    <article className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-8 md:px-8 md:py-12 max-md:px-0 max-md:mx-0 max-md:pb-0">
      <header className="flex flex-col gap-2">
        <Link
          href="/"
          className="inline-flex min-h-11 w-fit items-center gap-1.5 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Kembali ke beranda
        </Link>
        <h1 className="font-heading text-3xl leading-tight font-extrabold tracking-tight text-foreground">
          {title}
        </h1>
        <p className="max-w-prose text-sm leading-relaxed text-muted-foreground">{intro}</p>
        <p className="text-xs font-semibold text-muted-foreground">
          Terakhir diperbarui: {updated}
        </p>
      </header>
      <div className="flex flex-col gap-6">{children}</div>
    </article>
  );
}

/** Satu bab dokumen legal: judul + isi, dipisah garis 1px. */
export function LegalSection({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section
      aria-labelledby={id}
      className="flex flex-col gap-2 border-t border-line pt-5 first:border-t-0 first:pt-0"
    >
      <h2 id={id} className="font-heading text-lg font-bold text-foreground">
        {title}
      </h2>
      <div className="flex max-w-prose flex-col gap-2 text-sm leading-relaxed text-foreground">
        {children}
      </div>
    </section>
  );
}
