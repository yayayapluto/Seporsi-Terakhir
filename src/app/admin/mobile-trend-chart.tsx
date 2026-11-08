"use client";

import { useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

type RangeKey = "24jam" | "3hari" | "7hari" | "sebulan";

const RANGES: { key: RangeKey; label: string; days: number }[] = [
  { key: "24jam", label: "24 jam", days: 1 },
  { key: "3hari", label: "3 hari", days: 3 },
  { key: "7hari", label: "7 hari", days: 7 },
  { key: "sebulan", label: "Sebulan", days: 30 },
];

function shortDate(iso: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    timeZone: "Asia/Jakarta",
  }).format(new Date(`${iso}T00:00:00+07:00`));
}

function weekdayShort(iso: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "short",
    timeZone: "Asia/Jakarta",
  }).format(new Date(`${iso}T00:00:00+07:00`));
}

function fullDate(iso: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(new Date(`${iso}T00:00:00+07:00`));
}

/** Line chart mobile: SVG murni (tanpa lib chart baru), pemilih rentang 24 jam–Sebulan. */
export function MobileTrendChart({ series }: { series: { day: string; saved: number }[] }) {
  const [range, setRange] = useState<RangeKey>("7hari");
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const points = useMemo(() => {
    const days = RANGES.find((r) => r.key === range)?.days ?? 7;
    return series.slice(-days);
  }, [series, range]);

  const max = Math.max(1, ...points.map((p) => p.saved));
  const W = 358;
  const H = 180;
  const coords = points.map((p, i) => ({
    x: points.length <= 1 ? W / 2 : (i / (points.length - 1)) * W,
    y: H - 8 - (p.saved / max) * (H - 24),
  }));
  const linePath = coords
    .map((c, i) => `${i === 0 ? "M" : "L"}${c.x.toFixed(1)},${c.y.toFixed(1)}`)
    .join(" ");
  const areaPath =
    points.length > 0
      ? `${linePath} L${coords[coords.length - 1]?.x.toFixed(1)},${H} L${coords[0]?.x.toFixed(1)},${H} Z`
      : "";

  const labelIdxs = useMemo(() => {
    const n = points.length;
    if (n === 0) return [];
    if (range === "sebulan") {
      const idx = [0, 7, 14, 21, n - 1].filter((v, i, a) => v < n && a.indexOf(v) === i);
      return idx;
    }
    if (n <= 7) return points.map((_, i) => i);
    return [0, Math.floor(n / 2), n - 1];
  }, [points, range]);

  function pick(clientX: number) {
    const svg = svgRef.current;
    if (!svg || points.length === 0) return;
    const rect = svg.getBoundingClientRect();
    const ratio = (clientX - rect.left) / rect.width;
    const idx =
      points.length <= 1 ? 0 : Math.round(Math.min(1, Math.max(0, ratio)) * (points.length - 1));
    setActiveIdx(idx);
  }

  const active = activeIdx != null ? points[activeIdx] : undefined;

  return (
    <div className="min-w-0">
      <fieldset
        aria-label="Rentang tren"
        className="grid grid-cols-[repeat(4,minmax(0,1fr))] gap-1"
      >
        <legend className="sr-only">Rentang tren</legend>
        {RANGES.map((r) => (
          <Button
            key={r.key}
            type="button"
            size="sm"
            variant={r.key === range ? "default" : "outline"}
            aria-pressed={r.key === range}
            onClick={() => {
              setRange(r.key);
              setActiveIdx(null);
            }}
            className="min-h-11 px-1 text-sm whitespace-nowrap"
          >
            {r.label}
          </Button>
        ))}
      </fieldset>

      <p aria-live="polite" className="mt-3 min-h-5 text-xs text-[#1E5A36]">
        {active
          ? `${fullDate(active.day)}: ${active.saved} porsi`
          : "Ketuk garis untuk melihat nilai."}
      </p>

      <div
        className="relative h-56 w-full min-w-0"
        role="slider"
        aria-label="Tren pickup harian (garis)"
        aria-valuemin={0}
        aria-valuemax={points.length - 1}
        aria-valuenow={activeIdx ?? 0}
        tabIndex={0}
        onClick={(e) => pick(e.clientX)}
        onTouchMove={(e) => pick(e.touches[0]?.clientX ?? 0)}
        onKeyDown={(e) => {
          if (points.length === 0) return;
          if (e.key === "ArrowRight") {
            e.preventDefault();
            setActiveIdx((v) => Math.min(points.length - 1, (v ?? -1) + 1));
          }
          if (e.key === "ArrowLeft") {
            e.preventDefault();
            setActiveIdx((v) => Math.max(0, (v ?? 1) - 1));
          }
        }}
      >
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="none"
          className="h-full w-full touch-pan-y"
          role="img"
          aria-hidden="true"
        >
          <line
            x1="0"
            y1={H / 3}
            x2={W}
            y2={H / 3}
            stroke="#E8ECE9"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
          />
          <line
            x1="0"
            y1={(H * 2) / 3}
            x2={W}
            y2={(H * 2) / 3}
            stroke="#E8ECE9"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
          />
          {areaPath && <path d={areaPath} fill="#2E7D4F" opacity={0.12} />}
          {linePath && (
            <path
              d={linePath}
              fill="none"
              stroke="#2E7D4F"
              strokeWidth="2.5"
              vectorEffect="non-scaling-stroke"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          )}
          {activeIdx != null && coords[activeIdx] && (
            <g>
              <line
                x1={coords[activeIdx].x}
                y1="0"
                x2={coords[activeIdx].x}
                y2={H}
                stroke="#64746B"
                strokeWidth="1"
                strokeDasharray="3 3"
                vectorEffect="non-scaling-stroke"
              />
              <circle
                cx={coords[activeIdx].x}
                cy={coords[activeIdx].y}
                r="5"
                fill="#2E7D4F"
                stroke="#FFFFFF"
                strokeWidth="2"
              />
            </g>
          )}
        </svg>
      </div>

      <div className="flex items-start justify-between gap-2 pt-1 text-xs text-muted-foreground">
        {labelIdxs.map((idx) => {
          const p = points[idx];
          if (!p) return null;
          const isFirst = idx === labelIdxs[0];
          const isLast = idx === labelIdxs[labelIdxs.length - 1];
          return (
            <span
              key={`${p.day}-${idx}`}
              className={
                isFirst
                  ? "text-left tabular-nums"
                  : isLast
                    ? "text-right tabular-nums"
                    : "text-center tabular-nums"
              }
            >
              {range === "24jam"
                ? "Sekarang"
                : range === "7hari"
                  ? weekdayShort(p.day)
                  : range === "3hari" && isLast
                    ? "Sekarang"
                    : shortDate(p.day)}
            </span>
          );
        })}
      </div>
    </div>
  );
}
