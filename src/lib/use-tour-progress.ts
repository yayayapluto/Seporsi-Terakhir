"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  isStale,
  progressKey,
  reconcile,
  TOUR_VERSION,
  type TourProgress,
  type TourStatus,
} from "@/lib/tour-progress";
import { getTourProgress, saveTourProgress } from "@/lib/tour-progress-actions";

function readLocal(key: string): TourProgress | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const p = JSON.parse(raw) as TourProgress;
    if (!p || typeof p.tourId !== "string") return null;
    return p;
  } catch {
    return null;
  }
}

function writeLocal(key: string, p: TourProgress | null) {
  try {
    if (p) localStorage.setItem(key, JSON.stringify(p));
    else localStorage.removeItem(key);
  } catch {
    /* abaikan */
  }
}

/**
 * Persistensi progres tur berlapis: localStorage sinkron + server debounce.
 * Server hanya dipakai bila userId bukan "anon".
 */
export function useTourProgress({
  tourId,
  userId,
  version = TOUR_VERSION,
}: {
  tourId: string;
  userId: string;
  version?: number;
}) {
  const key = progressKey(userId, tourId);
  const [saved, setSaved] = useState<TourProgress | null>(null);
  const [isReady, setIsReady] = useState(false);
  const savedRef = useRef<TourProgress | null>(null);
  const pendingRef = useRef<TourProgress | null>(null);
  const timerRef = useRef<number | null>(null);

  savedRef.current = saved;

  const pushServer = useCallback(
    (p: TourProgress, opts?: { restart?: boolean; beacon?: boolean }) => {
      if (userId === "anon") return;
      if (opts?.beacon && typeof navigator !== "undefined" && "sendBeacon" in navigator) {
        try {
          const blob = new Blob(
            [JSON.stringify({ ...p, ...(opts.restart ? { restart: true } : {}) })],
            { type: "application/json" },
          );
          if (navigator.sendBeacon("/api/tour-progress", blob)) return;
        } catch {
          /* jatuh ke action */
        }
      }
      void saveTourProgress(p, { restart: opts?.restart }).catch(() => {});
    },
    [userId],
  );

  const flush = useCallback(() => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    const p = pendingRef.current;
    pendingRef.current = null;
    if (p) pushServer(p);
  }, [pushServer]);

  const record = useCallback(
    (
      patch: { status?: TourStatus; currentStepId?: string | null; furthestStepId?: string | null },
      opts?: { immediate?: boolean },
    ) => {
      const now = Date.now();
      const prev = savedRef.current;
      const next: TourProgress = {
        tourId,
        version,
        status: patch.status ?? prev?.status ?? "in_progress",
        currentStepId:
          patch.currentStepId !== undefined ? patch.currentStepId : (prev?.currentStepId ?? null),
        furthestStepId:
          patch.furthestStepId !== undefined
            ? patch.furthestStepId
            : (prev?.furthestStepId ?? null),
        updatedAt: now,
        ...(patch.status && patch.status !== "in_progress" ? { completedAt: now } : {}),
      };
      if (patch.status && patch.status !== "in_progress") {
        next.currentStepId = null;
      }
      setSaved(next);
      writeLocal(key, next);
      pendingRef.current = next;
      if (opts?.immediate) {
        flush();
      } else if (timerRef.current == null) {
        timerRef.current = window.setTimeout(() => {
          timerRef.current = null;
          const p = pendingRef.current;
          pendingRef.current = null;
          if (p) pushServer(p);
        }, 300);
      }
    },
    [flush, key, pushServer, tourId, version],
  );

  const reset = useCallback(() => {
    pendingRef.current = null;
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    writeLocal(key, null);
    setSaved(null);
    pushServer(
      {
        tourId,
        version,
        status: "in_progress",
        currentStepId: null,
        furthestStepId: null,
        updatedAt: Date.now(),
      },
      { restart: true },
    );
  }, [key, pushServer, tourId, version]);

  // Muat lokal sinkron setelah mount, lalu rekonsiliasi dengan server.
  useEffect(() => {
    let cancelled = false;
    const local = readLocal(key);
    if (userId !== "anon") {
      const anon = readLocal(progressKey("anon", tourId));
      if (anon && anon.status === "in_progress") {
        writeLocal(key, null);
      }
    }
    const finish = (remote: TourProgress | null) => {
      if (cancelled) return;
      let merged = reconcile(local, remote);
      if (userId !== "anon" && !remote) {
        const anon = readLocal(progressKey("anon", tourId));
        if (anon && anon.status === "in_progress") {
          merged = anon;
          pendingRef.current = { ...anon, tourId };
          pushServer({ ...anon, tourId });
        }
      }
      setSaved(merged);
      if (merged) writeLocal(key, merged);
      setIsReady(true);
    };
    if (userId === "anon") {
      finish(null);
      return () => {
        cancelled = true;
      };
    }
    let done = false;
    const timer = window.setTimeout(() => {
      if (!done) {
        done = true;
        finish(null);
      }
    }, 2000);
    void getTourProgress(tourId)
      .then((remote) => {
        if (!done) {
          done = true;
          window.clearTimeout(timer);
          finish(remote);
        }
      })
      .catch(() => {
        if (!done) {
          done = true;
          window.clearTimeout(timer);
          finish(null);
        }
      });
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [key, pushServer, tourId, userId]);

  // Antar-tab: adopsi bila lebih baru; final selalu menang, tidak mundur.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== key) return;
      const incoming = readLocal(key);
      setSaved((prev) => {
        const merged = reconcile(prev, incoming);
        if (merged && merged !== prev) {
          pendingRef.current = null;
          return merged;
        }
        return prev;
      });
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [key]);

  // Keluar mendadak: flush sinkron + beacon.
  useEffect(() => {
    const onHide = () => {
      const p = pendingRef.current;
      pendingRef.current = null;
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      if (p) pushServer(p, { beacon: true });
    };
    const onVis = () => {
      if (document.visibilityState === "hidden") onHide();
    };
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("pagehide", onHide);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("pagehide", onHide);
    };
  }, [pushServer]);

  return {
    saved,
    isReady,
    stale: saved != null && saved.status === "in_progress" && isStale(saved.updatedAt),
    record,
    flush,
    reset,
  };
}
