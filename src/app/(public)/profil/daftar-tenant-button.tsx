"use client";

import { useState } from "react";
import { PendaftaranForm } from "@/app/tenant/pendaftaran/pendaftaran-form";
import { FormSheet } from "@/components/form-sheet";
import { Button } from "@/components/ui/button";

export function DaftarTenantButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="mt-3 h-12 w-full rounded-xl text-[15px] font-bold"
      >
        Daftar jadi tenant
      </Button>
      <FormSheet open={open} onOpenChange={setOpen} title="Daftar jadi tenant">
        <PendaftaranForm />
      </FormSheet>
    </>
  );
}
