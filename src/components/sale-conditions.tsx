import { Info } from "lucide-react";

/**
 * Syarat penjualan menu (menu_items.sale_conditions). NULL/kosong = render
 * tidak ada apa-apa. Teks penuh, tidak di-truncate, tidak di-clamp.
 */
export function SaleConditions({
  conditions,
  className,
}: {
  conditions: string | null | undefined;
  className?: string;
}) {
  if (conditions == null || conditions.trim() === "") return null;
  return (
    <p
      className={`flex items-start gap-1.5 rounded-lg bg-[#fdf0d5] px-2.5 py-1.5 text-[#7a4a00] ${className ?? ""}`}
    >
      <Info className="size-3.5 shrink-0" aria-hidden />
      <span className="text-xs leading-snug font-semibold">
        <strong>Syarat: </strong>
        {conditions}
      </span>
    </p>
  );
}
