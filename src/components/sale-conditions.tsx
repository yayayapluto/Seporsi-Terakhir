import { Info } from "lucide-react";

/**
 * Syarat penjualan menu (menu_items.sale_conditions). NULL/kosong = render
 * tidak ada apa-apa. Default teks penuh, tidak di-truncate, tidak di-clamp.
 * `brief` = tampil "Dengan syarat" saja (untuk kartu list; detail teks hanya
 * di halaman detail porsi).
 */
export function SaleConditions({
  conditions,
  brief,
  className,
}: {
  conditions: string | null | undefined;
  brief?: boolean;
  className?: string;
}) {
  if (conditions == null || conditions.trim() === "") return null;
  return (
    <p
      className={`flex items-start gap-1.5 rounded-lg bg-[#fdf0d5] px-2.5 py-1.5 text-[#7a4a00] ${className ?? ""}`}
    >
      <Info className="size-3.5 shrink-0" aria-hidden />
      <span className="text-xs leading-snug font-semibold">
        {brief ? (
          "Dengan syarat"
        ) : (
          <>
            <strong>Syarat: </strong>
            {conditions}
          </>
        )}
      </span>
    </p>
  );
}
