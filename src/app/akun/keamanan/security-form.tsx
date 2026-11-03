"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { SieraAlert } from "@/components/siera";
import { Spinner } from "@/components/spinner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestPasswordChange, signOutEverywhere } from "./actions";

/** Dua aksi keamanan: ubah sandi + keluar semua perangkat. */
export function SecurityForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();
  const [signingOut, setSigningOut] = useState(false);

  function onPassword(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const res = await requestPasswordChange({ password, confirm });
      if (!res.ok) setError(res.error);
      else {
        setSaved(true);
        setPassword("");
        setConfirm("");
      }
    });
  }

  function onSignOutEverywhere() {
    if (!window.confirm("Keluar dari semua perangkat termasuk yang ini?")) return;
    setSigningOut(true);
    startTransition(async () => {
      const res = await signOutEverywhere();
      if (!res.ok) {
        setError(res.error);
        setSigningOut(false);
      } else {
        router.push("/masuk");
        router.refresh();
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      {error && <SieraAlert variant="error">{error}</SieraAlert>}
      {saved && <SieraAlert variant="success">Sandi diubah. Gunakan sandi baru saat masuk.</SieraAlert>}
      <form onSubmit={onPassword} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="new-password">Sandi baru</Label>
          <Input
            id="new-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            required
            className="min-h-11"
            autoComplete="new-password"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="confirm-password">Konfirmasi sandi baru</Label>
          <Input
            id="confirm-password"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            minLength={8}
            required
            className="min-h-11"
            autoComplete="new-password"
          />
        </div>
        <Button type="submit" disabled={pending} className="min-h-11 w-full">
          {pending ? (
            <>
              <Spinner />
              Mengubah…
            </>
          ) : (
            "Ubah sandi"
          )}
        </Button>
      </form>
      <span aria-hidden className="block border-t border-dashed border-line" />
      <Button
        type="button"
        variant="destructive"
        onClick={onSignOutEverywhere}
        disabled={signingOut}
        className="min-h-11 w-full"
      >
        {signingOut ? (
          <>
            <Spinner />
            Keluar…
          </>
        ) : (
          "Keluar dari semua perangkat"
        )}
      </Button>
    </div>
  );
}
