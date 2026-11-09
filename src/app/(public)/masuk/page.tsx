import type { Metadata } from "next";
import { Suspense } from "react";
import { MasukSkeleton } from "@/components/ui/skeleton-blocks";
import { LoginBody } from "./login-body";

export const metadata: Metadata = { title: "Masuk" };

export const dynamic = "force-static";

export default function MasukPage() {
  return (
    <Suspense fallback={<MasukSkeleton />}>
      <LoginBody />
    </Suspense>
  );
}
