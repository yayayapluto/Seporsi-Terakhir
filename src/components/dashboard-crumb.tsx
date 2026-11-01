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
import { Button } from "@/components/ui/button";

/** Breadcrumb dasbor: desktop breadcrumb statis, mobile tombol kembali. */
export function DashboardCrumb({ title }: { title: string }) {
  const router = useRouter();
  return (
    <>
      <Breadcrumb className="hidden md:flex" aria-label="Navigasi dasbor">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link href="/" />}>Beranda</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{title}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="w-fit md:hidden"
        onClick={() => router.back()}
      >
        <ArrowLeft className="size-4" aria-hidden />
        Kembali
      </Button>
    </>
  );
}
