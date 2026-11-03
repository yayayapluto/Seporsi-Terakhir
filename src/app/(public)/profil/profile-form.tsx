"use client";

import { useState, useTransition } from "react";
import { SieraAlert } from "@/components/siera";
import { Spinner } from "@/components/spinner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveMyProfile } from "./actions";

/** Form edit nama pengguna: pola salin TenantProfileForm. Avatar tetap inisial. */
export function MyProfileForm({ initialName }: { initialName: string }) {
  const [name, setName] = useState(initialName);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const res = await saveMyProfile({ fullName: name });
      if (!res.ok) setError(res.error);
      else setSaved(true);
    });
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      {error && <SieraAlert variant="error">{error}</SieraAlert>}
      {saved && <SieraAlert variant="success">Tersimpan. Namamu sudah diperbarui.</SieraAlert>}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="my-name">Nama tampilan</Label>
        <Input
          id="my-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={80}
          required
          className="min-h-11"
          autoComplete="name"
        />
      </div>
      <p className="text-[12px] leading-relaxed text-[#64746B]">
        Foto profil belum didukung — inisial namamu dipakai sebagai avatar.
      </p>
      <Button type="submit" disabled={pending} className="min-h-11 w-full">
        {pending ? (
          <>
            <Spinner />
            Menyimpan…
          </>
        ) : (
          "Simpan profil"
        )}
      </Button>
    </form>
  );
}
