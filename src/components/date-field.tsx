"use client";

import { id as localeId } from "date-fns/locale";
import { CalendarIcon, XIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const MONTH = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

/** Parse "YYYY-MM-DD" tanpa geser zona (konstruktor Date UTC bisa geser hari di WIB). */
export function parseDateOnly(value: string): Date | undefined {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!m) return undefined;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return Number.isNaN(d.getTime()) ? undefined : d;
}

/** Format Date → "YYYY-MM-DD" waktu lokal (bukan toISOString/UTC). */
export function toDateOnly(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/**
 * Pemetik tanggal SHADCN tunggal (Popover + Calendar).
 * Satu-satunya date picker proyek — pengganti input type="date" native.
 */
export function DateField({
  id,
  label,
  value,
  onChange,
  min,
  max,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (next: string) => void;
  min?: string;
  max?: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = parseDateOnly(value);
  const minDate = min ? parseDateOnly(min) : undefined;
  const maxDate = max ? parseDateOnly(max) : undefined;
  const disabled =
    minDate != null && maxDate != null
      ? { before: minDate, after: maxDate }
      : minDate != null
        ? { before: minDate }
        : maxDate != null
          ? { after: maxDate }
          : undefined;

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-2">
      <Label htmlFor={id} className="font-semibold">
        {label}
      </Label>
      <div className="flex gap-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger
            render={
              <button
                id={id}
                type="button"
                data-slot="button"
                className="group/button inline-flex h-11 min-h-11 flex-1 shrink-0 items-center justify-start gap-1.5 rounded-lg border border-border bg-background px-2.5 py-2 text-sm font-normal whitespace-nowrap transition-all outline-none select-none hover:bg-muted hover:text-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-expanded:bg-muted aria-expanded:text-foreground"
              >
                <CalendarIcon className="size-4 shrink-0 text-muted-foreground" />
                {selected
                  ? `${selected.getDate()} ${MONTH[selected.getMonth() ?? 0] ?? ""} ${selected.getFullYear()}`
                  : "Pilih tanggal"}
              </button>
            }
          />
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              locale={localeId}
              selected={selected}
              disabled={disabled}
              onSelect={(d) => {
                if (!d) return;
                onChange(toDateOnly(d));
                setOpen(false);
              }}
            />
          </PopoverContent>
        </Popover>
        {selected && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="min-h-11 shrink-0 px-3"
            onClick={() => onChange("")}
            aria-label={`Hapus ${label.toLowerCase()}`}
          >
            <XIcon className="size-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
