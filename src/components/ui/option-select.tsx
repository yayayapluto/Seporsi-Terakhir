"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";

/** Select berlabel: trigger selalu menampilkan label opsi terpilih (bukan value mentah). */
export function OptionSelect({
  value,
  onValueChange,
  options,
  placeholder,
  id,
  ariaLabel,
  className,
  disabled,
}: {
  value: string;
  onValueChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  id?: string;
  ariaLabel?: string;
  className?: string;
  disabled?: boolean;
}) {
  const selected = options.find((o) => String(o.value) === String(value));
  return (
    <Select
      value={value}
      onValueChange={(v) => {
        if (v != null) onValueChange(v);
      }}
      disabled={disabled}
    >
      <SelectTrigger id={id} aria-label={ariaLabel} className={className}>
        <SelectValue placeholder={placeholder}>{selected?.label ?? placeholder}</SelectValue>
      </SelectTrigger>
      <SelectContent align="start" alignItemWithTrigger={false}>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
