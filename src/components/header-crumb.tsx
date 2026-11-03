import { Fragment } from "react";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export interface Crumb {
  label: string;
  href?: string;
}

/** Crumb header: breadcrumb + tombol kembali. */
export function HeaderCrumb({ trail }: { trail: Crumb[] }) {
  const router = useRouter();
  const current = trail[trail.length - 1];
  return (
    <nav aria-label="Navigasi halaman" className="flex min-w-0 items-center gap-2">
      <button
        type="button"
        onClick={() => router.back()}
        aria-label={`Kembali dari ${current?.label ?? "halaman ini"}`}
        className="flex size-11 shrink-0 items-center justify-center rounded-full text-[#1E5A36] outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-[#2E7D4F] md:hidden"
      >
        <ArrowLeft className="size-5" aria-hidden />
      </button>
      <Breadcrumb>
        <BreadcrumbList className="sm:gap-2.5">
          {trail.map((c, i) => {
            const last = i === trail.length - 1;
            return (
              <Fragment key={c.label}>
                <BreadcrumbItem>
                  {last || !c.href ? (
                    <BreadcrumbPage>{c.label}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink render={<Link href={c.href} />}>{c.label}</BreadcrumbLink>
                  )}
                </BreadcrumbItem>
                {!last && <BreadcrumbSeparator />}
              </Fragment>
            );
          })}
        </BreadcrumbList>
      </Breadcrumb>
    </nav>
  );
}
