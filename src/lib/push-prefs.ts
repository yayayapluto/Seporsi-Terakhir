/** Preferensi toggle push browser — tanpa PII, tanpa server. */

export function pushPrefKey(userId: string): string {
  return `notif-push:${userId}`;
}

export function readPushPref(get: (key: string) => string | null, userId: string): boolean {
  try {
    return get(pushPrefKey(userId)) === "1";
  } catch {
    return false;
  }
}

export type PushPermission = "granted" | "denied" | "default" | "unsupported";

export function permissionLabel(p: PushPermission): string {
  switch (p) {
    case "granted":
      return "Aktif — kabar pesanan bunyi di perangkat ini.";
    case "denied":
      return "Diblokir browser — izinkan manual lewat pengaturan situs.";
    case "default":
      return "Belum diminta — nyalakan toggle untuk meminta izin.";
    case "unsupported":
      return "Browser ini tidak mendukung notifikasi.";
  }
}
