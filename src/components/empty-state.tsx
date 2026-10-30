import Link from "next/link";
import { buttonVariants } from "./ui/button";

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
    <div className="flex flex-col items-center gap-3 rounded-[20px] border-[1.5px] border-dashed border-[#E8ECE9] bg-white px-4 py-10 text-center">
      <p className="text-sm font-bold text-[#1C2826]">{title}</p>
      <p className="text-sm text-[#64746B]">{hint}</p>
      <Link
        href={ctaHref}
        className={buttonVariants({
          className:
            "flex h-12 w-full items-center justify-center rounded-2xl text-[15px] font-bold",
        })}
      >
        {ctaLabel}
      </Link>
    </div>
  );
}
