"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Spinner } from "@/components/spinner";
import { Button } from "@/components/ui/button";
import { approveTenant } from "../actions";
import type { PendingTenant } from "./page";

/** Daftar pendaftar tenant + panel inline persetujuan (confirm step). */
export function ApproveList({ tenants }: { tenants: PendingTenant[] }) {
  const router = useRouter();
  const [openId, setOpenId] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function approve(id: string) {
    setConfirming(true);
    setError(null);
    const result = await approveTenant(id);
    setConfirming(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setOpenId(null);
    router.refresh();
  }

  if (tenants.length === 0) {
    return (
      <div className="border-b py-10 text-center">
        <p className="font-semibold">Tidak ada pendaftaran menunggu</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Semua pendaftaran mitra sudah diproses.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <p
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {error}
        </p>
      )}
      <ul className="divide-y divide-border border-b">
        {tenants.map((t) => {
          const open = openId === t.id;
          return (
            <li key={t.id} className="py-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
                <div className="min-w-0">
                  <h2 className="font-bold leading-snug">{t.name}</h2>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {t.locationNote ? `${t.locationNote} • ` : ""}
                    Mendaftar{" "}
                    {new Date(t.createdAt).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <div className="shrink-0">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setOpenId(open ? null : t.id)}
                    aria-expanded={open}
                  >
                    {open ? "Tutup" : "Tinjau"}
                  </Button>
                </div>
              </div>
              {open && (
                <div className="mt-3 rounded-xl border bg-card p-4">
                  <dl className="grid gap-2 text-sm sm:grid-cols-2">
                    <div>
                      <dt className="text-xs font-semibold text-muted-foreground">Nama gerai</dt>
                      <dd className="font-semibold">{t.name}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold text-muted-foreground">Lokasi</dt>
                      <dd>{t.locationNote ?? "Belum dicantumkan"}</dd>
                    </div>
                  </dl>
                  <p className="mt-3 text-sm text-muted-foreground">
                    Menyetujui akan mengaktifkan akun tenant ini dan menampilkan gerainya di
                    katalog. Tindakan ini berlaku langsung.
                  </p>
                  <div className="mt-3 flex gap-2">
                    <Button type="button" disabled={confirming} onClick={() => approve(t.id)}>
                      {confirming ? (
                        <>
                          <Spinner />
                          Menyetujui…
                        </>
                      ) : (
                        "Setujui tenant"
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setOpenId(null)}
                      disabled={confirming}
                    >
                      Batal
                    </Button>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
