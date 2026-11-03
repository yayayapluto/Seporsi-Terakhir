import { describe, expect, it } from "vitest";
import {
  canTransition,
  isStale,
  progressKey,
  reconcile,
  resolveStart,
  STALE_DAYS,
  stepIdFor,
  type TourProgress,
  tourProgressPayload,
} from "@/lib/tour-progress";

const base: TourProgress = {
  tourId: "beranda",
  version: 1,
  status: "in_progress",
  currentStepId: "b",
  furthestStepId: "b",
  updatedAt: 1000,
};

describe("progressKey", () => {
  it("namespaces per user dan tour", () => {
    expect(progressKey("u1", "beranda")).toBe("tour:u1:beranda");
    expect(progressKey("anon", "katalog")).toBe("tour:anon:katalog");
  });
});

describe("stepIdFor", () => {
  it("memakai id eksplisit bila ada, target bila tidak", () => {
    expect(stepIdFor("t", { target: "#a" }, 0)).toBe("t:#a");
    expect(stepIdFor("t", { target: "#a", id: "intro" }, 2)).toBe("intro");
  });
});

describe("isStale", () => {
  it("basi setelah STALE_DAYS", () => {
    const now = Date.now();
    expect(isStale(now - STALE_DAYS * 86400_000 - 1, now)).toBe(true);
    expect(isStale(now - 1000, now)).toBe(false);
  });
});

describe("reconcile", () => {
  it("final selalu menang atas in_progress", () => {
    const done: TourProgress = { ...base, status: "completed", updatedAt: 500 };
    expect(reconcile(base, done)).toBe(done);
    expect(reconcile(done, base)).toBe(done);
  });

  it("yang updatedAt lebih baru menang", () => {
    const newer: TourProgress = { ...base, currentStepId: "c", updatedAt: 2000 };
    expect(reconcile(base, newer)).toBe(newer);
    expect(reconcile(newer, base)).toBe(newer);
  });

  it("null ditangani", () => {
    expect(reconcile(null, base)).toBe(base);
    expect(reconcile(base, null)).toBe(base);
    expect(reconcile(null, null)).toBeNull();
  });
});

describe("tourProgressPayload", () => {
  const valid = {
    tourId: "beranda",
    status: "in_progress",
    currentStepId: "beranda:#tour-hero",
    furthestStepId: "beranda:#tour-hero",
    version: 1,
  };
  it("menerima payload valid", () => {
    expect(tourProgressPayload.safeParse(valid).success).toBe(true);
    expect(
      tourProgressPayload.safeParse({ ...valid, status: "completed", currentStepId: null }).success,
    ).toBe(true);
  });

  it("menolak tourId di luar daftar, stepId aneh, status liar", () => {
    expect(tourProgressPayload.safeParse({ ...valid, tourId: "x'; DROP TABLE--" }).success).toBe(
      false,
    );
    expect(tourProgressPayload.safeParse({ ...valid, tourId: "lain" }).success).toBe(false);
    expect(tourProgressPayload.safeParse({ ...valid, currentStepId: "<script>" }).success).toBe(
      false,
    );
    expect(tourProgressPayload.safeParse({ ...valid, status: "done" }).success).toBe(false);
    expect(
      tourProgressPayload.safeParse({ ...valid, currentStepId: "x".repeat(201) }).success,
    ).toBe(false);
  });
});

describe("canTransition", () => {
  it("final tidak boleh mundur kecuali restart eksplisit", () => {
    expect(canTransition("completed", "in_progress", false)).toBe(false);
    expect(canTransition("skipped", "in_progress", false)).toBe(false);
    expect(canTransition("completed", "in_progress", true)).toBe(true);
    expect(canTransition("in_progress", "completed", false)).toBe(true);
    expect(canTransition("in_progress", "in_progress", false)).toBe(true);
  });
});

describe("resolveStart", () => {
  it("completed tidak dimulai ulang", () => {
    expect(resolveStart({ ...base, status: "completed" }, ["a", "b"], 1, false)).toEqual({
      action: "hide",
    });
  });

  it("in_progress lanjut ke current bila valid", () => {
    expect(resolveStart(base, ["a", "b", "c"], 1, false)).toEqual({
      action: "resume",
      index: 1,
    });
  });

  it("current tak valid → furthest → pertama", () => {
    const p: TourProgress = { ...base, currentStepId: "x", furthestStepId: "c" };
    expect(resolveStart(p, ["a", "b", "c"], 1, false)).toEqual({ action: "resume", index: 2 });
    const q: TourProgress = { ...base, currentStepId: "x", furthestStepId: "y" };
    expect(resolveStart(q, ["a", "b", "c"], 1, false)).toEqual({ action: "resume", index: 0 });
  });

  it("versi beda: final tetap sembunyi, in_progress reset", () => {
    expect(resolveStart({ ...base, status: "skipped" }, ["a"], 2, false)).toEqual({
      action: "hide",
    });
    expect(resolveStart(base, ["a", "b"], 2, false)).toEqual({ action: "reset" });
  });

  it("fresh memaksa mulai dari awal", () => {
    expect(resolveStart(base, ["a", "b"], 1, true)).toEqual({ action: "reset" });
  });
});
