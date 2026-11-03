import Link from "next/link";
import { SieraEmpty } from "./siera";
import { buttonVariants } from "./ui/button";

export function EmptyState({
  title,
  hint,
  ctaHref,
  ctaLabel,
  id,
  compact = false,
}: {
  title: string;
  hint: string;
  ctaHref: string;
  ctaLabel: string;
  id?: string;
  compact?: boolean;
}) {
  return (
    <SieraEmpty
      id={id}
      compact={compact}
      title={title}
      hint={hint}
      action={
        <Link
          href={ctaHref}
          className={buttonVariants({
            className:
              "flex h-12 w-full items-center justify-center rounded-2xl text-[15px] font-bold",
          })}
        >
          {ctaLabel}
        </Link>
      }
    />
  );
}
