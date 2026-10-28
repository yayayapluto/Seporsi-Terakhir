"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

const schema = z.object({
  name: z.string().trim().min(3, "Nama tenant minimal 3 karakter."),
  locationNote: z.string().trim().max(200, "Lokasi maksimal 200 karakter.").optional(),
});

type Values = z.infer<typeof schema>;

export function PendaftaranForm() {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema) });

  async function onSubmit(values: Values) {
    setFormError(null);
    const supabase = createClient();
    const { error } = await supabase.rpc("apply_as_tenant", {
      p_name: values.name,
      p_location_note: values.locationNote?.trim() ? values.locationNote.trim() : null,
    });
    if (error) {
      const msg = error.message.toLowerCase();
      setFormError(
        msg.includes("already applied")
          ? "Kamu sudah mendaftar sebelumnya."
          : "Gagal mendaftar. Coba lagi.",
      );
      return;
    }
    router.push("/tenant/menunggu-persetujuan");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex max-w-md flex-col gap-4">
      {formError && (
        <p
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {formError}
        </p>
      )}
      <div className="flex flex-col gap-1">
        <Label htmlFor="tenant-name" className="font-semibold">
          Nama tenant <span aria-hidden="true">*</span>
        </Label>
        <Input
          id="tenant-name"
          type="text"
          autoComplete="organization"
          required
          {...register("name")}
        />
        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor="tenant-location" className="font-semibold">
          Catatan lokasi <span className="font-normal text-muted-foreground">(opsional)</span>
        </Label>
        <Input
          id="tenant-location"
          type="text"
          placeholder="Misal: dekat gerbang utama, Kantin FEB lantai 2"
          {...register("locationNote")}
        />
        {errors.locationNote && (
          <p className="text-sm text-destructive">{errors.locationNote.message}</p>
        )}
        <p className="text-xs text-muted-foreground">
          Membantu mahasiswa menemukan titik pickup-mu.
        </p>
      </div>
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Mendaftarkan…" : "Kirim pendaftaran"}
      </Button>
      <p className="text-xs text-muted-foreground">
        Setelah disetujui admin, kamu bisa mengunggah porsi sisa dan mengelola menu.
      </p>
    </form>
  );
}
