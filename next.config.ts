import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // Required for Vercel + SQLite (serverless)
  serverExternalPackages: ["@prisma/client", "z-ai-web-dev-sdk"],
};

export default nextConfig;
