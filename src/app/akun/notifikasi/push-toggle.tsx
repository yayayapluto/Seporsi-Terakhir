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
  const key = pushPrefKey(userId);

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setPermission("unsupported");
      return;
    }
    setPermission(Notification.permission);
    setEnabled(readPushPref((k) => localStorage.getItem(k), userId));
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

  function sendTest() {
    try {
      const n = new Notification("Seporsi Terakhir", {
        body: "Contoh kabar: porsi yang kamu kunci hampir kedaluwarsa.",
        tag: "seporsi-test",
      });
      n.onclick = () => window.focus();
    } catch {
      /* abaikan */
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
    </SieraCard>
  );
}
