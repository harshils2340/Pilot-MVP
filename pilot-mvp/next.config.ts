import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Turbopack configuration (Next.js 16 uses Turbopack by default)
  turbopack: {},
  // Server components can use Node.js packages
  serverExternalPackages: ['selenium-webdriver', 'mongoose', 'mongodb', 'chromedriver', 'mailparser', 'unpdf', 'openai'],

  // Performance optimizations for faster startup
  experimental: {
    // Faster builds
    optimizePackageImports: ['lucide-react', '@radix-ui/react-accordion', '@radix-ui/react-dialog'],
  },

  // Compiler optimizations (swcMinify is default in Next.js 16, removed)

  // Reduce initial compilation
  typescript: {
    // Don't block on type errors during dev (faster startup)
    ignoreBuildErrors: false,
  },

  // Faster page loads
  poweredByHeader: false,

  // Optimize images
  images: {
    formats: ['image/avif', 'image/webp'],
  },
};

export default nextConfig;
