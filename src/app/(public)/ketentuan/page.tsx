import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, LegalSection } from "@/components/legal-page";
import { ROUTES } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Ketentuan Layanan",
  description:
    "Ketentuan Layanan Seporsi Terakhir: aturan pemakaian, peran tenant dan mahasiswa, pesanan, pengambilan, serta tanggung jawab masing-masing pihak.",
};

const CONTACT_EMAIL = "mfarrasashshiddiqi@gmail.com";

export default function KetentuanPage() {
  return (
    <LegalPage
      title="Ketentuan Layanan"
      updated="9 November 2026"
      intro="Ketentuan ini mengatur pemakaian Seporsi Terakhir (seporsi-terakhir.my.id). Dengan membuat akun atau memakai layanan, kamu setuju untuk mematuhinya."
    >
      <LegalSection id="layanan" title="Tentang layanan">
        <p>
          Seporsi Terakhir adalah platform yang menghubungkan tenant kantin kampus dengan mahasiswa
          untuk menjual sisa makanan layak makan dengan harga diskon. Sistem tidak memproses
          pembayaran; pembayaran dilakukan langsung di gerai saat pengambilan.
        </p>
      </LegalSection>

      <LegalSection id="akun" title="Kelayakan dan akun">
        <ul className="list-disc space-y-1 pl-5">
          <li>
            Layanan ditujukan untuk mahasiswa dan staf kampus yang memiliki akun Google aktif.
          </li>
          <li>Tenant wajib mendaftar dan disetujui admin sebelum dapat memposting porsi.</li>
          <li>Satu akun untuk satu orang. Kamu bertanggung jawab menjaga akses akun Google-mu.</li>
          <li>Data akun harus benar dan diperbarui bila berubah.</li>
        </ul>
      </LegalSection>

      <LegalSection id="peran-tenant" title="Kewajiban tenant">
        <ul className="list-disc space-y-1 pl-5">
          <li>Hanya memposting makanan yang dimasak dan masih layak makan.</li>
          <li>Mengisi jam masak, jumlah, dan harga diskon dengan benar.</li>
          <li>Mencantumkan bahan dan alergen bila tersedia.</li>
          <li>Bertanggung jawab penuh atas kualitas dan keamanan pangan yang dijual.</li>
          <li>Menyiapkan porsi sesuai pesanan dan melayani pengambilan pada jendela jual.</li>
        </ul>
      </LegalSection>

      <LegalSection id="pesanan" title="Pesanan dan pembayaran">
        <ul className="list-disc space-y-1 pl-5">
          <li>Pesanan mengurangi kuota porsi dan menerbitkan QR pengambilan.</li>
          <li>Tidak ada pembayaran di muka melalui aplikasi. Bayar di gerai saat mengambil.</li>
          <li>
            Porsi hanya dapat dipesan selama jendela jual, yaitu 120 sampai 240 menit setelah jam
            masak.
          </li>
          <li>Pesanan yang tidak diambil sampai jendela jual berakhir dapat dianggap hangus.</li>
          <li>Kuota dan ketersediaan dapat berubah sampai pesanan dikonfirmasi sistem.</li>
        </ul>
      </LegalSection>

      <LegalSection id="pengambilan" title="Pengambilan dan QR">
        <ul className="list-disc space-y-1 pl-5">
          <li>Tunjukkan QR pengambilan kepada tenant saat mengambil porsi.</li>
          <li>Jangan membagikan QR kepada orang lain atau memakainya lebih dari sekali.</li>
          <li>Pengambilan yang berhasil dipindai dicatat sebagai data dampak.</li>
        </ul>
      </LegalSection>

      <LegalSection id="larangan" title="Larangan">
        <ul className="list-disc space-y-1 pl-5">
          <li>Memberikan informasi palsu atau menyalahgunakan sistem pesanan dan QR.</li>
          <li>Mengakses layanan secara tidak sah, mengganggu, atau membebani sistem.</li>
          <li>Memakai layanan untuk kegiatan yang melanggar hukum atau merugikan pihak lain.</li>
          <li>Menjual kembali porsi dengan klaim yang menyesatkan.</li>
        </ul>
      </LegalSection>

      <LegalSection id="kekayaan-intelektual" title="Kekayaan intelektual">
        <p>
          Nama, logo, dan materi Seporsi Terakhir dilindungi hukum. Konten yang diunggah tenant
          tetap milik tenant, dengan izin kepada kami untuk menampilkannya di layanan selama
          diperlukan.
        </p>
      </LegalSection>

      <LegalSection id="penangguhan" title="Penangguhan dan penghentian">
        <p>
          Kami dapat menangguhkan atau menghentikan akses akun yang melanggar ketentuan ini,
          merugikan pengguna lain, atau membahayakan keamanan layanan. Kamu dapat berhenti memakai
          layanan dan meminta penghapusan akun kapan saja.
        </p>
      </LegalSection>

      <LegalSection id="tanggung-jawab" title="Batasan tanggung jawab">
        <p>
          Layanan disediakan sebagaimana adanya pada tahap awal. Kami tidak menjamin ketersediaan
          porsi, kualitas makanan, atau hasil tertentu. Sengketa mengenai kualitas atau keamanan
          pangan diselesaikan langsung antara pembeli dan tenant. Sepanjang diizinkan hukum, kami
          tidak bertanggung jawab atas kerugian tidak langsung yang timbul dari pemakaian layanan.
        </p>
      </LegalSection>

      <LegalSection id="perubahan" title="Perubahan ketentuan">
        <p>
          Ketentuan ini dapat diperbarui sewaktu-waktu. Perubahan penting akan diumumkan di layanan,
          dan tanggal pembaruan terakhir tercantum di bagian atas halaman ini. Pemakaian layanan
          setelah perubahan berarti kamu menyetujui ketentuan yang diperbarui.
        </p>
      </LegalSection>

      <LegalSection id="hukum" title="Hukum yang berlaku">
        <p>
          Ketentuan ini diatur oleh hukum Republik Indonesia. Perselisihan diupayakan diselesaikan
          secara musyawarah terlebih dahulu.
        </p>
      </LegalSection>

      <LegalSection id="kontak" title="Kontak">
        <p>
          Pertanyaan tentang ketentuan ini dapat dikirim ke{" "}
          <a
            className="font-semibold text-primary underline underline-offset-2"
            href={`mailto:${CONTACT_EMAIL}`}
          >
            {CONTACT_EMAIL}
          </a>
          . Lihat juga{" "}
          <Link
            className="font-semibold text-primary underline underline-offset-2"
            href={ROUTES.privasi}
          >
            Kebijakan Privasi
          </Link>
          .
        </p>
      </LegalSection>
    </LegalPage>
  );
}
