import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* foto hero lokal: /images/foto_kantin.webp, tanpa remote host */
  allowedDevOrigins: ["seporsi-terakhir.my.id"],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
