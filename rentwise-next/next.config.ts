import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'img.staticmb.com' },
      { protocol: 'https', hostname: 'cdn.staticmb.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'assets.nobroker.in' },
    ],
  },
};

export default nextConfig;
