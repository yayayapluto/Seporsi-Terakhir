"use client";

import { useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const FAQS = [
  {
    q: "Kapan saya bisa ambil porsi?",
    a: "Jendela ambil 16.30–18.30 WIB di hari yang sama. Datang dalam jam itu, tunjukkan QR, bayar tunai di tempat.",
  },
  {
    q: "Bayar di mana?",
    a: "Langsung ke tenant saat ambil (tunai). Tak ada ongkir, tak ada biaya platform.",
  },
  {
    q: "Bagaimana cara batalkan pesanan?",
    a: "Buka halaman Pesanan → detail pesanan → Batalkan. Stok kembali ke katalog otomatis.",
  },
  {
    q: "Bagaimana cara daftar jadi tenant?",
    a: "Buka Profil → Daftar jadi tenant, isi nama gerai dan lokasi. Admin verifikasi, kabar muncul di notifikasi.",
  },
  {
    q: "Bagaimana cara hapus akun saya?",
    a: "Tulis ke admin lewat formulir lapor di bawah dengan kategori “Hapus akun”. Penghapusan permanen dan tidak bisa dibatalkan.",
  },
] as const;

/** FAQ + formulir lapor via email admin (tanpa tabel baru). */
export function BantuanForm({ userEmail }: { userEmail: string | null }) {
  const [kategori, setKategori] = useState("Masalah pesanan");
  const [pesan, setPesan] = useState("");

  const mailto = `mailto:admin@seporsi-terakhir.id?subject=${encodeURIComponent(`[Lapor] ${kategori}`)}&body=${encodeURIComponent(`Dari: ${userEmail ?? "-"}\nKategori: ${kategori}\n\n${pesan}`)}`;

  return (
    <div className="flex flex-col gap-4">
      <Accordion defaultValue={FAQS[0] ? [`faq-0`] : []}>
        {FAQS.map((f, i) => (
          <AccordionItem key={f.q} value={`faq-${i}`}>
            <AccordionTrigger className="text-left font-semibold">{f.q}</AccordionTrigger>
            <AccordionContent>{f.a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
      <form
        className="flex flex-col gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          window.location.href = mailto;
        }}
      >
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="lapor-kategori">Kategori</Label>
          <Select value={kategori} onValueChange={(v) => v != null && setKategori(String(v))}>
            <SelectTrigger id="lapor-kategori" className="min-h-11">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {["Masalah pesanan", "Daftar tenant", "Hapus akun", "Lainnya"].map((k) => (
                <SelectItem key={k} value={k}>
                  {k}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="lapor-pesan">Pesan</Label>
          <Textarea
            id="lapor-pesan"
            value={pesan}
            onChange={(e) => setPesan(e.target.value)}
            required
            minLength={10}
            maxLength={1000}
            rows={4}
            placeholder="Tulis kronologi singkat: kapan, pesanan apa, apa yang terjadi…"
          />
        </div>
        <Button type="submit" className="min-h-11 w-full">
          Kirim laporan via email
        </Button>
      </form>
    </div>
  );
}
