const STATUS_LABEL: Record<string, string> = {
  reserved: "Menunggu pickup",
  picked_up: "Selesai",
  cancelled: "Dibatalkan",
};

const STATUS_CLASS: Record<string, string> = {
  reserved: "bg-secondary text-secondary-foreground border-secondary",
  picked_up: "bg-primary/10 text-primary border-primary/30",
  cancelled: "bg-muted text-muted-foreground border-border",
};

export function OrderStatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${STATUS_CLASS[status] ?? STATUS_CLASS.cancelled}`}
    >
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}
