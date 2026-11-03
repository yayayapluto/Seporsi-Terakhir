"use client";

import { useSyncExternalStore } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

function useIsMobile(): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia("(max-width: 767px)");
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    () => window.matchMedia("(max-width: 767px)").matches,
    () => false,
  );
}

/** Form dalam bottom-sheet (mobile) atau dialog center (desktop). */
export function FormSheet({
  open,
  onOpenChange,
  title,
  desc,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  desc?: string;
  children: React.ReactNode;
}) {
  const mobile = useIsMobile();
  if (mobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="bottom"
          className="max-h-[92dvh] overflow-y-auto rounded-t-[20px] px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:max-w-lg"
        >
          <SheetHeader>
            <SheetTitle>{title}</SheetTitle>
            {desc && <SheetDescription>{desc}</SheetDescription>}
          </SheetHeader>
          {children}
        </SheetContent>
      </Sheet>
    );
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {desc && <DialogDescription>{desc}</DialogDescription>}
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}
