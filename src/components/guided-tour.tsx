"use client";

import { ArrowLeft, ArrowRight, Map as MapIcon, Play, X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { placeTooltip } from "@/lib/tour-placement";

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

const HOLE_PAD = 10;
const RESUME_KEY = "tour-journey-resume";

interface Hole {
  top: number;
  left: number;
  w: number;
  h: number;
  rx: number;
}

/** Kunci interaksi latar: semua anak body kecuali root tur. */
function setBgInert(on: boolean) {
  document.body.querySelectorAll(":scope > *:not(#tour-root)").forEach((n) => {
    if (on) n.setAttribute("inert", "");
    else n.removeAttribute("inert");
  });
}

/**
 * Spotlight tour: intro → langkah (cutout + tooltip berpanah) → konfirmasi lewati.
 * Sekali per tourKey (localStorage), kecuali forced/journey (?mode=onboarding / ?tour=journey).
 * Overlay + tooltip di-portal ke body; target tidak interaktif selama tur.
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
  const [anchor, setAnchor] = useState<{
    top: number;
    left: number;
    side: "above" | "below";
    arrowX: number;
  } | null>(null);
  const [hole, setHole] = useState<Hole | null>(null);

  const stepsRef = useRef(steps);
  stepsRef.current = steps;
  const hasIntro = intro != null;
  const titleRef = useRef<HTMLHeadingElement | null>(null);

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
    if (journey) {
      try {
        localStorage.setItem(RESUME_KEY, `${pathname}?tour=journey`);
      } catch {
        /* abaikan */
      }
    }
    let tries = 0;
    let best: TourStep[] = [];
    const timer = window.setInterval(() => {
      tries += 1;
      const valid = stepsRef.current.filter((s) => {
        const t = document.querySelector(s.target);
        return t instanceof HTMLElement && t.offsetParent !== null;
      });
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
          setOrder([]);
          setIdx(0);
          setPhase("intro");
        }
      }
    }, 500);
    return () => window.clearInterval(timer);
  }, [tourKey, forced, journey, auto, hasIntro, pathname]);

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
      if (next) {
        if (next.includes("tour=journey")) localStorage.setItem(RESUME_KEY, next);
        else localStorage.removeItem(RESUME_KEY);
      } else {
        localStorage.removeItem(RESUME_KEY);
      }
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

  const focusTitle = useCallback(() => {
    const root = document.querySelector('#tour-root [role="dialog"]');
    const h = (root?.querySelector("h2") as HTMLElement | undefined) ?? undefined;
    (h ?? (root as HTMLElement | null))?.focus?.();
  }, []);

  const trapTab = useCallback((e: KeyboardEvent, root: Element | null) => {
    if (e.key !== "Tab" || !root) return;
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
  }, []);

  // Sorot target + posisikan cutout dan tooltip tiap langkah.
  useEffect(() => {
    if (phase !== "step" || !step) return;
    const el = document.querySelector(step.target) as HTMLElement | null;
    if (!el || el.offsetParent === null) return;
    let cancelled = false;
    const compute = () => {
      if (cancelled) return;
      const r = el.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const pad = HOLE_PAD;
      const left = Math.min(Math.max(8, r.left - pad), vw - 8);
      const top = Math.min(Math.max(8, r.top - pad), vh - 8);
      const w = Math.min(r.width + pad * 2, vw - left - 8);
      const h = Math.min(r.height + pad * 2, vh - top - 8);
      const rawRx = getComputedStyle(el).borderRadius.split(" ")[0] ?? "";
      const parsed = Number.parseFloat(rawRx);
      const rx = Number.isFinite(parsed) ? Math.min(parsed + 4, 28) : 20;
      setHole({ top, left, w: Math.max(w, 8), h: Math.max(h, 8), rx });
      if (vw < 1024) {
        setAnchor(null);
        return;
      }
      const card = document.querySelector(`[data-tour-card="${tourKey}"]`);
      const cardH = card instanceof HTMLElement && card.offsetHeight > 0 ? card.offsetHeight : 360;
      setAnchor(
        placeTooltip({
          target: { top, left, width: w, height: h },
          cardH,
          cardW: 340,
          viewport: { w: vw, h: vh },
        }),
      );
    };
    const settle = async () => {
      el.scrollIntoView({ block: "center", behavior: reduce ? "auto" : "smooth" });
      try {
        await Promise.race([
          new Promise<void>((res) => {
            const hasScrollEnd = "onscrollend" in window;
            if (hasScrollEnd) {
              const to = window.setTimeout(res, 700);
              window.addEventListener(
                "scrollend",
                () => {
                  window.clearTimeout(to);
                  res();
                },
                { once: true },
              );
            } else {
              window.setTimeout(res, 400);
            }
          }),
          new Promise<void>((res) => window.setTimeout(res, 900)),
        ]);
        if ("fonts" in document) {
          await Promise.race([document.fonts.ready, new Promise((r) => window.setTimeout(r, 500))]);
        }
        await new Promise<void>((res) =>
          window.requestAnimationFrame(() => window.requestAnimationFrame(() => res())),
        );
      } catch {
        /* abaikan */
      }
      compute();
    };
    compute();
    void settle();
    const ro = new ResizeObserver(() => compute());
    ro.observe(el);
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        compute();
        ticking = false;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true, capture: true });
    window.addEventListener("resize", compute);
    const prev = document.activeElement as HTMLElement | null;
    focusTitle();
    const root = document.querySelector('#tour-root [role="dialog"]');
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setPhase("confirm");
        return;
      }
      if (e.key === "ArrowRight") {
        setIdx((v) => Math.min(order.length - 1, v + 1));
        return;
      }
      if (e.key === "ArrowLeft") {
        setIdx((v) => Math.max(0, v - 1));
        return;
      }
      trapTab(e, root);
    };
    document.addEventListener("keydown", onKey);
    setBgInert(true);
    return () => {
      cancelled = true;
      ro.disconnect();
      window.removeEventListener("scroll", onScroll, { capture: true });
      window.removeEventListener("resize", compute);
      document.removeEventListener("keydown", onKey);
      setBgInert(false);
      prev?.focus?.();
    };
  }, [phase, step, reduce, order.length, tourKey, focusTitle, trapTab]);

  // Esc + fokus + kunci scroll + Tab-trap untuk modal intro/konfirmasi.
  useEffect(() => {
    if (phase !== "intro" && phase !== "confirm") return;
    const prev = document.activeElement as HTMLElement | null;
    focusTitle();
    const root = document.querySelector('#tour-root [role="dialog"]');
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismiss();
      else trapTab(e, root);
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    setBgInert(true);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      setBgInert(false);
      prev?.focus?.();
    };
  }, [phase, dismiss, focusTitle, trapTab]);

  if (typeof document === "undefined" || !phase) return null;

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
  const holeAnim = reduce
    ? undefined
    : "x .25s ease-out, y .25s ease-out, width .25s ease-out, height .25s ease-out, rx .25s ease-out";

  return createPortal(
    <div id="tour-root">
      <div aria-live="polite" className="sr-only">
        {phase === "step" && step ? `Panduan ${idx + 1} dari ${total}: ${step.title}` : ""}
      </div>
      <AnimatePresence>
        {phase === "step" && (
          <motion.div
            key={`tour-scrim-${tourKey}`}
            className="fixed inset-0 z-50"
            onClick={() => setPhase("confirm")}
            {...fade}
          >
            {hole && (
              <svg className="absolute inset-0 size-full" aria-hidden>
                <defs>
                  <mask id={`tour-hole-${tourKey}`}>
                    <rect x="0" y="0" width="100%" height="100%" fill="white" />
                    <rect
                      x={hole.left}
                      y={hole.top}
                      width={hole.w}
                      height={hole.h}
                      rx={hole.rx}
                      fill="black"
                      style={holeAnim ? { transition: holeAnim } : undefined}
                    />
                  </mask>
                </defs>
                <rect
                  x="0"
                  y="0"
                  width="100%"
                  height="100%"
                  fill="black"
                  opacity="0.45"
                  mask={`url(#tour-hole-${tourKey})`}
                />
              </svg>
            )}
            {!hole && <div className="absolute inset-0 bg-black/45" />}
          </motion.div>
        )}
      </AnimatePresence>
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
                <h2
                  ref={titleRef}
                  tabIndex={-1}
                  className="mt-4 text-lg font-extrabold text-[#1C2826] outline-none"
                >
                  {intro.title}
                </h2>
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
                <h2
                  ref={titleRef}
                  tabIndex={-1}
                  className="text-lg font-extrabold text-[#1C2826] outline-none"
                >
                  Lewati panduan ini?
                </h2>
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
          <motion.div
            key={step.target}
            data-tour-card={tourKey}
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
            {desktop && anchor && (
              <span
                aria-hidden
                className={`absolute size-3.5 rotate-45 border-[#E8ECE9] bg-white ${
                  anchor.side === "below"
                    ? "-top-[7px] border-t border-l"
                    : "-bottom-[7px] border-r border-b"
                }`}
                style={{ left: anchor.arrowX - 7 }}
              />
            )}
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
            <h2
              ref={titleRef}
              tabIndex={-1}
              className="mt-0.5 text-base font-extrabold text-[#1C2826] outline-none"
            >
              {step.title}
            </h2>
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
        )}
      </AnimatePresence>
    </div>,
    document.body,
  );
}

/** URL lanjutan journey yang tersimpan (halaman terakhir dikunjungi). */
export function getJourneyResume(): string | null {
  try {
    const v = localStorage.getItem(RESUME_KEY);
    return v && v.includes("tour=journey") ? v : null;
  } catch {
    return null;
  }
}
