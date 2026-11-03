"use client";

import { useState } from "react";
import { FormSheet } from "@/components/form-sheet";
import { Button } from "@/components/ui/button";

/**
 * PortionForm sukses via router.push("/tenant")+router.refresh() tanpa callback —
 * sheet TIDAK auto-tutup; user tutup manual; data segar via revalidatePath actions.
 * Isi sheet (server component) dioper parent server via prop `sheet`.
 */
export function TambahPorsiButton({ sheet }: { sheet: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        type="button"
        data-tour="tambah-porsi"
        onClick={() => setOpen(true)}
        className="min-h-11 w-full text-[15px]"
      >
        + Tambah porsi
      </Button>
      {open && (
        <FormSheet
          open={open}
          onOpenChange={setOpen}
          title="Tambah porsi"
          desc="Unggah sisa masakan hari ini."
        >
          {sheet}
        </FormSheet>
      )}
    </>
  );
}

export function UbahPorsiButton({
  portionId,
  sheet,
}: {
  portionId: string;
  sheet: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        type="button"
        variant="outline"
        data-tour={`ubah-porsi-${portionId}`}
        onClick={() => setOpen(true)}
        className="min-h-11"
      >
        Edit cepat
      </Button>
      {open && (
        <FormSheet open={open} onOpenChange={setOpen} title="Edit porsi">
          {sheet}
        </FormSheet>
      )}
    </>
  );
}
