import { useState } from "react";
import { FormSheet } from "@/components/form-sheet";
import { Button } from "@/components/ui/button";

export function ProfilEditButton({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)} className="min-h-11">
        Ubah profil kantin
      </Button>
      <FormSheet open={open} onOpenChange={setOpen} title="Profil kantin">
        {children}
      </FormSheet>
    </>
  );
}

