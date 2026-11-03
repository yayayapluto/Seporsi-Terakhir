"use client";

import { useState, useTransition } from "react";
import { SieraAlert } from "@/components/siera";
import { Spinner } from "@/components/spinner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveTenantProfile } from "./actions";

export function TenantProfileForm({
  initialName,
  initialLocation,
}: {
  initialName: string;
  initialLocation: string;
}) {
  const [name, setName] = useState(initialName);
  const [location, setLocation] = useState(initialLocation);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const res = await saveTenantProfile({ name, locationNote: location });
      if (!res.ok) setError(res.error);
      else setSaved(true);
    });
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      {error && <SieraAlert variant="error">{error}</SieraAlert>}
      {saved && (
        <SieraAlert variant="success">
          Tersimpan. Nama dan lokasi gerai sudah diperbarui.
        </SieraAlert>
      )}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="tenant-name">Nama gerai</Label>
        <Input
          id="tenant-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={80}
          required
          className="min-h-11"
          autoComplete="organization"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="tenant-location">Lokasi di kampus</Label>
        <Input
          id="tenant-location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          maxLength={200}
          placeholder="cth. Kantin Gedung A lantai 1"
          className="min-h-11"
          autoComplete="off"
        />
      </div>
      <Button type="submit" disabled={pending} className="min-h-11 w-full">
        {pending ? (
          <>
            <Spinner />
            Menyimpan…
          </>
        ) : (
          "Simpan profil kantin"
        )}
      </Button>
    </form>
  );
}
