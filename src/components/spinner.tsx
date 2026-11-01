import { cn } from "cn";

/** ponytail: LoaderCircle lucide cukup; span murni duplikasi pola tiap tombol. */
export function Spinner({ className }: { className?: string }) {
  return (
    <output
      aria-label="Memuat"
      className={cn(
        "order-last size-4 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent",
        className,
      )}
    />
  );
}
