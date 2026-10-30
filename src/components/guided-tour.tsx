"use client";

import { ArrowLeft, ArrowRight, Map as MapIcon, Play, X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

export interface TourStep {
  target: string;
  title: string;
  body: string;
}

export interface TourIntro {
  title: string;
  body: string;
}

type Phase = "intro" | "step" | "confirm" | null;

/**
 * Spotlight tour terpadu: intro → langkah (sorot target) → konfirmasi lewati.
 * Sekali per tourKey (localStorage), kecuali forced (?mode=onboarding = replay).
 * Langkah yang targetnya tidak ada dilewati otomatis.
 * Adaptif device: bottom-sheet + safe-area di mobile, popover di desktop (≥1024px).
 */
export function GuidedTour({
  tourKey,
  steps,
  intro,
  forced = false,
  auto = true,
  journey = false,
  next,
  journeyLabel,
  finishLabel,
}: {
  tourKey: string;
  steps: TourStep[];
  intro?: TourIntro;
  forced?: boolean;
  /** Tampilkan otomatis sekali (localStorage). Mati bila false — hanya forced/journey. */
  auto?: boolean;
  /** Bagian dari rantai onboarding: selesai lanjut ke `next`, keluar = strip query. */
  journey?: boolean;
  next?: string;
  /** Label progres rantai, mis. "Bagian 2 dari 4". Tampil bila journey. */
  journeyLabel?: string;
  /** Teks tombol akhir, mis. "Lihat porsi sore ini". Default "Selesai". */
  finishLabel?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const reduce = useReducedMotion();
  const [phase, setPhase] = useState<Phase>(null);
  const [order, setOrder] = useState<TourStep[]>([]);
  const [totalSteps, setTotalSteps] = useState(0);
  const [idx, setIdx] = useState(0);
  const [desktop, setDesktop] = useState(false);
  const [anchor, setAnchor] = useState<{ top: number; left: number } | null>(null);

  const stepsRef = useRef(steps);
  stepsRef.current = steps;
  const hasIntro = intro != null;

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const sync = () => setDesktop(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  // Mulai: paksa bila forced/journey; otomatis sekali bila auto dan belum selesai.
  useEffect(() => {
    if (!forced && !journey && !auto) return;
    let done = false;
    if (!forced && !journey) {
      try {
        done = localStorage.getItem(`tour-${tourKey}-done`) === "1";
      } catch {
        done = true;
      }
    }
    if (!forced && !journey && done) return;
    let tries = 0;
    let best: TourStep[] = [];
    const timer = window.setInterval(() => {
      tries += 1;
      const valid = stepsRef.current.filter((s) => document.querySelector(s.target));
      if (valid.length > best.length) {
        best = valid;
        setOrder(valid);
      }
      const settled = tries >= 4 || (best.length > 0 && tries >= 2);
      if (settled) {
        window.clearInterval(timer);
        setTotalSteps(stepsRef.current.length);
        if (best.length > 0) {
          setIdx(0);
          setPhase(hasIntro || forced || journey ? "intro" : "step");
        } else if ((journey || forced) && hasIntro) {
          // Target kosong semua: tetap tampilkan intro sebagai "lanjut".
          setOrder([]);
          setIdx(0);
          setPhase("intro");
        }
      }
    }, 500);
    return () => window.clearInterval(timer);
  }, [tourKey, forced, journey, auto, hasIntro]);

  const step = order[Math.min(idx, order.length - 1)];

  const dismiss = useCallback(() => {
    try {
      localStorage.setItem(`tour-${tourKey}-done`, "1");
    } catch {
      /* abaikan */
    }
    setPhase(null);
    if (journey) router.replace(pathname);
  }, [tourKey, journey, router, pathname]);

  const complete = useCallback(() => {
    try {
      localStorage.setItem(`tour-${tourKey}-done`, "1");
    } catch {
      /* abaikan */
    }
    if (next) {
      router.push(next);
    } else {
      setPhase(null);
      if (journey) router.replace(pathname);
    }
  }, [tourKey, next, journey, router, pathname]);

  // Sorot target + posisikan popover tiap langkah.
  useEffect(() => {
    if (phase !== "step" || !step) return;
    const el = document.querySelector(step.target) as HTMLElement | null;
    if (!el) return;
    el.scrollIntoView({ block: "center", behavior: reduce ? "auto" : "smooth" });
    el.classList.add("tour-spotlight");
    const place = () => {
      const r = el.getBoundingClientRect();
      if (window.innerWidth < 1024) {
        setAnchor(null);
        return;
      }
      const w = 340;
      const left = Math.min(Math.max(16, r.left), window.innerWidth - w - 16);
      let top = r.bottom + 12;
      if (top + 300 > window.innerHeight) top = Math.max(16, r.top - 312);
      setAnchor({ top, left });
    };
    const t = window.setTimeout(place, 60);
    window.addEventListener("resize", place);
    window.addEventListener("orientationchange", place);
    const prev = document.activeElement as HTMLElement | null;
    const root = document.querySelector('[role="dialog"]');
    const btn = root?.querySelector("button:last-of-type") as HTMLElement | undefined;
    (btn ?? (root as HTMLElement | null))?.focus?.();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setPhase("confirm");
        return;
      }
      if (e.key === "Tab" && root) {
        const items = Array.from(root.querySelectorAll("button"));
        if (items.length === 0) return;
        const first = items[0];
        const last = items[items.length - 1];
        if (!first || !last) return;
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("resize", place);
      window.removeEventListener("orientationchange", place);
      document.removeEventListener("keydown", onKey);
      el.classList.remove("tour-spotlight");
      prev?.focus?.();
    };
  }, [phase, step, reduce, dismiss]);

  // Esc + fokus + kunci scroll untuk modal intro/konfirmasi.
  useEffect(() => {
    if (phase !== "intro" && phase !== "confirm") return;
    const prev = document.activeElement as HTMLElement | null;
    const root = document.querySelector('[role="dialog"]');
    (root?.querySelector("button:last-of-type") as HTMLElement | undefined)?.focus?.();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismiss();
      if (e.key === "Tab" && root) {
        const items = Array.from(root.querySelectorAll("button"));
        if (items.length === 0) return;
        const first = items[0];
        const last = items[items.length - 1];
        if (!first || !last) return;
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      prev?.focus?.();
    };
  }, [phase, dismiss]);

  if (!phase || (phase === "step" && !step)) return null;

  const total = order.length;
  const fade = reduce
    ? {}
    : {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration: 0.18 },
      };
  const cardMotion = reduce
    ? {}
    : {
        initial: { opacity: 0, y: 16, scale: 0.97 },
        animate: { opacity: 1, y: 0, scale: 1 },
        exit: { opacity: 0, y: 8, scale: 0.98 },
        transition: { duration: 0.22, ease: "easeOut" as const },
      };

  return (
    <>
      <style>{`.tour-spotlight{position:relative;z-index:60;outline:2px solid #2E7D4F;outline-offset:4px;border-radius:20px;}`}</style>
      <AnimatePresence>
        {(phase === "intro" || phase === "confirm") && (
          <motion.div
            key={`tour-modal-${tourKey}-${phase}`}
            className="fixed inset-0 z-[80] flex items-center justify-center bg-black/45 p-4"
            {...fade}
          >
            {phase === "intro" && intro ? (
              <motion.div
                role="dialog"
                aria-modal="true"
                aria-label={intro.title}
                className="max-h-[calc(100dvh-2rem)] w-full max-w-sm overflow-y-auto rounded-2xl border border-[#E8ECE9] bg-white p-6 text-left"
                {...cardMotion}
              >
                <span className="flex size-12 items-center justify-center rounded-2xl bg-[#DCEBE0] text-[#1E5A36]">
                  <MapIcon className="size-6" strokeWidth={1.75} aria-hidden />
                </span>
                <h2 className="mt-4 text-lg font-extrabold text-[#1C2826]">{intro.title}</h2>
                <p className="mt-1 text-sm leading-relaxed text-[#64746B]">{intro.body}</p>
                {journey && journeyLabel && (
                  <p className="mt-2 text-xs font-bold text-[#2E7D4F]">{journeyLabel}</p>
                )}
                {order.length === 0 && totalSteps > 0 && (
                  <p className="mt-2 text-xs font-semibold text-[#64746B]">
                    Belum ada konten untuk bagian ini — lanjut ke berikutnya.
                  </p>
                )}
                <div className="mt-5 flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setPhase("confirm")}
                    className="h-12 flex-1 text-[15px] font-bold"
                  >
                    <X className="size-5" strokeWidth={1.75} aria-hidden />
                    Lewati
                  </Button>
                  <Button
                    type="button"
                    onClick={() => {
                      if (order.length === 0) {
                        complete();
                      } else {
                        setIdx(0);
                        setPhase("step");
                      }
                    }}
                    className="h-12 flex-1 text-[15px] font-bold"
                  >
                    <Play className="size-5" strokeWidth={1.75} aria-hidden />
                    {order.length === 0 ? "Lanjut" : "Mulai panduan"}
                  </Button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                role="dialog"
                aria-modal="true"
                aria-label="Lewati panduan ini?"
                className="max-h-[calc(100dvh-2rem)] w-full max-w-sm overflow-y-auto rounded-2xl border border-[#E8ECE9] bg-white p-6 text-left"
                {...cardMotion}
              >
                <h2 className="text-lg font-extrabold text-[#1C2826]">Lewati panduan ini?</h2>
                <p className="mt-1 text-sm leading-relaxed text-[#64746B]">
                  Panduan berhenti di sini. Kamu tetap bisa mengulanginya kapan saja.
                </p>
                <div className="mt-5 flex gap-3">
                  <Button
                    type="button"
                    onClick={() => setPhase(total > 0 ? "step" : "intro")}
                    className="h-12 flex-1 text-[15px] font-bold"
                  >
                    <ArrowLeft className="size-5" strokeWidth={1.75} aria-hidden />
                    Kembali
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => dismiss()}
                    className="h-12 flex-1 text-[15px] font-bold"
                  >
                    <X className="size-5" strokeWidth={1.75} aria-hidden />
                    Lewati
                  </Button>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence mode="wait">
        {phase === "step" && step && (
          <div key={`tour-scrim-${tourKey}`} className="fixed inset-0 z-50">
            <motion.div
              className="absolute inset-0 bg-black/45"
              aria-hidden
              onClick={() => setPhase("confirm")}
              {...fade}
            />
            <AnimatePresence mode="wait">
              <motion.div
                key={step.target}
                role="dialog"
                aria-modal="true"
                aria-label={`Panduan ${idx + 1} dari ${total}: ${step.title}`}
                className="fixed inset-x-4 bottom-4 z-[70] max-h-[70dvh] overflow-y-auto rounded-2xl border border-[#E8ECE9] bg-white p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] lg:inset-auto lg:max-h-none lg:w-[340px] lg:pb-5"
                style={desktop && anchor ? { top: anchor.top, left: anchor.left } : undefined}
                {...(reduce
                  ? {}
                  : {
                      initial: { opacity: 0, y: 16 },
                      animate: {
                        opacity: 1,
                        y: 0,
                        ...(desktop && anchor ? { top: anchor.top, left: anchor.left } : {}),
                      },
                      exit: { opacity: 0, y: 8 },
                      transition: { duration: 0.22, ease: "easeOut" as const },
                    })}
              >
                <p className="text-xs font-semibold text-[#64746B]">
                  {idx + 1} dari {total}
                </p>
                {journey && journeyLabel && (
                  <p className="-mt-0.5 text-xs font-bold text-[#2E7D4F]">{journeyLabel}</p>
                )}
                {totalSteps > total && (
                  <p className="mt-0.5 text-xs text-[#64746B]">
                    {total} dari {totalSteps} bagian tersedia saat ini.
                  </p>
                )}
                <h2 className="mt-0.5 text-base font-extrabold text-[#1C2826]">{step.title}</h2>
                <p className="mt-1 text-sm leading-relaxed text-[#64746B]">{step.body}</p>
                <div className="mt-4 flex gap-2">
                  {idx > 0 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIdx((v) => Math.max(0, v - 1))}
                      className="flex-1 text-sm font-bold"
                    >
                      <ArrowLeft className="size-4" strokeWidth={1.75} aria-hidden />
                      Kembali
                    </Button>
                  )}
                  {idx + 1 >= total ? (
                    <Button
                      type="button"
                      onClick={() => complete()}
                      className="flex-1 text-sm font-bold"
                    >
                      {finishLabel ?? "Selesai"}
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      onClick={() => setIdx((v) => Math.min(total - 1, v + 1))}
                      className="flex-1 text-sm font-bold"
                    >
                      Lanjut
                      <ArrowRight className="size-4" strokeWidth={1.75} aria-hidden />
                    </Button>
                  )}
                </div>
                <Button
                  type="button"
                  variant="link"
                  onClick={() => setPhase("confirm")}
                  className="mt-2 min-h-[44px] w-full text-xs font-bold text-[#64746B]"
                >
                  Lewati panduan
                </Button>
              </motion.div>
            </AnimatePresence>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
