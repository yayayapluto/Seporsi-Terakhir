const STATUS_LABEL: Record<string, string> = {
  reserved: "Menunggu pickup",
  picked_up: "Selesai",
  cancelled: "Dibatalkan",
};

const STATUS_CLASS: Record<string, string> = {
  reserved: "border-[#DCEBE0] bg-[#DCEBE0] text-[#1E5A36]",
  picked_up: "border-[#E6F4EA] bg-[#E6F4EA] text-[#1E5A36]",
  cancelled: "border-line bg-[#F1F5F2] text-[#64746B]",
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
