"use client";

import { useState } from "react";
import { FormSheet } from "@/components/form-sheet";
import { Button } from "@/components/ui/button";
import { PendaftaranForm } from "@/app/tenant/pendaftaran/pendaftaran-form";

export function DaftarTenantButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)} className="mt-3 min-h-11 w-full">
        Daftar jadi tenant
      </Button>
      <FormSheet open={open} onOpenChange={setOpen} title="Daftar jadi tenant">
        <PendaftaranForm />
      </FormSheet>
    </>
  );
}
