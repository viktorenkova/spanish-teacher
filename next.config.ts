import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  deploymentId: process.env.DEPLOYMENT_VERSION,
};

export default nextConfig;
