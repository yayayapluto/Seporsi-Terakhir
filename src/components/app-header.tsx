import { Bell } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { unreadFor } from "./bottom-nav";

/** AppHeader Siera: logo + judul halaman + bell notifikasi. Khusus area login. */
export async function AppHeader({ title }: { title: string }) {
  const current = await getCurrentUser();
  const unread = await unreadFor(current?.role ?? null, current?.user.id ?? null);
  return (
    <header className="flex h-[60px] items-center justify-between gap-2 border-b border-[#E8ECE9] bg-white px-4">
      <span className="flex min-w-0 items-center gap-2">
        <Image
          src="/images/Logo_UPNVJ.png"
          alt="Logo UPN Veteran Jakarta"
          width={28}
          height={28}
          className="size-7 shrink-0 object-contain"
        />
        <span className="truncate text-lg font-extrabold text-[#2E7D4F]">{title}</span>
      </span>
      <Link
        href="/notifikasi"
        aria-label={unread > 0 ? `Notifikasi, ${unread} belum dibaca` : "Notifikasi"}
        className="relative flex size-11 shrink-0 items-center justify-center rounded-full text-[#1C2826] transition-colors outline-none hover:bg-[#F1F5F2] focus-visible:ring-2 focus-visible:ring-[#2E7D4F]"
      >
        <Bell className="size-6" strokeWidth={1.75} aria-hidden />
        {unread > 0 && (
          <span
            aria-hidden
            className="absolute top-1 right-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-[#BA1A1A] px-1 text-[11px] font-bold text-white"
          >
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </Link>
    </header>
  );
}
