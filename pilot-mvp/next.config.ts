import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Turbopack configuration (Next.js 16 uses Turbopack by default)
  turbopack: {},
  // Server components can use Node.js packages
  serverExternalPackages: ['selenium-webdriver', 'mongoose', 'mongodb', 'chromedriver', 'mailparser', 'unpdf', 'openai'],
};

export default nextConfig;
