import type { ReactNode } from "react";
import { SmoothScrollProvider } from "@/components/landing/motion/smooth-scroll-provider";

/** Landing page: standalone, no AppShell/AppHeader. Lenis + GSAP hanya di sini. */
export default function LandingLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {/* biome-ignore lint/security/noDangerouslySetInnerHtml: script statis milik kami, tanpa input user */}
      <script
        dangerouslySetInnerHTML={{
          __html: `if(!matchMedia('(prefers-reduced-motion: reduce)').matches){document.documentElement.classList.add('js-anim')}`,
        }}
      />
      <SmoothScrollProvider>{children}</SmoothScrollProvider>
    </>
  );
}
