import { describe, expect, it } from "vitest";
import {
  computePickupDeadline,
  PICKUP_DEADLINE_MINUTES,
  pickupRemainingLabel,
  pickupRemainingMs,
} from "@/lib/domain/pickup-deadline";

const BOOKED = new Date("2026-11-05T10:00:00+07:00");

describe("computePickupDeadline", () => {
  it("adds 15 minutes to booking time", () => {
    expect(PICKUP_DEADLINE_MINUTES).toBe(15);
    expect(computePickupDeadline(BOOKED)?.toISOString()).toBe("2026-11-05T03:15:00.000Z");
  });

  it("rejects invalid dates", () => {
    expect(computePickupDeadline(new Date(Number.NaN))).toBeNull();
  });
});

describe("pickupRemainingMs", () => {
  it("counts down to the deadline", () => {
    const now = new Date("2026-11-05T10:05:00+07:00");
    expect(pickupRemainingMs(computePickupDeadline(BOOKED) as Date, now)).toBe(10 * 60_000);
  });

  it("clamps to zero once past the deadline", () => {
    const now = new Date("2026-11-05T10:20:00+07:00");
    expect(pickupRemainingMs(computePickupDeadline(BOOKED) as Date, now)).toBe(0);
  });
});

describe("pickupRemainingLabel", () => {
  it("formats mm:ss under an hour", () => {
    expect(pickupRemainingLabel(15 * 60_000)).toBe("15:00");
    expect(pickupRemainingLabel(61_000)).toBe("01:01");
    expect(pickupRemainingLabel(0)).toBe("00:00");
  });

  it("never goes negative", () => {
    expect(pickupRemainingLabel(-5000)).toBe("00:00");
  });
});
