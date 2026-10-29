"use client";

import { useReducedMotion } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export interface TourStep {
  target: string;
  title: string;
  body: string;
}

/** Spotlight tour: overlay gelap + kotak panduan dekat target. Sekali per role via localStorage. */
export function GuidedTour({ tourKey, steps }: { tourKey: string; steps: TourStep[] }) {
  const reduce = useReducedMotion();
  const [index, setIndex] = useState<number | null>(null);
  const [box, setBox] = useState<{ top: number; left: number; width: number } | null>(null);

  useEffect(() => {
    try {
      if (localStorage.getItem(`tour-${tourKey}-done`)) return;
    } catch {
      return;
    }
    if (steps.length === 0) return;
    setIndex(0);
  }, [tourKey, steps.length]);

  const step = index == null ? null : (steps[index] ?? null);

  useEffect(() => {
    if (!step) {
      setBox(null);
      return;
    }
    function place() {
      const el = document.querySelector(step?.target ?? "");
      if (!el) {
        setBox(null);
        return;
      }
      const r = el.getBoundingClientRect();
      setBox({
        top: r.bottom + 8,
        left: Math.max(8, Math.min(r.left, window.innerWidth - 320)),
        width: Math.min(300, window.innerWidth - 16),
      });
    }
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, { passive: true });
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place);
    };
  }, [step]);

  // Sekali saja: tutup via cara apa pun (selesai/lewati/x/Escape) = sudah pernah.
  const dismiss = useCallback(() => {
    try {
      localStorage.setItem(`tour-${tourKey}-done`, "1");
    } catch {
      /* abaikan */
    }
    setIndex(null);
  }, [tourKey]);

  useEffect(() => {
    if (index == null) return;
    const prev = document.activeElement as HTMLElement | null;
    const root = document.querySelector('[role="dialog"]');
    const btn = root?.querySelector("button:last-of-type") as HTMLElement | undefined;
    (btn ?? (root as HTMLElement | null))?.focus?.();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") dismiss();
      if (e.key === "Tab") {
        const items = root ? Array.from(root.querySelectorAll("button")) : [];
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
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      prev?.focus?.();
    };
  }, [index, dismiss]);

  if (!step || index == null) return null;
  const last = index === steps.length - 1;
  return (
    <div
      className="fixed inset-0 z-50 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:duration-200 motion-reduce:animate-none"
      role="dialog"
      aria-modal="true"
      aria-label={step.title}
      data-state="open"
      key={index}
    >
      <button
        type="button"
        aria-label="Lewati tur"
        onClick={() => dismiss()}
        className="absolute inset-0 cursor-default bg-black/60"
      />
      <div
        className={`fixed rounded-xl border bg-card p-4 shadow-lg data-[state=open]:animate-in data-[state=open]:zoom-in-95 data-[state=open]:fade-in-0 data-[state=open]:duration-200 motion-reduce:animate-none ${reduce ? "" : "transition-[top,left] duration-200"}`}
        data-state="open"
        style={
          box
            ? {
                top: Math.min(box.top, Math.max(8, window.innerHeight - 260)),
                left: box.left,
                width: box.width,
              }
            : { top: "50%", left: "50%", width: 300, transform: "translate(-50%, -50%)" }
        }
      >
        <p className="text-xs font-semibold text-muted-foreground">
          {index + 1}/{steps.length}
        </p>
        <h2 className="mt-1 font-bold">{step.title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{step.body}</p>
        <div className="mt-3 flex gap-2">
          {last ? (
            <Button type="button" onClick={() => dismiss()} className="min-h-11 flex-1">
              Selesai
            </Button>
          ) : (
            <Button type="button" onClick={() => setIndex(index + 1)} className="min-h-11 flex-1">
              Lanjut
            </Button>
          )}
          <Button type="button" variant="outline" onClick={() => dismiss()} className="min-h-11">
            Lewati
          </Button>
        </div>
      </div>
    </div>
  );
}
