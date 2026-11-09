import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/menu-images/**",
      },
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/avatars/**",
      },
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/tenant-logos/**",
      },
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/menu-photos/**",
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
