/**
 * Rantai onboarding student: beranda -> katalog -> pesanan -> profil.
 * Journey aktif bila URL membawa ?tour=journey; replay tunggal via ?mode=onboarding.
 */

const JOURNEY_CHAIN: Record<string, string> = {
  "/beranda": "/katalog?tour=journey",
  "/katalog": "/pesanan?tour=journey",
  "/pesanan": "/profil?tour=journey",
};

export function parseTourParams(sp: { mode?: string; tour?: string }): {
  forced: boolean;
  journey: boolean;
} {
  const journey = sp.tour === "journey";
  return { forced: sp.mode === "onboarding" || journey, journey };
}

/** Halaman berikutnya dalam journey, atau null bila di luar rantai / sudah ujung. */
export function getJourneyNext(pathname: string): string | null {
  return JOURNEY_CHAIN[pathname] ?? null;
}
