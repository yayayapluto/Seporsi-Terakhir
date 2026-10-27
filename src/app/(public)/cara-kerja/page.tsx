import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function CaraKerjaPage() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
      <section className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Cara Kerja</h1>
        <p className="text-muted-foreground">
          Transparan sejak awal: baseline, rumus dampak, SOP keamanan pangan, dan prinsip opt-in.
        </p>
      </section>

      <section>
        <Card>
          <CardHeader>
            <CardTitle>Alur 3 langkah</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 text-sm">
            <p>
              <strong>1. Tenant mengunggah porsi sisa</strong> — menu, jumlah, jam masak wajib
              diisi. Harga diskon disarankan otomatis (45% harga normal, kelipatan Rp500).
            </p>
            <p>
              <strong>2. Mahasiswa memesan & mengambil QR</strong> — kuota berkurang atomik;
              tunjukkan QR saat pengambilan.
            </p>
            <p>
              <strong>3. Bayar di tempat, porsi tercatat</strong> — tunai/QRIS ke tenant, tanpa
              biaya platform. Setiap pengambilan terpindai tercatat sebagai data dampak.
            </p>
          </CardContent>
        </Card>
      </section>

      <section>
        <Card>
          <CardHeader>
            <CardTitle>Rumus dampak</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 text-sm">
            <p>Porsi terselamatkan = jumlah pengambilan terpindai.</p>
            <p>
              Sampah dicegah (kg) = porsi terjual × berat rata-rata per menu (dari penimbangan
              sampel).
            </p>
            <p>Uang hemat = (harga normal − harga diskon) × porsi.</p>
            <p>Pendapatan tambahan tenant = total nilai transaksi porsi yang diambil.</p>
            <p>% sisa terjual = porsi terjual / porsi diunggah.</p>
          </CardContent>
        </Card>
      </section>

      <section>
        <Card>
          <CardHeader>
            <CardTitle>SOP keamanan pangan</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 text-sm">
            <p>
              Hanya makanan matang yang bisa disimpan yang boleh diunggah. Batas jual 2–4 jam
              setelah jam masak (default 3 jam); porsi kedaluwarsa tidak bisa dipesan dan tidak
              tampil. Jam masak selalu terlihat pembeli. Konfirmasi pengambilan setelah kedaluwarsa
              ditolak sistem.
            </p>
          </CardContent>
        </Card>
      </section>

      <section>
        <Card>
          <CardHeader>
            <CardTitle>Prinsip opt-in</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <p>
              Keikutsertaan tenant sukarela dan bisa berhenti kapan saja. Tidak ada keharusan, tidak
              ada penalti. Platform mengenakan biaya nol selama pilot.
            </p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
