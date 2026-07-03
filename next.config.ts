import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "t3.storageapi.dev" },
      { protocol: "https", hostname: "tradenexabackend-production.up.railway.app" },
      { protocol: "https", hostname: "**.railway.app" },
    ],
  },
};

export default nextConfig;
