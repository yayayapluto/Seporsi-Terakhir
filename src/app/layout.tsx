import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import type { ReactNode } from "react";
import { BottomNav } from "@/components/bottom-nav";
import { FooterSlot } from "@/components/footer-slot";
import { SiteHeader } from "@/components/site-header";
import { SmoothProvider } from "@/components/smooth-provider";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-heading",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Seporsi Terakhir",
  description:
    "Selamatkan seporsi terakhir hari ini: makanan enak harga miring, kurangi sampah makanan kampus.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="id"
      data-scroll-behavior="smooth"
      className={`${jakarta.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <SiteHeader />
        <div className="flex w-full flex-1 items-stretch md:grid md:grid-cols-[15rem_minmax(0,1fr)]">
          <BottomNav />
          <main className="flex min-w-0 flex-1 flex-col">
            <SmoothProvider>{children}</SmoothProvider>
            <FooterSlot />
          </main>
        </div>
      </body>
    </html>
  );
}
