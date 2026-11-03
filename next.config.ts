import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/menu-images/**",
      },
    ],
  },
  async redirects() {
    return [{ source: "/cara-kerja", destination: "/#cara-kerja", permanent: true }];
  },
  allowedDevOrigins: [
    "dev.seporsi-terakhir.my.id",
    "re.seporsi-terakhir.my.id",
    "seporsi-terakhir.my.id",
    "localhost:3000",
  ],
};

export default nextConfig;

import("@opennextjs/cloudflare").then((m) => m.initOpenNextCloudflareForDev());
