import { cn } from "cn";
import type { LucideIcon } from "lucide-react";
import { ArrowLeft, ChevronRight, CircleAlert } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

/** Token class card Siera di atas primitif shadcn `card` — untuk section ber-label yang wajib pertahankan tag + aria. */
export const sieraCardClass =
  "overflow-hidden rounded-[20px] border border-line bg-white shadow-[0_1px_2px_rgba(16,24,40,.04)]";

/** Card Siera standar di atas primitif shadcn `card`: putih, radius 20, border #E8ECE9, shadow 1px. */
export function SieraCard({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn(sieraCardClass, className)}>{children}</div>;
}

/** Tile ikon 40px; teruskan size-8 via className untuk baris rapat. */
export function SieraTile({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#F1F5F2] text-[#2E7D4F]",
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Baris Field: ikon + label + isi. Pakai di dalam <dl>. */
export function SieraField({
  icon: Icon,
  label,
  children,
}: {
  icon: LucideIcon;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-11 items-center gap-3 py-3">
      <SieraTile>
        <Icon className="size-5" strokeWidth={1.75} aria-hidden />
      </SieraTile>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <dt className="text-[12px] font-semibold text-[#64746B]">{label}</dt>
        <dd className="min-w-0 text-sm font-semibold text-[#1C2826]">{children}</dd>
      </div>
    </div>
  );
}

/** Judul seksi kecil di atas grup card. */
export function SieraSectionTitle({ id, children }: { id?: string; children: ReactNode }) {
  return (
    <h2
      id={id}
      className="max-md:px-0 px-4 text-xs font-bold uppercase tracking-[0.08em] text-[#64746B]"
    >
      {children}
    </h2>
  );
}

/** Hero halaman student: gradient card + judul + subjudul. */
export function SieraHero({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-[20px] border border-line bg-gradient-to-b from-[#EAF5ED] to-white p-5">
      <p className="text-xs font-bold tracking-wide text-[#1E5A36]">{eyebrow}</p>
      <h1 className="text-xl leading-snug font-extrabold tracking-tight text-[#1C2826] lg:text-2xl">
        {title}
      </h1>
      <div className="text-sm text-[#1E5A36]">{children}</div>
    </div>
  );
}

/** Header halaman tenant: kicker + h1 + deskripsi. */
export function SieraTenantHeader({
  kicker,
  title,
  children,
}: {
  kicker: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-bold tracking-widest text-primary">{kicker}</p>
      <h1 className="text-3xl font-bold">{title}</h1>
      <div className="text-muted-foreground">{children}</div>
    </div>
  );
}

/** Wadah grouped list: radius tetap, overflow hidden, tanpa padding, divider solid. */
export const sieraListClass = "overflow-hidden rounded-[20px] border border-line bg-white";

/** List homogen: divider dashed 1px antar baris (PRODUCT-Siera §5.3). */
export function SieraList({
  className,
  children,
  ...rest
}: {
  className?: string;
  children: ReactNode;
} & React.HTMLAttributes<HTMLUListElement>) {
  return (
    <ul {...rest} className={cn(sieraListClass, "divide-y divide-dashed divide-line", className)}>
      {children}
    </ul>
  );
}

/** Tata letak baris: flex 64px, padding simetris 14px/16px. */
export const sieraRowLayoutClass = "flex min-h-16 items-center gap-3 px-4 py-3.5";

/** Interaksi baris: hover/focus/active mengisi penuh, radius ikut kartu. */
export const sieraRowActionClass =
  "outline-none transition-colors hover:bg-[#F1F5F2] focus-visible:bg-[#F1F5F2] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#2E7D4F] active:bg-line";

/** Baris navigasi: ikon 40 + teks truncate + chevron 20. */
export function SieraRowLink({
  href,
  icon: Icon,
  title,
  subtitle,
  onNavigate,
}: {
  href: string;
  icon: LucideIcon;
  title: ReactNode;
  subtitle?: ReactNode;
  onNavigate?: () => void;
}) {
  return (
    <li>
      <Link
        href={href}
        onClick={onNavigate}
        className={cn(sieraRowLayoutClass, sieraRowActionClass, "group w-full text-left")}
      >
        <SieraTile>
          <Icon className="size-5" strokeWidth={1.75} aria-hidden />
        </SieraTile>
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="text-[15px] leading-[1.3] font-semibold text-[#1C2826] max-md:whitespace-normal max-md:[overflow-wrap:anywhere]">
            {title}
          </span>
          {subtitle != null && (
            <span className="text-[12px] leading-[1.4] text-[#64746B] max-md:whitespace-normal max-md:[overflow-wrap:anywhere]">
              {subtitle}
            </span>
          )}
        </span>
        <ChevronRight
          className="size-5 shrink-0 text-[#64746B] transition-transform group-hover:translate-x-0.5"
          aria-hidden
        />
      </Link>
    </li>
  );
}

/** Banner status Siera: error merah / sukses hijau. role bawaan sesuai varian. */
export function SieraAlert({
  variant,
  children,
  icon = true,
}: {
  variant: "error" | "success";
  children: ReactNode;
  icon?: boolean;
}) {
  const error = variant === "error";
  return (
    <p
      role={error ? "alert" : "status"}
      className={
        error
          ? "flex items-start gap-2 rounded-2xl border border-[#F3C2C2] bg-[#FDECEC] px-4 py-3 text-sm font-semibold text-[#BA1A1A]"
          : "block rounded-xl border border-[#BFE3CF] bg-[#EAF5ED] px-4 py-3 text-sm font-semibold text-[#1E5A36]"
      }
    >
      {error && icon && <CircleAlert className="mt-0.5 size-5 shrink-0" aria-hidden />}
      <span className="min-w-0 flex-1">{children}</span>
    </p>
  );
}

/** Badge peringatan kuning (stok menipis, batas harian): bg soft + teks gelap. */
export function SieraWarningBadge({ children }: { children: ReactNode }) {
  return (
    <p className="w-fit rounded-full bg-[#FEF3C7] px-2.5 py-0.5 text-xs font-bold text-[#92400E]">
      {children}
    </p>
  );
}

/** Link kembali halaman: panah + label, satu baris min-h-11. */
export function SieraBackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-11 w-fit items-center gap-1.5 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
    >
      <ArrowLeft className="size-4" aria-hidden />
      {label}
    </Link>
  );
}

/** Input foto + pratinjau + hapus: satu pola untuk avatar & menu. */
export function SieraPhotoPicker({
  photoPreview,
  previewAlt,
  inputId,
  onFile,
  onRemove,
  round = false,
}: {
  photoPreview: string | null;
  previewAlt: string;
  inputId: string;
  onFile: (file: File | null) => void;
  onRemove: () => void;
  round?: boolean;
}) {
  const shape = round ? "rounded-full" : "rounded-lg";
  const box = round ? "size-16" : "size-20";
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-3">
        {photoPreview ? (
          <Image
            src={photoPreview}
            alt={previewAlt}
            width={round ? 64 : 80}
            height={round ? 64 : 80}
            unoptimized
            className={`${box} shrink-0 object-cover ${shape}`}
          />
        ) : (
          <div
            aria-hidden="true"
            className={`flex ${box} shrink-0 items-center justify-center ${shape} bg-muted text-xs text-muted-foreground`}
          >
            Tanpa foto
          </div>
        )}
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <Input
            id={inputId}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="h-11"
            onChange={(e) => onFile(e.target.files?.[0] ?? null)}
          />
          {photoPreview && (
            <Button
              type="button"
              variant="link"
              onClick={onRemove}
              className="min-h-11 self-start px-0 text-sm"
            >
              Hapus foto
            </Button>
          )}
        </div>
      </div>
      <p className="text-xs text-muted-foreground">JPG/PNG/WebP, maksimal 2 MB.</p>
    </div>
  );
}

