import { describe, expect, it } from "vitest";
import { placeTooltip } from "@/lib/tour-placement";

const VP = { w: 1280, h: 800 };

function intersects(
  a: { top: number; left: number; width: number; height: number },
  b: { top: number; left: number; width: number; height: number },
) {
  return (
    a.left < b.left + b.width &&
    b.left < a.left + a.width &&
    a.top < b.top + b.height &&
    b.top < a.top + a.height
  );
}

describe("placeTooltip", () => {
  it("meletakkan di bawah target bila muat, dengan gap 12px dan tanpa irisan", () => {
    const target = { top: 200, left: 400, width: 300, height: 120 };
    const r = placeTooltip({ target, cardH: 340, cardW: 340, viewport: VP });
    expect(r.side).toBe("below");
    expect(r.top).toBe(200 + 120 + 12);
    expect(r.top + 340).toBeLessThanOrEqual(800);
    expect(r.left).toBeGreaterThanOrEqual(16);
    expect(r.left + 340).toBeLessThanOrEqual(1280 - 16);
    expect(intersects({ ...r, width: 340, height: 340 }, target)).toBe(false);
  });

  it("flip ke atas bila bawah tidak muat", () => {
    const target = { top: 600, left: 400, width: 300, height: 120 };
    const r = placeTooltip({ target, cardH: 340, cardW: 340, viewport: VP });
    expect(r.side).toBe("above");
    expect(r.top).toBe(600 - 340 - 12);
    expect(intersects({ ...r, width: 340, height: 340 }, target)).toBe(false);
  });

  it("tetap di dalam viewport bila target di pojok", () => {
    const target = { top: 8, left: 8, width: 200, height: 60 };
    const r = placeTooltip({ target, cardH: 340, cardW: 340, viewport: VP });
    expect(r.top).toBeGreaterThanOrEqual(0);
    expect(r.left).toBeGreaterThanOrEqual(0);
    expect(r.top + 340).toBeLessThanOrEqual(800);
    expect(r.left + 340).toBeLessThanOrEqual(1280);
  });

  it("panah menunjuk tengah target, dijepit di dalam kartu", () => {
    const target = { top: 200, left: 100, width: 300, height: 120 };
    const r = placeTooltip({ target, cardH: 340, cardW: 340, viewport: VP });
    expect(r.arrowX).toBeGreaterThanOrEqual(16);
    expect(r.arrowX).toBeLessThanOrEqual(340 - 16);
    expect(r.arrowX).toBe(100 + 150 - r.left);
  });

  it("viewport kecil: target di bawah -> kartu di atas target, tanpa irisan", () => {
    const vp = { w: 430, h: 932 };
    const cardW = Math.min(340, vp.w - 32);
    const target = { top: 700, left: 16, width: 398, height: 120 };
    const r = placeTooltip({ target, cardH: 300, cardW, viewport: vp });
    expect(r.side).toBe("above");
    expect(r.top + 300).toBeLessThanOrEqual(target.top - 12 + 1);
    expect(intersects({ ...r, width: cardW, height: 300 }, target)).toBe(false);
  });

  it("viewport kecil: target di atas -> kartu di bawah target, tanpa irisan", () => {
    const vp = { w: 430, h: 932 };
    const cardW = Math.min(340, vp.w - 32);
    const target = { top: 120, left: 16, width: 398, height: 100 };
    const r = placeTooltip({ target, cardH: 300, cardW, viewport: vp });
    expect(r.side).toBe("below");
    expect(r.top).toBeGreaterThanOrEqual(target.top + target.height + 12 - 1);
    expect(intersects({ ...r, width: cardW, height: 300 }, target)).toBe(false);
  });
});
