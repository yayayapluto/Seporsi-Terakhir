"use client";

import { Spinner } from "@/components/spinner";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";

/** Footer dialog konfirmasi destruktif: aksi kiri outline-merah + spinner, batal kanan. */
export function ConfirmDialogFooter({
  confirmLabel,
  busyLabel,
  cancelLabel,
  busy,
  onConfirm,
  onCancel,
  lockCancelWhenBusy = true,
}: {
  confirmLabel: string;
  busyLabel: string;
  cancelLabel: string;
  busy: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  lockCancelWhenBusy?: boolean;
}) {
  return (
    <DialogFooter>
      <Button
        type="button"
        variant="outline"
        className="min-h-11 flex-1 border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
        onClick={onConfirm}
        disabled={busy}
      >
        {busy ? (
          <>
            <Spinner />
            {busyLabel}
          </>
        ) : (
          confirmLabel
        )}
      </Button>
      <Button
        type="button"
        autoFocus
        className="min-h-11 flex-1"
        onClick={onCancel}
        disabled={lockCancelWhenBusy && busy}
      >
        {cancelLabel}
      </Button>
    </DialogFooter>
  );
}
