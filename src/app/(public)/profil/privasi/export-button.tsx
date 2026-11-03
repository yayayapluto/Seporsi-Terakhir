"use client";

import { Download } from "lucide-react";
import { useState, useTransition } from "react";
import { SieraAlert } from "@/components/siera";
import { Spinner } from "@/components/spinner";
import { Button } from "@/components/ui/button";
import { buildDataExport } from "@/lib/data-export";
import { createClient } from "@/lib/supabase/client";

/** Unduh seluruh data milik pengguna sebagai JSON. Tanpa PII orang lain. */
export function ExportButton({ role }: { role: string }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onExport() {
    setError(null);
    startTransition(async () => {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) throw new Error("Sesi habis. Masuk ulang lalu coba lagi.");
        const { data: profile } = await supabase
          .from("profiles")
          .select("id, email, full_name, role")
          .eq("id", user.id)
          .single();
        if (!profile) throw new Error("Profil tidak ketemu.");
        const { data: orders } = await supabase
          .from("orders")
          .select("id, status, quantity, discount_price_snapshot")
          .eq("student_id", user.id);
        let tenant = null;
        if (role === "tenant") {
          const { data: t } = await supabase
            .from("tenants")
            .select("name, menu_items(name, normal_price)")
            .eq("owner_id", user.id)
            .maybeSingle();
          if (t) {
            tenant = {
              name: t.name as string,
              menus: ((t.menu_items ?? []) as Array<{ name: string; normal_price: number }>).map(
                (m) => ({ name: m.name, normal_price: m.normal_price }),
              ),
            };
          }
        }
        const payload = buildDataExport({
          profile: profile as {
            id: string;
            email: string | null;
            full_name: string | null;
            role: string;
          },
          orders: (orders ?? []) as Array<{
            id: string;
            status: string;
            quantity: number;
            discount_price_snapshot: number;
          }>,
          tenant,
        });
        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "data-saya-seporsi-terakhir.json";
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unduhan gagal. Coba lagi.");
      }
    });
  }

  return (
    <div className="flex flex-col gap-2">
      {error && <SieraAlert variant="error">{error}</SieraAlert>}
      <Button type="button" onClick={onExport} disabled={pending} className="min-h-11 w-full">
        {pending ? (
          <>
            <Spinner />
            Menyiapkan…
          </>
        ) : (
          <>
            <Download className="size-4" aria-hidden />
            Unduh data saya (JSON)
          </>
        )}
      </Button>
    </div>
  );
}
