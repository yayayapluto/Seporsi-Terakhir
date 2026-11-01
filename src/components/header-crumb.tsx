"use client";

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

/** Crumb header: desktop breadcrumb, mobile tombol kembali. */
export function HeaderCrumb({ trail }: { trail: Crumb[] }) {
  const router = useRouter();
  const current = trail[trail.length - 1];
  return (
    <>
      <nav aria-label="Navigasi halaman" className="hidden min-w-0 items-center gap-2 md:flex">
        <Breadcrumb>
          <BreadcrumbList>
            {trail.map((c, i) =>
              i < trail.length - 1 && c.href ? (
                <span key={c.label} className="contents">
                  <BreadcrumbItem>
                    <BreadcrumbLink render={<Link href={c.href} />}>{c.label}</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                </span>
              ) : (
                <BreadcrumbItem key={c.label}>
                  <BreadcrumbPage>{c.label}</BreadcrumbPage>
                </BreadcrumbItem>
              ),
            )}
          </BreadcrumbList>
        </Breadcrumb>
      </nav>
      <button
        type="button"
        onClick={() => router.back()}
        aria-label={`Kembali dari ${current?.label ?? "halaman ini"}`}
        className="flex size-11 shrink-0 items-center justify-center rounded-full text-[#1E5A36] hover:bg-muted md:hidden"
      >
        <ArrowLeft className="size-5" aria-hidden />
      </button>
    </>
  );
}
