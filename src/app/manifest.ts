import type { MetadataRoute } from "next";

/** Web app manifest: installable standalone, tema hijau primer. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Seporsi Terakhir",
    short_name: "Seporsi",
    description:
      "Pesan porsi sore dari kantin kampus dengan harga miring. Kamu makan hemat dan makanan layak tetap habis dimakan.",
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: "#2E7D4F",
    lang: "id",
    dir: "ltr",
    categories: ["food", "lifestyle"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
