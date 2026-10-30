import { Skeleton } from "@/components/ui/skeleton";

/** ponytail: satu fallback Suspense; varian cukup untuk bentuk konten kini (kartu/tabel/list). */
export function LoadingSkeleton({
  variant = "list",
}: {
  variant?: "cards" | "report" | "list" | "grouped-list" | "entity-row" | "catalog-list";
}) {
  if (variant === "cards") {
    return (
      <output className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4" aria-label="Memuat porsi">
        {["a", "b", "c", "d", "e", "f"].map((k) => (
          <div
            key={`card-${k}`}
            className="flex flex-col gap-1 overflow-hidden rounded-xl border bg-card p-3"
          >
            <Skeleton className="aspect-[4/3] w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="mt-2 h-11 w-full" />
          </div>
        ))}
      </output>
    );
  }
  if (variant === "report") {
    return (
      <output className="flex flex-col gap-6" aria-label="Memuat laporan">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {["a", "b", "c", "d"].map((k) => (
            <Skeleton key={`stat-${k}`} className="h-20 w-full" />
          ))}
        </div>
        <Skeleton className="h-64 w-full" />
      </output>
    );
  }
  if (variant === "grouped-list") {
    return (
      <output className="flex flex-col gap-2" aria-label="Memuat pesanan aktif">
        <Skeleton className="h-3 w-28" />
        <div className="flex flex-col divide-y divide-dashed divide-[#E8ECE9] rounded-[20px] border border-[#E8ECE9] bg-white px-4">
          {["a", "b", "c"].map((k) => (
            <div key={`order-${k}`} className="flex items-center gap-3 py-3">
              <Skeleton className="size-10 shrink-0 rounded-xl" />
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </output>
    );
  }
  if (variant === "entity-row") {
    return (
      <output className="flex flex-col gap-2" aria-label="Memuat katalog sore ini">
        <Skeleton className="h-3 w-32" />
        <div className="flex snap-x gap-3 overflow-hidden pr-8 pb-1">
          {["a", "b"].map((k) => (
            <div
              key={`soon-${k}`}
              className="flex w-[240px] shrink-0 snap-start flex-col overflow-hidden rounded-[20px] border border-[#E8ECE9] bg-white"
            >
              <Skeleton className="h-28 w-full shrink-0 rounded-none" />
              <div className="flex flex-col gap-1.5 p-4 pb-3">
                <Skeleton className="h-4 w-4/5" />
                <Skeleton className="h-3 w-2/5" />
              </div>
              <div aria-hidden className="mx-4 border-t border-dashed border-[#E8ECE9]" />
              <div className="flex flex-col gap-1.5 p-4 pt-3">
                <Skeleton className="h-3 w-3/5" />
                <Skeleton className="h-5 w-2/5" />
              </div>
            </div>
          ))}
        </div>
      </output>
    );
  }
  if (variant === "catalog-list") {
    return (
      <output className="flex flex-col gap-3" aria-label="Memuat katalog">
        <Skeleton className="h-3 w-32" />
        {["a", "b", "c"].map((k) => (
          <div
            key={`cat-${k}`}
            className="flex flex-col overflow-hidden rounded-[20px] border border-[#E8ECE9] bg-white"
          >
            <Skeleton className="h-28 w-full shrink-0 rounded-none" />
            <div className="flex flex-col gap-1.5 p-4 pb-3">
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-3 w-2/5" />
            </div>
            <div aria-hidden className="mx-4 border-t border-dashed border-[#E8ECE9]" />
            <div className="flex flex-col gap-1.5 p-4 pt-3">
              <Skeleton className="h-3 w-3/5" />
              <Skeleton className="h-5 w-2/5" />
            </div>
          </div>
        ))}
      </output>
    );
  }
  return (
    <output className="flex flex-col gap-3" aria-label="Memuat data">
      {["a", "b", "c"].map((k) => (
        <Skeleton key={`row-${k}`} className="h-16 w-full" />
      ))}
    </output>
  );
}
