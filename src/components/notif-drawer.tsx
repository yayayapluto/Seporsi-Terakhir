"use client";

import { Bell } from "lucide-react";
import { useEffect, useState } from "react";
import type { NotifItem } from "@/lib/notifs";
import { NotifRow } from "./notif-row";
import { sieraCountText } from "./siera";
import { Button } from "./ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "./ui/sheet";

/** Bell notifikasi + drawer kanan di atas primitif shadcn Sheet. Isi awal dari server, segar via NotifLive. */
export function NotifDrawer({
  notifs,
  unread,
  userKey,
  live,
}: {
  notifs: NotifItem[];
  unread: number;
  userKey: string;
  live: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [readIds, setReadIds] = useState<ReadonlySet<string>>(new Set());

  useEffect(() => {
    if (!open) return;
    try {
      const raw = localStorage.getItem(`notif-read-${userKey}`);
      if (raw) setReadIds(new Set(JSON.parse(raw) as string[]));
    } catch {
      /* abaikan */
    }
  }, [open, userKey]);

  const persist = (ids: ReadonlySet<string>) => {
    setReadIds(ids);
    try {
      localStorage.setItem(`notif-read-${userKey}`, JSON.stringify([...ids]));
    } catch {
      /* abaikan */
    }
  };
  const markOne = (id: string) => {
    if (readIds.has(id)) return;
    persist(new Set(readIds).add(id));
  };
  const markAll = () => persist(new Set(notifs.map((n) => n.id)));

  useEffect(() => {
    if (!open) return;
    try {
      const raw = localStorage.getItem(`notif-read-${userKey}`);
      if (raw) setReadIds(new Set(JSON.parse(raw) as string[]));
    } catch {
      /* abaikan */
    }
  }, [open, userKey]);

  const newCount = notifs.filter((n) => !readIds.has(n.id)).length;
  return (
    <>
      {live}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => setOpen(true)}
        aria-label={unread > 0 ? `Notifikasi, ${unread} belum dibaca` : "Notifikasi"}
        aria-haspopup="dialog"
        className="relative size-11 shrink-0 rounded-full text-[#1C2826] hover:bg-[#F1F5F2]"
      >
        <Bell className="size-6" strokeWidth={1.75} aria-hidden />
        {unread > 0 && (
          <span
            aria-hidden
            className="absolute top-1 right-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-[#BA1A1A] px-1 text-[11px] font-bold text-white"
          >
            {sieraCountText(unread)}
          </span>
        )}
      </Button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="right"
          showCloseButton={false}
          className="h-dvh w-full p-0 sm:max-w-[400px]"
          aria-label="Notifikasi"
        >
          <SheetHeader className="flex-row items-center justify-between gap-2 border-b border-line bg-white px-4 py-3">
            <div className="min-w-0">
              <SheetTitle className="truncate text-base font-extrabold text-[#1C2826]">
                Notifikasi
                {newCount > 0 && (
                  <span className="ml-2 text-[13px] font-semibold text-[#64746B]">
                    {newCount} baru
                  </span>
                )}
              </SheetTitle>
              <SheetDescription className="sr-only">
                Perubahan status pesanan dan pendaftaran.
              </SheetDescription>
              {newCount > 0 && (
                <Button
                  type="button"
                  variant="link"
                  onClick={markAll}
                  className="mt-0.5 min-h-11 justify-start px-0 text-left text-[13px] font-bold text-[#2E7D4F]"
                >
                  Tandai semua dibaca
                </Button>
              )}
            </div>
          </SheetHeader>
          <ul className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto px-4 py-4 max-md:gap-2.5 max-md:px-4 list-none m-0 p-0">
            {notifs.length === 0 ? (
              <li className="flex flex-col items-center gap-2 rounded-[20px] border-[1.5px] border-dashed border-line bg-white px-4 py-10 text-center list-none">
                <p className="text-sm font-bold text-[#1C2826]">Belum ada kabar</p>
                <p className="text-sm text-[#64746B]">
                  Perubahan status pesanan dan pendaftaran akan muncul di sini.
                </p>
              </li>
            ) : (
              notifs.map((n) => {
                const read = readIds.has(n.id);
                return (
                  <NotifRow
                    key={n.id}
                    n={n}
                    onNavigate={() => setOpen(false)}
                    read={read}
                    onMarkRead={() => markOne(n.id)}
                  />
                );
              })
            )}
          </ul>
        </SheetContent>
      </Sheet>
    </>
  );
}
