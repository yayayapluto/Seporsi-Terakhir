import type { ReactNode } from "react";

/** Shared mobile page wrapper: max width, padding, bottom safe-area, no truncation. */
export function MobilePage({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={[
        "min-h-dvh w-full max-w-[430px] px-5 pb-[calc(5.5rem+env(safe-area-inset-bottom))] max-md:min-h-0 max-md:h-auto max-md:flex-none",
        "flex flex-col gap-6",
        className ?? "",
      ].join(" ")}
    >
      {children}
    </div>
  );
}
