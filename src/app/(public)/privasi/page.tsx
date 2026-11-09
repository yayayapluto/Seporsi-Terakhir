import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, LegalSection } from "@/components/legal-page";
import { ROUTES } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Kebijakan Privasi",
  description:
    "Kebijakan Privasi Seporsi Terakhir: data apa yang dikumpulkan saat masuk dengan Google, cara pakainya, dan hak kamu atas data tersebut.",
};

const CONTACT_EMAIL = "mfarrasashshiddiqi@gmail.com";

export default function PrivasiPage() {
  return (
    <LegalPage
      title="Kebijakan Privasi"
      updated="9 November 2026"
      intro="Kebijakan ini menjelaskan data apa yang dikumpulkan Seporsi Terakhir (seporsi-terakhir.my.id), cara kami memakainya, dan hak kamu atas data tersebut."
    >
      <LegalSection id="ruang-lingkup" title="Ruang lingkup">
        <p>
          Kebijakan ini berlaku untuk situs dan aplikasi Seporsi Terakhir, platform yang
          mempertemukan tenant kantin kampus dengan mahasiswa untuk menjual sisa makanan layak makan
          dengan harga diskon. Dengan masuk dan memakai layanan, kamu menyetujui praktik yang
          dijelaskan di sini.
        </p>
      </LegalSection>

      <LegalSection id="data-yang-dikumpulkan" title="Data yang kami kumpulkan">
        <p>Kami hanya mengumpulkan data yang diperlukan untuk menjalankan layanan:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>Data akun Google.</strong> Saat kamu masuk dengan Google, kami menerima nama,
            alamat email, dan foto profil bila tersedia. Kami tidak pernah menerima atau menyimpan
            kata sandi Google-mu.
          </li>
          <li>
            <strong>Data aktivitas.</strong> Pesanan, porsi yang dipesan, waktu pengambilan, peran
            akun (mahasiswa, tenant, atau admin), serta data kantin bila kamu terdaftar sebagai
            tenant.
          </li>
          <li>
            <strong>Data teknis.</strong> Catatan akses, jenis perangkat dan peramban, serta alamat
            IP yang dipakai untuk keamanan dan perbaikan layanan.
          </li>
          <li>
            <strong>Data pembayaran tidak kami proses.</strong> Pembayaran selalu dilakukan di gerai
            (tunai atau QRIS) dan tidak dicatat oleh sistem sebagai data transaksi pembayaran.
          </li>
        </ul>
      </LegalSection>

      <LegalSection id="penggunaan" title="Cara kami menggunakan data">
        <ul className="list-disc space-y-1 pl-5">
          <li>
            Menampilkan katalog, memproses pesanan, menerbitkan QR pengambilan, dan mencatat dampak.
          </li>
          <li>Menjaga keamanan akun serta mencegah penyalahgunaan dan pesanan palsu.</li>
          <li>Mengirim informasi penting terkait akun atau perubahan layanan.</li>
          <li>
            Menyusun statistik dampak dalam bentuk agregat (misalnya jumlah porsi terselamatkan)
            tanpa menampilkan identitas pribadi.
          </li>
        </ul>
        <p>
          Kami tidak menjual data pribadi dan tidak memakainya untuk iklan pihak ketiga. Penggunaan
          informasi yang diterima dari Google API mematuhi Google API Services User Data Policy,
          termasuk persyaratan Limited Use.
        </p>
      </LegalSection>

      <LegalSection id="pihak-ketiga" title="Berbagi data dan pihak ketiga">
        <p>
          Data dapat diproses oleh penyedia infrastruktur yang kami gunakan untuk menjalankan
          layanan: Supabase (basis data dan autentikasi), Google (masuk dengan Google), dan
          Cloudflare (hosting dan jaringan). Mereka hanya memproses data untuk menyediakan layanan
          tersebut. Kami juga dapat mengungkapkan data bila diwajibkan hukum yang berlaku.
        </p>
      </LegalSection>

      <LegalSection id="cookie" title="Cookie dan penyimpanan lokal">
        <p>
          Kami memakai cookie sesi untuk menjaga status masuk dan penyimpanan lokal peramban untuk
          preferensi seperti status tur dan cache luring. Kamu dapat menghapus cookie dan data situs
          lewat pengaturan peramban, tetapi sebagian fitur mungkin tidak berjalan tanpa keduanya.
        </p>
      </LegalSection>

      <LegalSection id="retensi" title="Penyimpanan dan retensi">
        <p>
          Data disimpan selama akunmu aktif atau selama diperlukan untuk menjalankan layanan dan
          memenuhi kewajiban hukum. Bila kamu meminta penghapusan akun, data pribadi akan dihapus
          atau dianonimkan, kecuali data yang wajib disimpan menurut hukum.
        </p>
      </LegalSection>

      <LegalSection id="hak-kamu" title="Hak kamu">
        <ul className="list-disc space-y-1 pl-5">
          <li>
            Mengakses dan mengunduh data akunmu lewat halaman Privasi &amp; Data setelah masuk.
          </li>
          <li>Meminta perbaikan data yang tidak akurat.</li>
          <li>Meminta penghapusan akun dan data pribadi.</li>
          <li>Menarik persetujuan dan berhenti memakai layanan kapan saja.</li>
        </ul>
        <p>
          Permintaan dapat dikirim ke{" "}
          <a
            className="font-semibold text-primary underline underline-offset-2"
            href={`mailto:${CONTACT_EMAIL}`}
          >
            {CONTACT_EMAIL}
          </a>
          . Kami menanggapi dalam waktu yang wajar.
        </p>
      </LegalSection>

      <LegalSection id="keamanan" title="Keamanan">
        <p>
          Data dikirim lewat koneksi terenkripsi (HTTPS) dan akses ke basis data dibatasi dengan
          kontrol tingkat baris. Tidak ada sistem yang sepenuhnya bebas risiko, tetapi kami berupaya
          menjaga data dengan praktik keamanan yang wajar.
        </p>
      </LegalSection>

      <LegalSection id="anak" title="Anak-anak">
        <p>
          Layanan ini ditujukan untuk mahasiswa dan staf kampus. Kami tidak dengan sengaja
          mengumpulkan data pribadi anak di bawah 18 tahun tanpa izin orang tua atau wali.
        </p>
      </LegalSection>

      <LegalSection id="perubahan" title="Perubahan kebijakan">
        <p>
          Kebijakan ini dapat diperbarui sewaktu-waktu. Perubahan penting akan diumumkan di layanan.
          Tanggal pembaruan terakhir selalu tercantum di bagian atas halaman ini.
        </p>
      </LegalSection>

      <LegalSection id="kontak" title="Kontak">
        <p>
          Pertanyaan tentang privasi dapat dikirim ke{" "}
          <a
            className="font-semibold text-primary underline underline-offset-2"
            href={`mailto:${CONTACT_EMAIL}`}
          >
            {CONTACT_EMAIL}
          </a>
          . Lihat juga{" "}
          <Link
            className="font-semibold text-primary underline underline-offset-2"
            href={ROUTES.ketentuan}
          >
            Ketentuan Layanan
          </Link>
          .
        </p>
      </LegalSection>
    </LegalPage>
  );
}
