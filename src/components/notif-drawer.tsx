"use client";

import { Bell, Check, X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import type { NotifItem } from "@/lib/notifs";
import { NotifRow } from "./notif-row";

/** Bell notifikasi + drawer kanan (Motion). Isi awal dari server, segar via NotifLive. */
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
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
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
    const prev = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      prev?.focus?.();
    };
  }, [open]);

  const fade = reduce
    ? {}
    : {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration: 0.18 },
      };
  const slide = reduce
    ? {}
    : {
        initial: { x: "100%" },
        animate: { x: 0 },
        exit: { x: "100%" },
        transition: { type: "tween" as const, duration: 0.25, ease: "easeOut" as const },
      };

  const newCount = notifs.filter((n) => !readIds.has(n.id)).length;

  return (
    <>
      {live}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={unread > 0 ? `Notifikasi, ${unread} belum dibaca` : "Notifikasi"}
        aria-haspopup="dialog"
        className="relative flex size-11 shrink-0 items-center justify-center rounded-full text-[#1C2826] outline-none transition-colors hover:bg-[#F1F5F2] focus-visible:ring-2 focus-visible:ring-[#2E7D4F]"
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
      </button>
      <AnimatePresence>
        {open && (
          <div key="notif-drawer" className="fixed inset-0 z-[80]">
            <motion.div
              aria-hidden
              className="absolute inset-0 bg-black/45"
              onClick={() => setOpen(false)}
              {...fade}
            />
            <motion.aside
              role="dialog"
              aria-modal="true"
              aria-label="Notifikasi"
              className="absolute top-0 right-0 flex h-dvh w-full flex-col bg-white shadow-xl sm:w-[400px] sm:border-l sm:border-line"
              {...slide}
            >
              <div className="flex items-center justify-between gap-2 border-b border-line bg-white px-4 py-3">
                <div className="min-w-0">
                  <h2 className="truncate text-base font-extrabold text-[#1C2826]">
                    Notifikasi
                    {newCount > 0 && (
                      <span className="ml-2 text-[13px] font-semibold text-[#64746B]">
                        {newCount} baru
                      </span>
                    )}
                  </h2>
                  {newCount > 0 && (
                    <button
                      type="button"
                      onClick={markAll}
                      className="mt-0.5 min-h-11 text-left text-[13px] font-bold text-[#2E7D4F] underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-[#2E7D4F]"
                    >
                      Tandai semua dibaca
                    </button>
                  )}
                </div>
                <button
                  ref={closeRef}
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Tutup notifikasi"
                  className="flex size-11 items-center justify-center rounded-full text-[#1C2826] outline-none hover:bg-[#F1F5F2] focus-visible:ring-2 focus-visible:ring-[#2E7D4F]"
                >
                  <X className="size-6" strokeWidth={1.75} aria-hidden />
                </button>
              </div>
              <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 py-4">
                {notifs.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 rounded-[20px] border-[1.5px] border-dashed border-line bg-white px-4 py-10 text-center">
                    <p className="text-sm font-bold text-[#1C2826]">Belum ada kabar</p>
                    <p className="text-sm text-[#64746B]">
                      Perubahan status pesanan dan pendaftaran akan muncul di sini.
                    </p>
                  </div>
                ) : (
                  notifs.map((n) => {
                    const read = readIds.has(n.id);
                    return (
                      <div
                        key={n.id}
                        className={`flex items-start gap-2 ${read ? "opacity-60" : ""}`}
                      >
                        <div className="min-w-0 flex-1">
                          <NotifRow n={n} onNavigate={() => setOpen(false)} />
                        </div>
                        <button
                          type="button"
                          onClick={() => markOne(n.id)}
                          disabled={read}
                          aria-label={read ? "Sudah dibaca" : `Tandai "${n.title}" sudah dibaca`}
                          title={read ? "Sudah dibaca" : "Tandai sudah dibaca"}
                          className="flex size-11 shrink-0 items-center justify-center rounded-full border border-line bg-white text-[#2E7D4F] outline-none transition-colors hover:bg-[#F1F5F2] focus-visible:ring-2 focus-visible:ring-[#2E7D4F] disabled:opacity-40"
                        >
                          <Check className="size-5" strokeWidth={2} aria-hidden />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
