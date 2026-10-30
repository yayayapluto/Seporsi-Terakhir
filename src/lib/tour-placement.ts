/** Matematika posisi popover tur: flip/shift murni, tanpa DOM. */

export interface Box {
  top: number;
  left: number;
  width: number;
  height: number;
}

export interface Viewport {
  w: number;
  h: number;
}

const GAP = 12;
const EDGE = 16;

export function placeTooltip({
  target,
  cardH,
  cardW,
  viewport,
  gap = GAP,
}: {
  target: Box;
  cardH: number;
  cardW: number;
  viewport: Viewport;
  gap?: number;
}): { top: number; left: number; side: "above" | "below"; arrowX: number } {
  const left = Math.min(Math.max(EDGE, target.left), viewport.w - cardW - EDGE);
  const belowTop = target.top + target.height + gap;
  const aboveTop = target.top - cardH - gap;
  const belowFits = belowTop + cardH + EDGE <= viewport.h;
  const aboveFits = aboveTop >= EDGE;
  let top: number;
  let side: "above" | "below";
  if (belowFits || !aboveFits) {
    side = "below";
    top = Math.min(belowTop, viewport.h - cardH - EDGE);
  } else {
    side = "above";
    top = Math.max(aboveTop, EDGE);
  }
  top = Math.max(0, top);
  const centerX = target.left + target.width / 2;
  const arrowX = Math.min(Math.max(16, centerX - left), cardW - 16);
  return { top, left, side, arrowX };
}
