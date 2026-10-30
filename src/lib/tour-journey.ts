import { STALE_AFTER_MS } from "@/lib/tour-progress";

/**
 * Rantai onboarding student: beranda -> katalog -> pesanan -> profil.
 *
 * URL profesional: satu param cantik hanya di pintu masuk (?panduan=rantai),
 * halaman rantai bersih tanpa param. Status rantai disimpan di localStorage
 * (bukan URL), kedaluwarsa ikut STALE_AFTER_MS.
 * Legacy ?tour=journey / ?mode=onboarding&chaining=true tetap dikenali.
 */

const JOURNEY_CHAIN: Record<string, string> = {
  "/beranda": "/katalog",
  "/katalog": "/pesanan",
  "/pesanan": "/profil",
};

const CHAIN_LABELS: Record<string, string> = {
  "/beranda": "Bagian 1 dari 4 · Beranda",
  "/katalog": "Bagian 2 dari 4 · Katalog",
  "/pesanan": "Bagian 3 dari 4 · Pesanan",
  "/profil": "Bagian 4 dari 4 · Akun",
};

const CHAIN_KEY = "seporsi-tour-chain";

export function parseTourParams(sp: {
  mode?: string;
  tour?: string;
  panduan?: string;
  chaining?: string;
}): {
  forced: boolean;
  journey: boolean;
} {
  const legacy = sp.tour === "journey" || sp.chaining === "true";
  const journey = sp.panduan === "rantai" || legacy;
  const forced = sp.mode === "onboarding" || sp.panduan != null || legacy;
  return { forced, journey };
}

/** Halaman berikutnya dalam rantai (URL bersih), atau null bila di luar / ujung. */
export function getJourneyNext(pathname: string): string | null {
  return JOURNEY_CHAIN[pathname] ?? null;
}

/** Label progres rantai per halaman, atau undefined di luar rantai. */
export function getChainLabel(pathname: string): string | undefined {
  return CHAIN_LABELS[pathname];
}

/**
 * Pintu masuk rantai otomatis: new user (belum pernah pesan) yang membuka
 * beranda lewat URL bersih (tanpa param tur).
 */
export function shouldAutoChain(showOnboard: boolean, hasTourParams: boolean): boolean {
  return showOnboard && !hasTourParams;
}

/** Tandai rantai sedang berjalan (timestamp, kedaluwarsa ikut progres). */
export function setChainActive(on: boolean): void {
  try {
    if (on) localStorage.setItem(CHAIN_KEY, String(Date.now()));
    else localStorage.removeItem(CHAIN_KEY);
  } catch {
    /* abaikan */
  }
}

/** True bila rantai aktif dan belum kedaluwarsa. */
export function isChainActive(): boolean {
  try {
    const raw = localStorage.getItem(CHAIN_KEY);
    if (!raw) return false;
    const age = Date.now() - Number(raw);
    if (!Number.isFinite(age) || age < 0 || age > STALE_AFTER_MS) {
      localStorage.removeItem(CHAIN_KEY);
      return false;
    }
    return true;
  } catch {
    return false;
  }
}