/** Kerangka halaman auth/error tengah: kolom 430px + hero gradient + judul. */
export function SieraAuthShell({
  title,
  intro,
  children,
  eyebrow,
}: {
  title: string;
  intro?: ReactNode;
  children: ReactNode;
  eyebrow?: string;
}) {
  return (
    <div className="mx-auto flex w-full max-w-[430px] flex-1 flex-col justify-center gap-4 px-4 py-10">
      <div className="flex flex-col gap-1 rounded-[20px] border border-line bg-gradient-to-b from-[#EAF5ED] to-white p-5">
        {eyebrow && <p className="text-xs font-bold tracking-wide text-[#1E5A36]">{eyebrow}</p>}
        <h1 className="text-xl leading-snug font-extrabold tracking-tight text-[#1C2826]">
          {title}
        </h1>
        {intro && <div className="text-sm text-[#1E5A36]">{intro}</div>}
      </div>
      {children}
    </div>
  );
}

/** Teks badge angka: 9+ untuk >9. Satu sumber untuk tab + bell. */
export function sieraCountText(n: number): string {
  return n > 9 ? "9+" : String(n);
}

/** Katalog varian card PRODUCT-Siera §5.3 (diskriminan dokumentasi, tanpa polymorphic prop). */
export type SieraCardVariant =
  | "hero"
  | "banner"
  | "grouped"
  | "entity"
  | "announcement"
  | "detail"
  | "collapsible"
  | "field"
  | "status"
  | "settings"
  | "stat"
  | "empty"
  | "disabled"
  | "danger";

