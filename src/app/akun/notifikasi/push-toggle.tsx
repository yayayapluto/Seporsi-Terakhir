"use client";

import { BellRing } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { SieraCard, SieraTile } from "@/components/siera";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { type PushPermission, permissionLabel, pushPrefKey, readPushPref } from "@/lib/push-prefs";

/** Toggle push browser: minta izin, simpan preferensi, kirim contoh. */
export function PushToggle({ userId }: { userId: string }) {
  const [permission, setPermission] = useState<PushPermission>("default");
  const [enabled, setEnabled] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const key = pushPrefKey(userId);

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setPermission("unsupported");
      return;
    }
    setPermission(Notification.permission);
    setEnabled(readPushPref((k) => localStorage.getItem(k), userId));
    // SW didaftar global via SwRegister; halaman ini hanya pakai yang aktif.
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.ready.catch(() => {
        /* abaikan: contoh pakai jalur halaman */
      });
    }
  }, [userId]);

  const onToggle = useCallback(
    async (on: boolean) => {
      if (!on) {
        try {
          localStorage.setItem(key, "0");
        } catch {
          /* abaikan */
        }
        setEnabled(false);
        return;
      }
      if (!("Notification" in window)) {
        setPermission("unsupported");
        return;
      }
      const res = await Notification.requestPermission();
      setPermission(res);
      if (res === "granted") {
        try {
          localStorage.setItem(key, "1");
        } catch {
          /* abaikan */
        }
        setEnabled(true);
      } else {
        setEnabled(false);
      }
    },
    [key],
  );

  async function sendTest() {
    setNote(null);
    if (!("Notification" in window)) {
      setPermission("unsupported");
      return;
    }
    const current = Notification.permission;
    setPermission(current);
    if (current !== "granted") {
      setNote("Izin masih mati. Nyalakan dulu lewat tombol di atas.");
    }
    const title = "Seporsi Terakhir";
    const body = "Contoh kabar: porsi yang kamu kunci hampir lewat batas ambil.";
    try {
      if ("serviceWorker" in navigator) {
        const reg = await Promise.race([
          navigator.serviceWorker.ready,
          new Promise<never>((_, reject) => setTimeout(() => reject(new Error("timeout")), 4000)),
        ]);
        await reg.showNotification(title, { body, tag: "seporsi-test" });
      } else {
        const n = new Notification(title, { body, tag: "seporsi-test" });
        n.onclick = () => window.focus();
      }
      setNote("Contoh terkirim. Cek bilah notifikasi di perangkatmu.");
    } catch {
      setNote("Contoh gagal tampil. Periksa mode Jangan Ganggu atau izin notifikasi browser.");
    }
  }

  const blocked = permission === "denied" || permission === "unsupported";
  return (
    <SieraCard className="flex flex-col gap-3 p-4">
      <div className="flex min-h-11 items-center gap-3">
        <SieraTile>
          <BellRing className="size-5" aria-hidden />
        </SieraTile>
        <span className="min-w-0 flex-1">
          <span className="block text-[15px] font-semibold">Bunyi kabar pesanan</span>
          <span className="block text-[12px] text-[#64746B]">{permissionLabel(permission)}</span>
        </span>
        <span className="flex min-h-11 min-w-11 shrink-0 items-center justify-center">
          <Switch
            checked={enabled && permission === "granted"}
            onCheckedChange={onToggle}
            disabled={blocked}
            aria-label="Bunyi kabar pesanan"
          />
        </span>
      </div>
      <Button
        type="button"
        variant="outline"
        onClick={sendTest}
        disabled={!enabled || permission !== "granted"}
        className="min-h-11 w-full"
      >
        Kirim contoh notifikasi
      </Button>
      {note && <output className="block text-center text-[13px] text-[#64746B]">{note}</output>}
    </SieraCard>
  );
}
