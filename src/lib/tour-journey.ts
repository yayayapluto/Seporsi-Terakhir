/**
 * Rantai onboarding student: beranda -> katalog -> pesanan -> profil.
 *
 * URL rapi satu gaya: ?panduan=rantai&langkah=N (N = indeks langkah terakhir).
 * Pintu masuk: banner new-user, auto-chain new-user, tautan Panduan di Akun.
 * Legacy ?tour=journey / ?mode=onboarding&chaining=true tetap dikenali.
 */

const JOURNEY_CHAIN: Record<string, string> = {
  "/beranda": "/katalog?panduan=rantai&langkah=0",
  "/katalog": "/pesanan?panduan=rantai&langkah=0",
  "/pesanan": "/profil?panduan=rantai&langkah=0",
};

export function parseTourParams(sp: {
  mode?: string;
  tour?: string;
  panduan?: string;
  chaining?: string;
  langkah?: string;
}): {
  forced: boolean;
  journey: boolean;
  entryStep: number | null;
} {
  const journey = sp.panduan === "rantai" || sp.tour === "journey" || sp.chaining === "true";
  const forced = sp.mode === "onboarding" || sp.panduan != null || journey;
  const n = sp.langkah == null ? Number.NaN : Number.parseInt(sp.langkah, 10);
  return {
    forced,
    journey,
    entryStep: Number.isInteger(n) && (n as number) >= 0 ? (n as number) : null,
  };
}

/** Halaman berikutnya dalam rantai, atau null bila di luar rantai / sudah ujung. */
export function getJourneyNext(pathname: string): string | null {
  return JOURNEY_CHAIN[pathname] ?? null;
}

/**
 * Pintu masuk rantai otomatis: new user (belum pernah pesan) yang membuka
 * beranda lewat URL bersih (tanpa param tur).
 */
export function shouldAutoChain(showOnboard: boolean, hasTourParams: boolean): boolean {
  return showOnboard && !hasTourParams;
}
