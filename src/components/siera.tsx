import { cn } from "cn";
import type { LucideIcon } from "lucide-react";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

/** Token class card Siera — untuk section ber-label yang wajib pertahankan tag + aria. */
export const sieraCardClass =
  "overflow-hidden rounded-[20px] border border-line bg-white shadow-[0_1px_2px_rgba(16,24,40,.04)]";

/** Card Siera standar: putih, radius 20, border #E8ECE9, shadow 1px. */
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
    <h2 id={id} className="text-[12px] font-semibold tracking-[0.02em] text-[#64746B]">
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

/** List homogen: divider solid 1px antar baris, tanpa dashed. */
export function SieraList({
  className,
  children,
  ...rest
}: {
  className?: string;
  children: ReactNode;
} & React.HTMLAttributes<HTMLUListElement>) {
  return (
    <ul {...rest} className={cn(sieraListClass, "divide-y divide-line", className)}>
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
        className={cn(sieraRowLayoutClass, sieraRowActionClass, "w-full text-left")}
      >
        <SieraTile>
          <Icon className="size-5" strokeWidth={1.75} aria-hidden />
        </SieraTile>
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="truncate text-[15px] leading-[1.3] font-semibold text-[#1C2826]">
            {title}
          </span>
          {subtitle != null && (
            <span className="truncate text-[12px] leading-[1.4] text-[#64746B]">{subtitle}</span>
          )}
        </span>
        <ChevronRight className="size-5 shrink-0 text-[#64746B]" aria-hidden />
      </Link>
    </li>
  );
}
