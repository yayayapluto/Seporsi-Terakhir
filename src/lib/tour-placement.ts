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
  inset = { top: 0, bottom: 0 },
}: {
  target: Box;
  cardH: number;
  cardW: number;
  viewport: Viewport;
  gap?: number;
  inset?: { top: number; bottom: number };
}): { top: number; left: number; side: "above" | "below"; arrowX: number } {
  // Batas aman: chrome fixed (header/nav) masuk sebagai inset supaya tooltip
  // tak pernah berakhir di kolong header atau nav bawah.
  const topEdge = Math.max(EDGE, inset.top);
  const bottomEdge = Math.max(EDGE, inset.bottom);
  const left = Math.min(Math.max(EDGE, target.left), viewport.w - cardW - EDGE);
  const tBottom = target.top + target.height;
  const belowTop = tBottom + gap;
  const aboveTop = target.top - cardH - gap;
  const belowFits = belowTop + cardH + bottomEdge <= viewport.h;
  const aboveFits = aboveTop >= topEdge;
  // Irisan vertikal bila dipasang tanpa jepit viewport — pilih sisi yang bersih.
  const overlap = (top: number) =>
    Math.max(0, Math.min(top + cardH, tBottom) - Math.max(top, target.top));
  const overlapBelow = overlap(belowTop);
  const overlapAbove = overlap(aboveTop);
  let top: number;
  let side: "above" | "below";
  if (overlapBelow === 0 && belowFits) {
    side = "below";
    top = belowTop;
  } else if (overlapAbove === 0 && aboveFits) {
    side = "above";
    top = aboveTop;
  } else if (overlapBelow <= overlapAbove) {
    side = "below";
    top = Math.min(belowTop, viewport.h - bottomEdge - cardH);
  } else {
    side = "above";
    top = Math.max(aboveTop, topEdge);
  }
  top = Math.max(topEdge, top);
  const centerX = target.left + target.width / 2;
  const arrowX = Math.min(Math.max(16, centerX - left), cardW - 16);
  return { top, left, side, arrowX };
}
