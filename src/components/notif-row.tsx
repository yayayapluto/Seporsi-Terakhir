import { cn } from "cn";
import Link from "next/link";
import { sieraCardClass } from "@/components/siera";
import { formatDateTimeWIB } from "@/lib/format";
import type { NotifItem } from "@/lib/notifs";

/** Baris notifikasi Siera: tile inisial + judul/waktu + deskripsi. */
export function NotifRow({ n, onNavigate }: { n: NotifItem; onNavigate?: () => void }) {
  return (
    <Link
      href={n.href}
      onClick={onNavigate}
      className={cn(sieraCardClass, "flex min-h-11 items-center gap-3 px-4 py-3.5")}
    >
      <span
        aria-hidden
        className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#DCEBE0] text-sm font-extrabold text-[#1E5A36]"
      >
        {n.title.charAt(0).toUpperCase()}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="flex items-baseline justify-between gap-2">
          <span className="truncate text-sm font-bold text-[#1C2826] max-md:whitespace-normal max-md:[overflow-wrap:anywhere]">
            {n.title}
          </span>
          <span className="shrink-0 text-xs whitespace-nowrap text-[#64746B]">
            {formatDateTimeWIB(new Date(n.time))}
          </span>
        </span>
        <span className="line-clamp-2 text-[13px] text-[#1C2826]">{n.desc}</span>
      </span>
    </Link>
  );
}
