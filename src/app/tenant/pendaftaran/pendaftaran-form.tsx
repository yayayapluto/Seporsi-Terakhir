"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
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
  const [alreadyApplied, setAlreadyApplied] = useState(false);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema) });
  const locationLen = (watch("locationNote") ?? "").trim().length;

  async function onSubmit(values: Values) {
    setFormError(null);
    setAlreadyApplied(false);
    const supabase = createClient();
    const { error } = await supabase.rpc("apply_as_tenant", {
      p_name: values.name,
      p_location_note: values.locationNote?.trim() ? values.locationNote.trim() : null,
    });
    if (error) {
      if (error.message.toLowerCase().includes("already applied")) {
        setAlreadyApplied(true);
        setFormError("Kamu sudah mendaftar sebelumnya.");
      } else {
        setFormError("Gagal mendaftar. Coba lagi.");
      }
      return;
    }
    router.push("/tenant/menunggu-persetujuan");
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-5 rounded-lg border border-border bg-card p-5 sm:p-6"
    >
      {formError && (
        <p
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {formError}{" "}
          {alreadyApplied && (
            <Link
              href="/tenant/menunggu-persetujuan"
              className="inline-flex min-h-11 items-center font-semibold underline underline-offset-4"
            >
              Lihat status pendaftaran
            </Link>
          )}
        </p>
      )}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="tenant-name" className="font-semibold">
          Nama tenant <span className="font-normal text-muted-foreground">(wajib)</span>
        </Label>
        <Input
          id="tenant-name"
          type="text"
          autoComplete="organization"
          required
          maxLength={120}
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? "tenant-name-error" : undefined}
          className="h-11 bg-card text-base"
          {...register("name")}
        />
        {errors.name && (
          <p id="tenant-name-error" className="text-sm text-destructive">
            {errors.name.message}
          </p>
        )}
      </div>
      <div className="flex flex-col gap-1.5">
        <div className="flex items-baseline justify-between gap-2">
          <Label htmlFor="tenant-location" className="font-semibold">
            Catatan lokasi <span className="font-normal text-muted-foreground">(opsional)</span>
          </Label>
          <span className="text-xs text-muted-foreground tabular-nums" aria-hidden="true">
            {locationLen}/200
          </span>
        </div>
        <Input
          id="tenant-location"
          type="text"
          placeholder="Misal: dekat gerbang utama, Kantin FEB lantai 2"
          maxLength={200}
          aria-invalid={!!errors.locationNote}
          aria-describedby={errors.locationNote ? "tenant-location-error" : "tenant-location-hint"}
          className="h-11 bg-card text-base"
          {...register("locationNote")}
        />
        {errors.locationNote ? (
          <p id="tenant-location-error" className="text-sm text-destructive">
            {errors.locationNote.message}
          </p>
        ) : (
          <p id="tenant-location-hint" className="text-xs text-muted-foreground">
            Membantu mahasiswa menemukan titik pickup-mu.
          </p>
        )}
      </div>
      <ol className="flex flex-col gap-1 text-sm text-muted-foreground">
        <li>
          <span className="font-semibold text-foreground">1.</span> Isi form ini — sekali kirim, tak
          bisa diubah sendiri.
        </li>
        <li>
          <span className="font-semibold text-foreground">2.</span> Admin meninjau pendaftaranmu.
        </li>
        <li>
          <span className="font-semibold text-foreground">3.</span> Disetujui → langsung posting
          porsi dan kelola menu.
        </li>
      </ol>
      <Button type="submit" disabled={isSubmitting} size="lg" className="min-h-11 w-full">
        {isSubmitting ? "Mengirim…" : "Kirim & tunggu persetujuan"}
      </Button>
      <p className="text-xs text-muted-foreground">Gratis selama pilot kampus.</p>
    </form>
  );
}
