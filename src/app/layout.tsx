import type { Metadata, Viewport } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import type { ReactNode } from "react";
import { AppContent } from "@/components/app-content";
import { AppFooter } from "@/components/app-footer";
import { AppHeaderShell } from "@/components/app-header-shell";
import { BottomNav } from "@/components/bottom-nav";
import { SwRegister } from "@/components/sw-register";
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
  title: { default: "Seporsi Terakhir", template: "%s · Seporsi Terakhir" },
  description:
    "Selamatkan seporsi terakhir hari ini: makanan enak harga miring, kurangi sampah makanan kampus.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Seporsi" },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#2E7D4F",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="id"
      data-scroll-behavior="smooth"
      className={`${jakarta.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <SwRegister />
        <AppHeaderShell />
        <div className="flex w-full flex-1">
          <BottomNav />
          <AppContent>{children}</AppContent>
        </div>
        <AppFooter />
      </body>
    </html>
  );
}
