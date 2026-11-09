"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { SieraAlert, SieraList } from "@/components/siera";
import { Spinner } from "@/components/spinner";
import { Button } from "@/components/ui/button";
import { setTenantListed } from "../actions";
import { EmailChangeDialog } from "./email-change-dialog";

export interface ListedTenant {
  id: string;
  name: string;
  locationNote: string | null;
  isListed: boolean;
  ownerEmail: string;
}

/** Mitra disetujui + toggle tampil/sembunyi di katalog. */
export function ListedList({ tenants }: { tenants: ListedTenant[] }) {
  const router = useRouter();
  const [rows, setRows] = useState<ListedTenant[]>(tenants);
  useEffect(() => setRows(tenants), [tenants]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [emailTarget, setEmailTarget] = useState<ListedTenant | null>(null);

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

  if (rows.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      {error && <SieraAlert variant="error">{error}</SieraAlert>}
      <SieraList>
        {rows.map((t) => (
          <li key={t.id} className="flex items-center gap-3 px-4 py-3">
            <div className="min-w-0 flex-1">
              <h2 className="font-bold leading-snug max-md:whitespace-normal max-md:[overflow-wrap:anywhere]">
                {t.name}
              </h2>
              <p className="break-words text-xs text-muted-foreground">{t.ownerEmail}</p>
              <p className="text-xs text-muted-foreground">
                {t.locationNote ? `${t.locationNote} · ` : ""}
                {t.isListed ? "Tampil di katalog" : "Disembunyikan dari katalog"}
              </p>
            </div>
            <div className="flex shrink-0 flex-col gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={busyId !== null}
                onClick={() => setEmailTarget(t)}
                className="min-h-11"
              >
                Ubah email
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={busyId !== null}
                onClick={() => toggle(t)}
                className="min-h-11"
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
            </div>
          </li>
        ))}
      </SieraList>
      <EmailChangeDialog
        tenant={emailTarget}
        onClose={() => setEmailTarget(null)}
        onChanged={(tenantId, newEmail) =>
          setRows((prev) =>
            prev.map((r) => (r.id === tenantId ? { ...r, ownerEmail: newEmail } : r)),
          )
        }
      />
    </div>
  );
}
