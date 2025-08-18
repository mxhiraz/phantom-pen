import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  reactStrictMode: false,
  eslint: {
    ignoreDuringBuilds: true,
  },
  compiler: {
    removeConsole: true,
  },
};

export default nextConfig;
