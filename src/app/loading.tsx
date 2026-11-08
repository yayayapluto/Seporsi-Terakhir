import { Skeleton } from "@/components/ui/skeleton";
import { SkeletonListItem, SkeletonStat, SkeletonText } from "@/components/ui/skeleton-blocks";

/** Skeleton global: cerminan halaman dalam generik (judul, stat, list). */
export default function Loading() {
  return (
    <div aria-busy="true" className="flex min-h-0 flex-col gap-4 px-4 py-6 max-md:px-0">
      <output className="sr-only">Memuat</output>
      <div aria-hidden="true" className="flex flex-col gap-4">
        <SkeletonText lines={2} />
        <div className="grid grid-cols-[repeat(auto-fit,minmax(0,1fr))] gap-3">
          <SkeletonStat />
          <SkeletonStat />
          <SkeletonStat />
        </div>
        <SkeletonListItem />
        <SkeletonListItem />
        <Skeleton className="h-12 w-full rounded-xl" />
      </div>
    </div>
  );
}
