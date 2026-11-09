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

/** Skeleton halaman generik: judul + stat + list. */
export function GenericPageSkeleton() {
  return (
    <div aria-busy="true" className="flex min-h-0 flex-col gap-4">
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
        <SkeletonListItem />
      </div>
    </div>
  );
}

/** Kartu foto skeleton: blok foto 120px + teks + harga (kartu katalog/beranda). */
export function SkeletonPhotoCard({ withCta = false }: { withCta?: boolean }) {
  return (
    <div
      aria-hidden="true"
      className="flex flex-col overflow-hidden rounded-2xl border border-[#e3e9e5] bg-white"
    >
      <Skeleton className="h-[120px] w-full rounded-none" />
      <div className="flex flex-1 flex-col gap-2 p-4">
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-4 w-1/2" />
        <div className="mt-1 flex items-baseline gap-2">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-4 w-14" />
        </div>
      </div>
      {withCta && (
        <>
          <Skeleton className="mx-4 h-px rounded-none" />
          <div className="flex min-h-11 items-center justify-between px-4 py-3">
            <Skeleton className="h-4 w-28" />
          </div>
        </>
      )}
    </div>
  );
}

/** Skeleton masuk: kartu sambutan + kartu tombol + form email, cermin layout asli. */
export function MasukSkeleton() {
  return (
    <div aria-busy="true" className="flex min-h-0 flex-col gap-4">
      <output className="sr-only">Memuat</output>
      <div
        aria-hidden="true"
        className="mx-auto flex w-full max-w-[430px] flex-col gap-4 px-4 py-10"
      >
        <div className="flex flex-col gap-2 rounded-[20px] border border-line p-5">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-full" />
        </div>
        <div className="flex flex-col gap-3 rounded-[20px] border border-line p-4">
          <Skeleton className="h-12 w-full rounded-xl" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-px flex-1 rounded-none" />
          <Skeleton className="h-4 w-8 rounded-none" />
          <Skeleton className="h-px flex-1 rounded-none" />
        </div>
        <div className="flex flex-col gap-4 rounded-[20px] border border-line p-4">
          <SkeletonField />
          <Skeleton className="h-12 w-full rounded-xl" />
          <Skeleton className="h-3 w-2/3" />
        </div>
      </div>
    </div>
  );
}

/** Skeleton katalog: baris filter 2 kolom + grid kartu foto. */
export function KatalogSkeleton() {
  return (
    <div aria-busy="true" className="flex min-h-0 flex-col gap-4">
      <output className="sr-only">Memuat</output>
      <div aria-hidden="true" className="flex flex-col gap-4">
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="flex flex-1 flex-col gap-1.5">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>
          <div className="flex flex-1 flex-col gap-1.5">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>
        </div>
        <div className="grid grid-cols-1 items-stretch gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <SkeletonPhotoCard withCta />
          <SkeletonPhotoCard withCta />
          <SkeletonPhotoCard withCta />
          <SkeletonPhotoCard withCta />
          <SkeletonPhotoCard withCta />
          <SkeletonPhotoCard withCta />
        </div>
      </div>
    </div>
  );
}

