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
      className={`flex items-start gap-2 rounded-xl bg-[#fdf0d5] px-3 py-2 text-[#7a4a00] ${className ?? ""}`}
    >
      <Info className="size-[18px] shrink-0" aria-hidden />
      <span className="text-[13px] leading-snug font-semibold">
        <strong>Syarat: </strong>
        {conditions}
      </span>
    </p>
  );
}
