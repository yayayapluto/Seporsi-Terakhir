import { Skeleton } from "@/components/ui/skeleton";

/** ponytail: satu fallback Suspense; varian cukup untuk bentuk konten kini (kartu/tabel/list). */
export function LoadingSkeleton({ variant = "list" }: { variant?: "cards" | "report" | "list" }) {
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
  return (
    <output className="flex flex-col gap-3" aria-label="Memuat data">
      {["a", "b", "c"].map((k) => (
        <Skeleton key={`row-${k}`} className="h-16 w-full" />
      ))}
    </output>
  );
}
