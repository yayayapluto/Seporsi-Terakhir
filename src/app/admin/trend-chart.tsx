"use client";

import { useReducedMotion } from "motion/react";
import { useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";

type RangeKey = "24jam" | "3hari" | "7hari" | "sebulan";

const RANGES: { key: RangeKey; label: string; days: number }[] = [
  { key: "24jam", label: "24 jam", days: 1 },
  { key: "3hari", label: "3 hari", days: 3 },
  { key: "7hari", label: "7 hari", days: 7 },
  { key: "sebulan", label: "Sebulan", days: 30 },
];

function shortDay(iso: string): string {
  return `${Number(iso.slice(8, 10))}/${Number(iso.slice(5, 7))}`;
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

/** Line chart tren harian admin (recharts, pilihan skill pick-ui-library). */
export function TrendChart({ series }: { series: { day: string; saved: number }[] }) {
  const [range, setRange] = useState<RangeKey>("7hari");
  const reduceMotion = useReducedMotion() ?? false;
  const days = RANGES.find((r) => r.key === range)?.days ?? 7;
  const points = series.slice(-days);
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
            onClick={() => setRange(r.key)}
            className="min-h-11 px-1 text-sm whitespace-nowrap"
          >
            {r.label}
          </Button>
        ))}
      </fieldset>
      <div className="h-56 w-full min-w-0" role="img" aria-label="Tren pickup harian dalam garis">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart key={range} data={points} margin={{ top: 8, right: 8, bottom: 4, left: 0 }}>
            <CartesianGrid vertical={false} stroke="#E8ECE9" />
            <XAxis
              dataKey="day"
              tickFormatter={shortDay}
              tick={{ fontSize: 10, fill: "#64746B" }}
              tickLine={false}
              axisLine={false}
              minTickGap={28}
              tickMargin={8}
            />
            <YAxis
              domain={[0, "dataMax"]}
              tick={{ fontSize: 10, fill: "#64746B" }}
              tickLine={false}
              axisLine={false}
              width={28}
            />
            <Tooltip
              cursor={{ stroke: "#64746B", strokeDasharray: "3 3" }}
              formatter={(value) => [`${value} porsi`, "Diselamatkan"]}
              labelFormatter={(day) => fullDate(String(day))}
              contentStyle={{
                borderRadius: 12,
                border: "1px solid #E8ECE9",
                boxShadow: "0 4px 16px rgba(28,40,38,0.08)",
                fontSize: 12,
                padding: "8px 12px",
              }}
            />
            <Line
              type="monotone"
              dataKey="saved"
              stroke="#2E7D4F"
              strokeWidth={2.5}
              isAnimationActive={!reduceMotion}
              animationDuration={700}
              animationEasing="ease-out"
              dot={points.length <= 2 ? { r: 4, fill: "#2E7D4F" } : false}
              activeDot={{ r: 5, fill: "#2E7D4F", stroke: "#FFFFFF", strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
