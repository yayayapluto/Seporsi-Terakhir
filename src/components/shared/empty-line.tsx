/** Baris kosong satu kalimat dalam kotak dashed — tanpa CTA, tanpa judul. */
export function EmptyLine({ children }: { children: string }) {
  return (
    <div className="rounded-[20px] border border-dashed border-line bg-white p-6 text-center">
      <p className="text-sm text-[#64746B]">{children}</p>
    </div>
  );
}
