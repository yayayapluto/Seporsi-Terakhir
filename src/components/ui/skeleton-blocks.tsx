import { Card } from "./card";
import { Skeleton } from "./skeleton";

/** Bar teks skeleton; baris terakhir w-2/3. */
export function SkeletonText({
  lines = 2,
  className = "h-4",
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div aria-hidden="true" className="flex flex-col gap-2">
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton
          // biome-ignore lint/suspicious/noArrayIndexKey: bar skeleton statis, urutan tidak berubah
          key={i}
          className={`${className} ${i === lines - 1 && lines > 1 ? "w-2/3" : "w-full"}`}
        />
      ))}
    </div>
  );
}

/** Card skeleton dengan padding seperti card asli. */
export function SkeletonCard({
  children,
  className = "p-4",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card aria-hidden="true" className={className}>
      {children}
    </Card>
  );
}

/** Stat skeleton: tile ikon + value + label, sel grid seperti stat asli. */
export function SkeletonStat() {
  return (
    <div
      aria-hidden="true"
      className="flex min-w-0 flex-col gap-2 rounded-2xl border border-[#e3e9e5] bg-white p-3"
    >
      <Skeleton className="size-9 rounded-xl" />
      <Skeleton className="h-6 w-16" />
      <Skeleton className="h-3 w-20" />
    </div>
  );
}

/** Item list skeleton: nama + pill badge, 2 baris meta, tombol bar opsional. */
export function SkeletonListItem({ withButton = false }: { withButton?: boolean }) {
  return (
    <div
      aria-hidden="true"
      className="flex flex-col gap-3 rounded-xl border border-[#e3e9e5] bg-white p-4"
    >
      <div className="flex items-center justify-between gap-3">
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="h-6 w-16 shrink-0 rounded-full" />
      </div>
      <div className="flex flex-col gap-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-1/2" />
      </div>
      {withButton && <Skeleton className="h-12 w-full rounded-xl" />}
    </div>
  );
}

/** Chart skeleton: title bar + selector 4 pil + area chart h-56 mobile. */
export function SkeletonChart() {
  return (
    <div aria-hidden="true" className="flex flex-col gap-3">
      <Skeleton className="h-6 w-32" />
      <div className="grid grid-cols-[repeat(4,minmax(0,1fr))] gap-1">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton
            // biome-ignore lint/suspicious/noArrayIndexKey: pil selector statis, urutan tidak berubah
            key={i}
            className="h-11 w-full rounded-lg"
          />
        ))}
      </div>
      <Skeleton className="h-56 w-full rounded-xl" />
    </div>
  );
}

/** Field skeleton: label bar + input bar h-12. */
export function SkeletonField() {
  return (
    <div aria-hidden="true" className="flex min-w-0 flex-col gap-1.5">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-12 w-full rounded-xl" />
    </div>
  );
}

/** Baris tabel skeleton. */
export function SkeletonTableRow() {
  return (
    <div aria-hidden="true" className="flex items-center gap-3">
      <Skeleton className="h-5 w-1/3" />
      <Skeleton className="h-5 w-1/6" />
      <Skeleton className="h-5 w-1/6" />
      <Skeleton className="h-5 w-1/4" />
    </div>
  );
}