/** Section berlabel: label di luar card + aksi kanan satu baris (PRODUCT-Siera §5.1, §8). */
export function SieraSection({
  id,
  label,
  action,
  children,
  className,
}: {
  id?: string;
  label: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section aria-label={label} className={cn("flex min-w-0 flex-col gap-2", className)}>
      <div className="flex min-h-11 items-center justify-between gap-3 px-4 max-md:px-0">
        <SieraSectionTitle id={id}>
          <span className="block truncate whitespace-nowrap">{label}</span>
        </SieraSectionTitle>
        {action != null && <div className="flex shrink-0 items-center">{action}</div>}
      </div>
      {children}
    </section>
  );
}

/** Empty Card dashed (PRODUCT-Siera §5.3): kondisi kosong wajib pakai ini. */
export function SieraEmpty({
  title,
  hint,
  action,
  id,
  compact = false,
  icon: Icon,
  className,
}: {
  title: string;
  hint?: string;
  action?: ReactNode;
  id?: string;
  compact?: boolean;
  icon?: LucideIcon;
  className?: string;
}) {
  return (
    <div
      id={id}
      className={cn(
        "flex flex-col items-center gap-3 rounded-[20px] border-[1.5px] border-dashed border-line bg-white px-4 text-center max-md:rounded-2xl max-md:w-full max-md:mx-0 max-md:p-5",
        compact ? "py-6" : "py-10 md:py-14",
        className,
      )}
    >
      {Icon && (
        <span
          aria-hidden
          className="flex size-16 items-center justify-center rounded-full bg-[#EAF5ED] text-[#2E7D4F]"
        >
          <Icon className="size-[30px]" strokeWidth={1.7} />
        </span>
      )}
      <p
        className={
          Icon ? "text-lg font-extrabold text-[#1C2826]" : "text-sm font-bold text-[#1C2826]"
        }
      >
        {title}
      </p>
      {hint != null && <p className="text-sm text-[#64746B]">{hint}</p>}
      {action}
    </div>
  );
}

/** Satu stat ringkas: ikon + angka + label (PRODUCT-Siera §5.3 Stat Pill/Card). */
export function SieraStat({
  icon: Icon,
  value,
  label,
}: {
  icon: LucideIcon;
  value: ReactNode;
  label: string;
}) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <SieraTile>
        <Icon className="size-5" strokeWidth={1.75} aria-hidden />
      </SieraTile>
      <div className="min-w-0">
        <p className="truncate text-lg leading-none font-extrabold max-md:whitespace-normal max-md:[overflow-wrap:anywhere]">
          {value}
        </p>
        <p className="mt-1 text-[11px] font-semibold text-[#64746B]">{label}</p>
      </div>
    </div>
  );
}

/** Strip 3 stat: satu card dibagi divider dashed (bukan 3 card lepas). */
export function SieraStatStrip({ children }: { children: ReactNode }) {
  return (
    <SieraCard className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-x divide-dashed divide-line p-4">
      {children}
    </SieraCard>
  );
}

/** Rel kanan desktop: grid 2 kolom (main + aside 340) dalam container max-w 1160, ala rail.
Di bawah xl satu kolom persis seperti sekarang (aside menumpuk di bawah main). */
export function SieraRailPage({
  main,
  asideLabel,
  aside,
  className,
}: {
  main: ReactNode;
  asideLabel: string;
  aside: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mx-auto grid w-full min-w-0 max-w-[430px] md:max-w-[1160px] flex-1 grid-cols-1 content-start items-start gap-4 px-4 py-6 md:px-8 md:pb-8 lg:gap-5 xl:grid-cols-[minmax(0,1fr)_340px] xl:items-stretch xl:gap-6",
        className,
      )}
    >
      <div className="flex min-w-0 flex-col gap-4 lg:gap-5">{main}</div>
      <aside aria-label={asideLabel} className="flex min-w-0 flex-col">
        <div className="flex min-w-0 flex-col gap-4 lg:gap-5 xl:sticky xl:top-20">{aside}</div>
      </aside>
    </div>
  );
}
