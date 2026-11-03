"use client";

import { useState } from "react";
import { FormSheet } from "@/components/form-sheet";
import { Button } from "@/components/ui/button";
import { BantuanForm } from "./bantuan-form";

/** Tombol buka sheet tulis laporan dari halaman Bantuan. */
export function LaporButton({ userEmail }: { userEmail: string | null }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button type="button" className="min-h-11 w-full" onClick={() => setOpen(true)}>
        Tulis laporan
      </Button>
      <FormSheet open={open} onOpenChange={setOpen} title="Tulis laporan" desc="Kirim via email admin.">
        <BantuanForm userEmail={userEmail} reportOnly />
      </FormSheet>
    </>
  );
}
