import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
        pathname: "/storage/v1/object/public/menu-images/**",
      },
    ],
  },
  allowedDevOrigins: ["dev.seporsi-terakhir.my.id", "seporsi-terakhir.my.id", "localhost:3000"],
};

export default nextConfig;

import("@opennextjs/cloudflare").then((m) => m.initOpenNextCloudflareForDev());
