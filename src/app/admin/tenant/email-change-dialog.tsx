"use client";

import { Info } from "lucide-react";
import { useState } from "react";
import { FormSheet } from "@/components/form-sheet";
import { Spinner } from "@/components/spinner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toast";
import { changeTenantEmail } from "../actions";
import type { ListedTenant } from "./listed-list";

/** Dialog ubah email owner tenant: dialog tengah (desktop), bottom sheet (mobile). */
export function EmailChangeDialog({
  tenant,
  onClose,
  onChanged,
}: {
  tenant: ListedTenant | null;
  onClose: () => void;
  onChanged: (tenantId: string, newEmail: string) => void;
}) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!tenant) return;
    setSaving(true);
    setError(null);
    const res = await changeTenantEmail(tenant.id, email);
    setSaving(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    toast.add({ type: "success", title: "Email tenant diperbarui" });
    onChanged(tenant.id, email.trim().toLowerCase());
    onClose();
  }

  return (
    <FormSheet
      open={tenant != null}
      onOpenChange={(open) => {
        if (!open) {
          setEmail("");
          setError(null);
          onClose();
        }
      }}
      title="Ubah email tenant"
    >
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          void save();
        }}
      >
        {tenant && (
          <div className="flex flex-col gap-1">
            <p className="text-sm font-bold text-[#1C2826]">{tenant.name}</p>
            <p className="break-words text-[13px] text-[#64746B]">
              Email saat ini: {tenant.ownerEmail}
            </p>
          </div>
        )}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email-baru">Email baru</Label>
          <Input
            id="email-baru"
            type="email"
            autoComplete="off"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (error) setError(null);
            }}
            disabled={saving}
            className="h-12 text-base"
            aria-invalid={error ? true : undefined}
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <p className="flex items-start gap-2 rounded-xl bg-[#fdf0d5] px-3 py-2 text-[#7a4a00]">
          <Info className="size-[18px] shrink-0" aria-hidden />
          <span className="text-[13px] leading-snug font-semibold">
            Tenant akan keluar dari semua perangkat dan harus login dengan email baru.
          </span>
        </p>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            className="w-full sm:w-auto"
            disabled={saving}
            onClick={() => {
              setEmail("");
              setError(null);
              onClose();
            }}
          >
            Batal
          </Button>
          <Button
            type="submit"
            className="w-full sm:w-auto"
            disabled={saving || email.trim() === ""}
          >
            {saving ? (
              <>
                <Spinner />
                Menyimpan…
              </>
            ) : (
              "Simpan"
            )}
          </Button>
        </div>
      </form>
    </FormSheet>
  );
}
