"use client";

import { useState, useTransition } from "react";
import { SieraAlert } from "@/components/siera";
import { Spinner } from "@/components/spinner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestPasswordChange } from "./actions";

/** Form ubah sandi saja (dipakai dalam sheet). Keluar global di halaman. */
export function SecurityForm({ onSuccess }: { onSuccess?: () => void }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onPassword(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await requestPasswordChange({ password, confirm });
      if (!res.ok) setError(res.error);
      else {
        setPassword("");
        setConfirm("");
        onSuccess?.();
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      {error && <SieraAlert variant="error">{error}</SieraAlert>}
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
    </div>
  );
}
