import { SiteHeader } from "./site-header";

/** Pembungkus header global: SiteHeader landing + slot header halaman. */
export function AppHeaderShell() {
  return (
    <>
      <SiteHeader />
      <div id="app-header-slot" aria-hidden className="contents" />
    </>
  );
}
