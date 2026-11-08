import type { ReactNode } from "react";
import { SmoothScrollProvider } from "@/components/landing/motion/smooth-scroll-provider";

/** Landing page: standalone, no AppShell/AppHeader. Lenis + GSAP hanya di sini. */
export default function LandingLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <script src="/js-anim.js" />
      <SmoothScrollProvider>{children}</SmoothScrollProvider>
    </>
  );
}
