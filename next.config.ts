import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  /* foto hero lokal: /images/foto_kantin.webp, tanpa remote host */
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
