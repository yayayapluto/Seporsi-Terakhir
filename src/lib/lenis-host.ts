import type Lenis from "lenis";

/** Satu instance Lenis global; didaftarkan SmoothProvider, dipakai tur/scroll terprogram. */
let host: Lenis | null = null;

export function setLenisHost(lenis: Lenis | null) {
  host = lenis;
}

export function getLenisHost(): Lenis | null {
  return host;
}
