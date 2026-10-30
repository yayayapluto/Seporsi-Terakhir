"use client";

import { ArrowLeft, ArrowRight, Map as MapIcon, Play, X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { placeTooltip } from "@/lib/tour-placement";
import { isStale, resolveStart, stepIdFor, TOUR_VERSION } from "@/lib/tour-progress";
import { useTourProgress } from "@/lib/use-tour-progress";

export interface TourStep {
  target: string;
  title: string;
  body: string;
  id?: string;
}

export interface TourIntro {
  title: string;
  body: string;
}

type Phase = "intro" | "step" | "confirm" | "resume" | null;

// Kunci scroll bertingkat antar-langkah: restore hanya saat tuntas.
let stepLocks = 0;
let stepPrevOverflow = "";

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
 * Progres (langkah terakhir) tersimpan lokal + server; lanjutkan setelah jeda,
 * tawar ulang bila jeda > 7 hari, tidak pernah ulang dari awal tanpa alasan.
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
  userId = "anon",
  fresh = false,
  entryStep = null,
}: {
  tourKey: string;
  steps: TourStep[];
  intro?: TourIntro;
  forced?: boolean;
  /** Tampilkan otomatis sekali. Mati bila false — hanya forced/journey. */
  auto?: boolean;
  /** Bagian dari rantai onboarding: selesai lanjut ke `next`, keluar = strip query. */
  journey?: boolean;
  next?: string;
  /** Label progres rantai, mis. "Bagian 2 dari 4". Tampil bila journey. */
  journeyLabel?: string;
  /** Teks tombol akhir, mis. "Lihat porsi sore ini". Default "Selesai". */
  finishLabel?: string;
  /** Id pengguna untuk namespace progres + sinkron server. "anon" = lokal saja. */
  userId?: string;
  /** Reset progres lalu mulai dari awal (dipakai tautan "mulai ulang"). */
  fresh?: boolean;
  /** Indeks langkah untuk lompat langsung (dari ?langkah=). Sekali pakai. */
  entryStep?: number | null;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const reduce = useReducedMotion();
  const [phase, setPhase] = useState<Phase>(null);
  const [order, setOrder] = useState<TourStep[]>([]);
  const [totalSteps, setTotalSteps] = useState(0);
  const [idx, setIdx] = useState(0);
  const [anchor, setAnchor] = useState<{
    top: number;
    left: number;
    side: "above" | "below";
    arrowX: number;
  } | null>(null);
  const [hole, setHole] = useState<Hole | null>(null);
  const [resumeTitle, setResumeTitle] = useState("");

  const stepsRef = useRef(steps);
  stepsRef.current = steps;
  const titleRef = useRef<HTMLHeadingElement | null>(null);
  const hasIntro = intro != null;
  const orderDefIdx = useRef<number[]>([]);
  const maxPos = useRef(0);
  const resumeDefIdx = useRef<number | null>(null);
  const freshUsed = useRef(false);
  const entryStepRef = useRef<number | null>(entryStep ?? null);
  const settledRef = useRef(false);

  const progress = useTourProgress({ tourKey, tourId: tourKey, userId });

  // Mulai: tunggu progres siap (tanpa kedip langkah 1), lalu putuskan.
  useEffect(() => {
    if (settledRef.current) return;
    if (!progress.isReady) return;
    if (!forced && !journey && !auto) return;
    const defs = stepsRef.current;
    const allIds = defs.map((s, i) => stepIdFor(tourKey, s, i));
    setTotalSteps(defs.length);
    // fresh sekali pakai: reset + buang param dari URL agar selesai tidak mengulang.
    const doFresh = (fresh || (forced && !journey)) && !freshUsed.current;
    if (doFresh) {
      freshUsed.current = true;
      progress.reset();
      if (typeof window !== "undefined") {
        const sp = new URLSearchParams(window.location.search);
        if (sp.has("fresh")) {
          sp.delete("fresh");
          const q = sp.toString();
          router.replace(`${pathname}${q ? `?${q}` : ""}`);
        }
      }
    }
    // Tiba lewat rantai (?langkah=): menang atas status tersimpan agar rantai
    // tidak diblokir sesi kemarin.
    const entryForced = entryStepRef.current != null && (forced || journey);
    const decision = entryForced
      ? { action: "reset" as const }
      : resolveStart(progress.saved, allIds, TOUR_VERSION, doFresh);
    if (decision.action === "hide") return;
    if (decision.action === "reset") progress.reset();
    maxPos.current = 0;
    let tries = 0;
    let best: { s: TourStep; i: number }[] = [];
    const timer = window.setInterval(() => {
      tries += 1;
      const valid = defs
        .map((s, i) => ({ s, i }))
        .filter(({ s }) => {
          const t = document.querySelector(s.target);
          return t instanceof HTMLElement && t.offsetParent !== null;
        });
      if (valid.length > best.length) {
        best = valid;
        setOrder(valid.map((v) => v.s));
        orderDefIdx.current = valid.map((v) => v.i);
      }
      const settled = tries >= 4 || (best.length > 0 && tries >= 2);
      if (settled) {
        window.clearInterval(timer);
        settledRef.current = true;
        if (best.length === 0) {
          if ((journey || forced) && hasIntro) {
            setOrder([]);
            orderDefIdx.current = [];
            setIdx(0);
            setPhase("intro");
          }
          return;
        }
        if (doFresh) {
          setIdx(0);
          maxPos.current = 0;
          setPhase(hasIntro || forced || journey ? "intro" : "step");
          return;
        }
        // Tiba lewat rantai (?langkah=): langsung ke langkah itu, tanpa intro.
        if (entryStepRef.current != null) {
          const at = orderDefIdx.current.indexOf(entryStepRef.current);
          entryStepRef.current = null;
          const pos = at >= 0 ? at : orderDefIdx.current.findIndex((d) => d > 0);
          const mapped = pos >= 0 ? pos : best.length - 1;
          setIdx(mapped);
          maxPos.current = mapped;
          setPhase("step");
          return;
        }
        const saved = progress.saved;
        if (
          saved &&
          saved.status === "in_progress" &&
          saved.version === TOUR_VERSION &&
          saved.currentStepId
        ) {
          const defIdx = allIds.indexOf(saved.currentStepId);
          resumeDefIdx.current = defIdx;
          const pos = (() => {
            const at = orderDefIdx.current.indexOf(defIdx);
            if (at >= 0) return at;
            const after = orderDefIdx.current.findIndex((d) => d > defIdx);
            return after >= 0 ? after : best.length - 1;
          })();
          const farDef = saved.furthestStepId ? allIds.indexOf(saved.furthestStepId) : -1;
          const farPos = (() => {
            const at = orderDefIdx.current.indexOf(farDef);
            return at >= 0 ? at : pos;
          })();
          maxPos.current = Math.max(pos, farPos);
          setIdx(pos);
          if (isStale(saved.updatedAt)) {
            setResumeTitle(defs[defIdx]?.title ?? best[pos]?.s.title ?? "");
            setPhase("resume");
          } else {
            setPhase("step");
          }
          return;
        }
        setIdx(0);
        maxPos.current = 0;
        setPhase(hasIntro || forced || journey ? "intro" : "step");
      }
    }, 500);
    return () => window.clearInterval(timer);
  }, [
    tourKey,
    forced,
    journey,
    auto,
    hasIntro,
    fresh,
    progress.isReady,
    progress.saved,
    progress.reset,
  ]);

  const step = order[Math.min(idx, order.length - 1)];

  // Catat tiap perpindahan langkah (sinkron lokal + debounce server).
  useEffect(() => {
    if (phase !== "step" || order.length === 0) return;
    const pos = Math.min(idx, order.length - 1);
    maxPos.current = Math.max(maxPos.current, pos);
    const cur = order[pos];
    const far = order[maxPos.current] ?? cur;
    if (!cur || !far) return;
    progress.record({
      currentStepId: stepIdFor(tourKey, cur),
      furthestStepId: stepIdFor(tourKey, far),
    });
    if (journey && typeof window !== "undefined") {
      const sp = new URLSearchParams(window.location.search);
      sp.set("langkah", String(orderDefIdx.current[pos] ?? pos));
      window.history.replaceState(null, "", `${window.location.pathname}?${sp.toString()}`);
    }
  }, [phase, idx, order, tourKey, progress.record, journey]);

  const dismiss = useCallback(() => {
    progress.record({ status: "skipped" }, { immediate: true });
    setPhase(null);
    if (journey) router.replace(pathname);
  }, [journey, router, pathname, progress]);

  const complete = useCallback(() => {
    progress.record({ status: "completed" }, { immediate: true });
    try {
      if (next) {
        if (next.includes("panduan=rantai")) localStorage.setItem(RESUME_KEY, next);
        else localStorage.removeItem(RESUME_KEY);
      } else {
        localStorage.removeItem(RESUME_KEY);
      }
    } catch {
      /* abaikan */
    }
    if (next) {
      window.location.assign(next);
    } else {
      setPhase(null);
      if (journey) router.replace(pathname);
    }
  }, [tourKey, next, journey, router, pathname, progress]);

  // Tab lain menyelesaikan/melewati: tutup tur di sini.
  useEffect(() => {
    if (progress.saved && progress.saved.status !== "in_progress" && phase) {
      setPhase(null);
    }
  }, [progress.saved, phase]);

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
  // Scroll dikunci selama panduan (seperti modal), dibuka sesaat untuk scrollIntoView.
  useEffect(() => {
    if (phase !== "step" || !step) return;
    const el = document.querySelector(step.target) as HTMLElement | null;
    if (!el || el.offsetParent === null) return;
    let cancelled = false;
    if (stepLocks === 0) stepPrevOverflow = document.body.style.overflow;
    stepLocks += 1;
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
      document.body.style.overflow = "hidden";
      const card = document.querySelector(`[data-tour-card="${tourKey}"]`);
      const cardH = card instanceof HTMLElement && card.offsetHeight > 0 ? card.offsetHeight : 360;
      const cardW = Math.min(340, vw - 32);
      setAnchor(
        placeTooltip({
          target: { top, left, width: w, height: h },
          cardH,
          cardW,
          viewport: { w: vw, h: vh },
        }),
      );
    };
    const settle = async () => {
      if (stepLocks <= 1) document.body.style.overflow = stepPrevOverflow;
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
    window.addEventListener("orientationchange", compute);
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
      stepLocks = Math.max(0, stepLocks - 1);
      if (stepLocks === 0) document.body.style.overflow = stepPrevOverflow;
      window.removeEventListener("scroll", onScroll, { capture: true });
      window.removeEventListener("resize", compute);
      window.removeEventListener("orientationchange", compute);
      document.removeEventListener("keydown", onKey);
      setBgInert(false);
      prev?.focus?.();
    };
  }, [phase, step, reduce, order.length, tourKey, focusTitle, trapTab]);

  // Esc + fokus + kunci scroll + Tab-trap untuk modal intro/konfirmasi/resume.
  useEffect(() => {
    if (phase !== "intro" && phase !== "confirm" && phase !== "resume") return;
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
        {(phase === "intro" || phase === "confirm" || phase === "resume") && (
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
                        maxPos.current = 0;
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
            ) : phase === "resume" ? (
              <motion.div
                role="dialog"
                aria-modal="true"
                aria-label="Lanjutkan panduan?"
                className="max-h-[calc(100dvh-2rem)] w-full max-w-sm overflow-y-auto rounded-2xl border border-[#E8ECE9] bg-white p-6 text-left"
                {...cardMotion}
              >
                <h2
                  ref={titleRef}
                  tabIndex={-1}
                  className="text-lg font-extrabold text-[#1C2826] outline-none"
                >
                  Lanjutkan panduan?
                </h2>
                <p className="mt-1 text-sm leading-relaxed text-[#64746B]">
                  Terakhir berhenti di “{resumeTitle}”. Lanjut dari sana atau mulai dari awal?
                </p>
                <div className="mt-5 flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      progress.reset();
                      setIdx(0);
                      maxPos.current = 0;
                      setPhase(hasIntro ? "intro" : "step");
                    }}
                    className="h-12 flex-1 text-[15px] font-bold"
                  >
                    Mulai dari awal
                  </Button>
                  <Button
                    type="button"
                    onClick={() => {
                      const pos = Math.min(
                        Math.max(0, resumeDefIdx.current ?? 0),
                        Math.max(0, order.length - 1),
                      );
                      const mapped = (() => {
                        if (resumeDefIdx.current == null) return pos;
                        const at = orderDefIdx.current.indexOf(resumeDefIdx.current);
                        if (at >= 0) return at;
                        const after = orderDefIdx.current.findIndex(
                          (d) => d > (resumeDefIdx.current as number),
                        );
                        return after >= 0 ? after : Math.max(0, order.length - 1);
                      })();
                      setIdx(mapped);
                      maxPos.current = mapped;
                      setPhase("step");
                    }}
                    className="h-12 flex-1 text-[15px] font-bold"
                  >
                    <Play className="size-5" strokeWidth={1.75} aria-hidden />
                    Lanjutkan
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
            className="fixed z-[70] max-h-[70dvh] w-[min(340px,calc(100vw-32px))] overflow-y-auto rounded-2xl border border-[#E8ECE9] bg-white p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] lg:max-h-none lg:pb-5"
            style={
              anchor ? { top: anchor.top, left: anchor.left } : { left: 16, right: 16, bottom: 16 }
            }
            {...(reduce
              ? {}
              : {
                  initial: { opacity: 0, y: 16 },
                  animate: {
                    opacity: 1,
                    y: 0,
                    ...(anchor ? { top: anchor.top, left: anchor.left } : {}),
                  },
                  exit: { opacity: 0, y: 8 },
                  transition: { duration: 0.22, ease: "easeOut" as const },
                })}
          >
            {anchor && (
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

/** URL lanjutan rantai yang tersimpan (halaman terakhir dikunjungi). */
export function getJourneyResume(): string | null {
  try {
    const v = localStorage.getItem(RESUME_KEY);
    return v && v.includes("panduan=rantai") ? v : null;
  } catch {
    return null;
  }
}
