import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // @ts-expect-error Next.js 15 removed eslint property from NextConfig type but it still works at runtime
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
