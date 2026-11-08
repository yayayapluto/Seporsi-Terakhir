import { cn } from "cn";
import { Check } from "lucide-react";
import Link from "next/link";
import { sieraCardClass } from "@/components/siera";
import { formatDateTimeWIB } from "@/lib/format";
import type { NotifItem } from "@/lib/notifs";

/** Baris notifikasi Siera: tile inisial + judul/waktu + deskripsi. */
export function NotifRow({
  n,
  onNavigate,
  read = false,
  onMarkRead,
}: {
  n: NotifItem;
  onNavigate?: () => void;
  read?: boolean;
  onMarkRead?: () => void;
}) {
  return (
    <li
      className={cn(
        sieraCardClass,
        "flex min-h-11 items-center gap-3 px-4 py-3.5",
        "max-md:flex max-md:items-start max-md:gap-3 max-md:w-full max-md:p-3.5 max-md:bg-white max-md:border max-md:border-[#e3e9e5] max-md:rounded-2xl",
        read && "opacity-60",
      )}
    >
      {/* 1. avatar + 2. text column */}
      <Link
        href={n.href}
        onClick={onNavigate}
        className="flex min-w-0 flex-1 items-start gap-3 max-md:flex max-md:items-start max-md:gap-3 max-md:flex-1 max-md:min-w-0"
      >
        <div
          aria-hidden="true"
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-full bg-[#DCEBE0] text-sm font-extrabold text-[#1E5A36]",
            "max-md:size-10 max-md:shrink-0 max-md:rounded-full max-md:bg-[#e6f3ea] max-md:text-[#286f3b] max-md:grid max-md:place-items-center max-md:text-sm max-md:font-bold",
          )}
        >
          {n.title.charAt(0).toUpperCase()}
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-0.5 max-md:flex-1 max-md:min-w-0">
          <div className="flex items-baseline justify-between gap-2 max-md:block">
            <div className="truncate text-sm font-bold text-[#1C2826] max-md:text-[15px] max-md:font-bold max-md:leading-snug max-md:flex max-md:items-center max-md:gap-1.5 max-md:break-normal max-md:[overflow-wrap:break-word]">
              {!read && (
                <span
                  aria-hidden="true"
                  className="hidden max-md:inline-block size-2 rounded-full bg-[#286f3b] shrink-0"
                />
              )}
              <span>{n.title}</span>
            </div>
            <div className="shrink-0 text-xs text-[#64746B] whitespace-nowrap max-md:mt-0.5 max-md:text-xs max-md:text-[#5b6b62] max-md:break-normal max-md:[overflow-wrap:break-word]">
              {formatDateTimeWIB(new Date(n.time))}
            </div>
          </div>
          <p className="line-clamp-2 text-[13px] text-[#1C2826] max-md:mt-1.5 max-md:text-[13px] max-md:leading-normal max-md:text-[#4a5b51] max-md:line-clamp-3 max-md:break-normal max-md:[overflow-wrap:break-word]">
            {n.desc}
          </p>
        </div>
      </Link>

      {/* 3. read button: INSIDE the card, last in the row */}
      {onMarkRead && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onMarkRead();
          }}
          disabled={read}
          aria-label={read ? "Sudah dibaca" : `Tandai "${n.title}" sudah dibaca`}
          title={read ? "Sudah dibaca" : "Tandai dibaca"}
          className={cn(
            "size-11 shrink-0 rounded-full border border-[#e3e9e5] grid place-items-center text-[#286f3b] transition-opacity",
            "max-md:size-11 max-md:shrink-0 max-md:rounded-full max-md:border max-md:border-[#e3e9e5] max-md:grid max-md:place-items-center",
            read ? "opacity-50" : "hover:bg-[#f1f5f2]",
          )}
        >
          <Check className="size-[18px] max-md:size-[18px]" strokeWidth={2} aria-hidden="true" />
        </button>
      )}
    </li>
  );
}
