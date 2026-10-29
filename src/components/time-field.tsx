"use client";

import { XIcon } from "lucide-react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const HOURS = Array.from({ length: 24 }, (_, h) => String(h).padStart(2, "0"));
const MINUTES = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, "0"));

/** Parse "HH:MM" → [jam, menit]; null bila kosong/rusak. */
function parseTime(value: string): [string | null, string | null] {
  const m = /^(\d{2}):(\d{2})/.exec(value);
  if (!m || m[1] == null || m[2] == null) return [null, null];
  return [m[1], m[2]];
}

/**
 * Pemetik jam SHADCN (Jam + Menit Select).
 * Pasangan `DateField` — pengganti input type="time" native.
 * `allowClear` tampilkan tombol X; `value=""` render placeholder "−−".
 */
export function TimeField({
  id,
  label,
  value,
  onChange,
  allowClear = false,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (next: string) => void;
  allowClear?: boolean;
}) {
  const [h, mi] = parseTime(value);
  const set = (nh: string | null, nmi: string | null) =>
    onChange(nh != null && nmi != null && nh !== "" && nmi !== "" ? `${nh}:${nmi}` : "");

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-2">
      <Label htmlFor={`${id}-hour`} className="font-semibold">
        {label}
      </Label>
      <div className="flex min-w-0 items-center gap-2">
        <Select value={h ?? null} onValueChange={(v) => v != null && set(String(v), mi ?? "")}>
          <SelectTrigger
            id={`${id}-hour`}
            className="h-11 min-h-11 min-w-0 flex-1 border-border bg-background px-2.5 font-normal transition-all hover:bg-muted hover:text-foreground"
            aria-label={`${label} jam`}
          >
            <SelectValue placeholder="−−" />
          </SelectTrigger>
          <SelectContent className="max-h-48">
            {HOURS.map((hh) => (
              <SelectItem key={hh} value={hh} className="py-1.5">
                {hh}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span aria-hidden="true" className="text-sm text-muted-foreground">
          :
        </span>
        <Select value={mi ?? null} onValueChange={(v) => v != null && set(h ?? "", String(v))}>
          <SelectTrigger
            id={id}
            className="h-11 min-h-11 min-w-0 flex-1 border-border bg-background px-2.5 font-normal transition-all hover:bg-muted hover:text-foreground"
            aria-label={`${label} menit`}
          >
            <SelectValue placeholder="−−" />
          </SelectTrigger>
          <SelectContent className="max-h-48">
            {MINUTES.map((mm) => (
              <SelectItem key={mm} value={mm} className="py-1.5">
                {mm}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {allowClear && value !== "" && (
          <button
            type="button"
            onClick={() => onChange("")}
            aria-label={`Hapus ${label.toLowerCase()}`}
            className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-md text-sm text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
          >
            <XIcon className="size-4" />
          </button>
        )}
      </div>
    </div>
  );
}
