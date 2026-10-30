/**
 * Rantai onboarding: beranda -> katalog -> pesanan -> profil.
 * Rantai aktif bila ?mode=onboarding&chaining=true (?tour=journey lama tetap didukung).
 * lastStep = indeks langkah untuk lompat langsung (tanpa intro).
 */

const JOURNEY_CHAIN: Record<string, string> = {
  "/beranda": "/katalog?mode=onboarding&chaining=true&lastStep=0",
  "/katalog": "/pesanan?mode=onboarding&chaining=true&lastStep=0",
  "/pesanan": "/profil?mode=onboarding&chaining=true&lastStep=0",
};

export function parseTourParams(sp: {
  mode?: string;
  tour?: string;
  chaining?: string;
  lastStep?: string;
}): {
  forced: boolean;
  journey: boolean;
  chaining: boolean;
  entryStep: number | null;
} {
  const chaining = sp.chaining === "true";
  const journey = sp.tour === "journey" || (sp.mode === "onboarding" && chaining);
  const n = sp.lastStep == null ? Number.NaN : Number.parseInt(sp.lastStep, 10);
  return {
    forced: sp.mode === "onboarding" || sp.tour === "journey",
    journey,
    chaining,
    entryStep: Number.isInteger(n) && (n as number) >= 0 ? (n as number) : null,
  };
}

/** Halaman berikutnya dalam rantai, atau null bila di luar rantai / sudah ujung. */
export function getJourneyNext(pathname: string): string | null {
  return JOURNEY_CHAIN[pathname] ?? null;
}

/**
 * Pintu masuk rantai otomatis: new user (belum pernah pesan) yang membuka
 * beranda lewat URL bersih (tanpa param tur). Sekali jalan, progres + URL
 * (?mode=onboarding&chaining=true&lastStep=) mengambil alih.
 */
export function shouldAutoChain(showOnboard: boolean, hasTourParams: boolean): boolean {
  return showOnboard && !hasTourParams;
}
