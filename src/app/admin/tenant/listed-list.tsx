"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { SieraList } from "@/components/siera";
import { Spinner } from "@/components/spinner";
import { Button } from "@/components/ui/button";
import { setTenantListed } from "../actions";

export interface ListedTenant {
  id: string;
  name: string;
  locationNote: string | null;
  isListed: boolean;
}

/** Mitra disetujui + toggle tampil/sembunyi di katalog. */
export function ListedList({ tenants }: { tenants: ListedTenant[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function toggle(t: ListedTenant) {
    setBusyId(t.id);
    setError(null);
    const res = await setTenantListed(t.id, !t.isListed);
    setBusyId(null);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    router.refresh();
  }

  if (tenants.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      {error && (
        <p
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {error}
        </p>
      )}
      <SieraList>
        {tenants.map((t) => (
          <li key={t.id} className="flex items-center gap-3 px-4 py-3">
            <div className="min-w-0 flex-1">
              <h2 className="truncate font-bold leading-snug">{t.name}</h2>
              <p className="text-xs text-muted-foreground">
                {t.locationNote ? `${t.locationNote} • ` : ""}
                {t.isListed ? "Tampil di katalog" : "Disembunyikan dari katalog"}
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              disabled={busyId !== null}
              onClick={() => toggle(t)}
              className="min-h-11 shrink-0"
            >
              {busyId === t.id ? (
                <>
                  <Spinner />
                  Menyimpan…
                </>
              ) : t.isListed ? (
                "Sembunyikan"
              ) : (
                "Tampilkan"
              )}
            </Button>
          </li>
        ))}
      </SieraList>
    </div>
  );
}