/** Skeleton detail porsi: kartu ringkasan + foto besar + kartu detail + panel pesan. */
export function PortionDetailSkeleton() {
  return (
    <div aria-busy="true" className="flex min-h-0 flex-col gap-4">
      <output className="sr-only">Memuat</output>
      <div aria-hidden="true" className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 rounded-2xl border border-[#e3e9e5] bg-white p-5">
          <Skeleton className="h-6 w-24 rounded-full" />
          <Skeleton className="h-7 w-3/4" />
          <Skeleton className="h-4 w-1/3" />
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <Skeleton className="h-8 w-28" />
            <Skeleton className="h-4 w-36" />
          </div>
        </div>
        <Skeleton className="aspect-[4/3] w-full rounded-[20px]" />
        <div className="flex flex-col gap-2 rounded-2xl border border-[#e3e9e5] bg-white px-4 py-2">
          <Skeleton className="h-11 w-full rounded-none" />
          <Skeleton className="h-11 w-full rounded-none" />
          <Skeleton className="h-11 w-full rounded-none" />
        </div>
      </div>
    </div>
  );
}

/** Skeleton daftar pesanan: pills filter + kartu pesanan (tile + teks + harga). */
export function OrdersListSkeleton() {
  return (
    <div aria-busy="true" className="flex min-h-0 flex-col gap-4">
      <output className="sr-only">Memuat</output>
      <div aria-hidden="true" className="flex flex-col gap-3">
        <div className="flex gap-2.5">
          <Skeleton className="h-11 w-20 rounded-full" />
          <Skeleton className="h-11 w-28 rounded-full" />
          <Skeleton className="h-11 w-20 rounded-full" />
        </div>
        {Array.from({ length: 3 }, (_, i) => (
          <div
            // biome-ignore lint/suspicious/noArrayIndexKey: baris skeleton statis, urutan tidak berubah
            key={i}
            className="flex items-center gap-3 rounded-2xl border border-[#e3e9e5] bg-white px-5 py-[18px]"
          >
            <Skeleton className="hidden size-12 shrink-0 rounded-xl md:block" />
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-4 w-1/2" />
            </div>
            <Skeleton className="h-6 w-20 shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Skeleton detail pesanan: kartu ringkasan + kartu detail + panel samping. */
export function OrderDetailSkeleton() {
  return (
    <div aria-busy="true" className="flex min-h-0 flex-col gap-4">
      <output className="sr-only">Memuat</output>
      <div aria-hidden="true" className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 rounded-2xl border border-[#e3e9e5] bg-white p-5">
          <Skeleton className="h-6 w-24 rounded-full" />
          <Skeleton className="h-7 w-3/4" />
          <Skeleton className="h-4 w-1/3" />
        </div>
        <div className="flex flex-col gap-2 rounded-2xl border border-[#e3e9e5] bg-white px-4 py-2">
          <Skeleton className="h-11 w-full rounded-none" />
          <Skeleton className="h-11 w-full rounded-none" />
          <Skeleton className="h-11 w-full rounded-none" />
        </div>
        <div className="flex flex-col gap-2 rounded-2xl border border-[#e3e9e5] bg-white p-4">
          <Skeleton className="h-5 w-1/3" />
          <Skeleton className="h-12 w-full rounded-xl" />
          <Skeleton className="h-12 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}

/** Skeleton beranda: sapaan + grid kartu foto + list. */
export function BerandaSkeleton() {
  return (
    <div aria-busy="true" className="flex min-h-0 flex-col gap-4">
      <output className="sr-only">Memuat</output>
      <div aria-hidden="true" className="flex flex-col gap-4">
        <SkeletonText lines={2} />
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          <SkeletonPhotoCard />
          <SkeletonPhotoCard />
          <SkeletonPhotoCard />
        </div>
        <SkeletonListItem />
        <SkeletonListItem />
      </div>
    </div>
  );
}

/** Skeleton dasbor tenant: judul + stat strip + list dengan tombol. */
export function TenantDashboardSkeleton() {
  return (
    <div aria-busy="true" className="flex min-h-0 flex-col gap-4">
      <output className="sr-only">Memuat</output>
      <div aria-hidden="true" className="flex flex-col gap-4">
        <SkeletonText lines={2} />
        <div className="grid grid-cols-[repeat(auto-fit,minmax(0,1fr))] gap-3">
          <SkeletonStat />
          <SkeletonStat />
          <SkeletonStat />
        </div>
        <Skeleton className="h-12 w-full rounded-xl" />
        <SkeletonListItem withButton />
        <SkeletonListItem />
        <SkeletonListItem />
      </div>
    </div>
  );
}

/** Skeleton form porsi: tumpukan field + kartu samping. */
export function PortionFormSkeleton() {
  return (
    <div aria-busy="true" className="grid items-start gap-6 md:grid-cols-[minmax(0,1fr)_320px]">
      <output className="sr-only">Memuat</output>
      <div aria-hidden="true" className="flex min-w-0 flex-col gap-6">
        <SkeletonField />
        <SkeletonField />
        <SkeletonField />
        <SkeletonField />
        <Skeleton className="h-12 w-full rounded-xl" />
      </div>
      <div aria-hidden="true" className="hidden min-w-0 flex-col gap-4 md:flex">
        <div className="flex flex-col overflow-hidden rounded-2xl border border-[#e3e9e5] bg-white">
          <Skeleton className="aspect-[4/3] w-full rounded-none" />
          <div className="flex flex-col gap-2 p-3">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-5 w-20" />
          </div>
        </div>
        <div className="flex flex-col gap-2 rounded-2xl border border-[#e3e9e5] bg-white p-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </div>
    </div>
  );
}

/** Skeleton daftar menu: baris dengan thumb + meta + tombol edit. */
export function MenuListSkeleton() {
  return (
    <div aria-busy="true" className="flex min-h-0 flex-col gap-3">
      <output className="sr-only">Memuat</output>
      <div aria-hidden="true" className="flex flex-col gap-3">
        {Array.from({ length: 3 }, (_, i) => (
          <div
            // biome-ignore lint/suspicious/noArrayIndexKey: baris skeleton statis, urutan tidak berubah
            key={i}
            className="flex items-center gap-4 rounded-2xl border border-[#e3e9e5] bg-white px-4 py-3.5"
          >
            <Skeleton className="size-16 shrink-0 rounded-lg" />
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <Skeleton className="h-5 w-1/2" />
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-4 w-2/3" />
            </div>
            <Skeleton className="h-11 w-16 shrink-0 rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Skeleton notifikasi: avatar + 2 baris teks. */
export function NotifSkeleton() {
  return (
    <div aria-busy="true" className="flex min-h-0 flex-col gap-3">
      <output className="sr-only">Memuat</output>
      <div aria-hidden="true" className="flex flex-col gap-3">
        <SkeletonText lines={1} />
        {Array.from({ length: 3 }, (_, i) => (
          <div
            // biome-ignore lint/suspicious/noArrayIndexKey: baris skeleton statis, urutan tidak berubah
            key={i}
            className="flex items-start gap-3 rounded-2xl border border-[#e3e9e5] bg-white p-4"
          >
            <Skeleton className="size-10 shrink-0 rounded-full" />
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-1/4" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Skeleton form profil: tumpukan field + tombol simpan. */
export function ProfileFormSkeleton() {
  return (
    <div aria-busy="true" className="flex min-h-0 flex-col gap-4">
      <output className="sr-only">Memuat</output>
      <div aria-hidden="true" className="flex flex-col gap-4">
        <SkeletonField />
        <SkeletonField />
        <SkeletonField />
        <Skeleton className="h-12 w-full rounded-xl" />
      </div>
    </div>
  );
}

/** Skeleton scan: bingkai kamera + tombol. */
export function ScanSkeleton() {
  return (
    <div aria-busy="true" className="flex min-h-0 flex-col gap-4">
      <output className="sr-only">Memuat</output>
      <div aria-hidden="true" className="flex flex-col gap-4">
        <SkeletonText lines={1} />
        <Skeleton className="aspect-square w-full rounded-2xl" />
        <Skeleton className="h-12 w-full rounded-xl" />
      </div>
    </div>
  );
}

/** Skeleton admin: baris dengan dua tombol aksi. */
export function AdminListSkeleton() {
  return (
    <div aria-busy="true" className="flex min-h-0 flex-col gap-3">
      <output className="sr-only">Memuat</output>
      <div aria-hidden="true" className="flex flex-col gap-3">
        {Array.from({ length: 3 }, (_, i) => (
          <div
            // biome-ignore lint/suspicious/noArrayIndexKey: baris skeleton statis, urutan tidak berubah
            key={i}
            className="flex items-center gap-3 rounded-2xl border border-[#e3e9e5] bg-white px-4 py-3.5"
          >
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <Skeleton className="h-5 w-1/2" />
              <Skeleton className="h-4 w-1/3" />
            </div>
            <Skeleton className="h-11 w-20 shrink-0 rounded-xl" />
            <Skeleton className="h-11 w-20 shrink-0 rounded-xl" />
          </div>
        ))}
      </div>
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
