import Link from "next/link";

export function EmptyState({
  title,
  hint,
  ctaHref,
  ctaLabel,
}: {
  title: string;
  hint: string;
  ctaHref: string;
  ctaLabel: string;
}) {
  return (
    <div className="border-b py-10 text-center">
      <p className="font-semibold">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{hint}</p>
      <Link
        href={ctaHref}
        className="mt-4 inline-flex h-11 items-center rounded-lg border px-4 text-sm font-semibold transition-colors hover:bg-muted"
      >
        {ctaLabel}
      </Link>
    </div>
  );
}
