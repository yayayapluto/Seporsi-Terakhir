"use client";

import { useState } from "react";
import { FormSheet } from "@/components/form-sheet";
import { Button } from "@/components/ui/button";
import { SecurityForm } from "./security-form";

/** Tombol buka sheet ubah sandi dari halaman Keamanan. */
export function UbahSandiButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button type="button" className="min-h-11 w-full" onClick={() => setOpen(true)}>
        Ubah sandi
      </Button>
      <FormSheet
        open={open}
        onOpenChange={setOpen}
        title="Ubah sandi"
        desc="Sandi baru minimal 8 karakter."
      >
        <SecurityForm onSuccess={() => setOpen(false)} />
      </FormSheet>
    </>
  );
}
