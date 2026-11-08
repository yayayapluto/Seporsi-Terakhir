"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Fragment } from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "./ui/button";

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
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => router.back()}
        aria-label={`Kembali dari ${current?.label ?? "halaman ini"}`}
        className="size-11 shrink-0 rounded-full text-[#1E5A36] hover:bg-muted md:hidden"
      >
        <ArrowLeft className="size-5" aria-hidden />
      </Button>
      <span className="hidden min-w-0 flex-1 truncate text-base font-bold text-[#1C2826] max-md:block">
        {current?.label?.startsWith("Detail ") ? "Detail pesanan" : current?.label}
      </span>
      <div className="max-md:hidden">
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
      </div>
    </nav>
  );
}
