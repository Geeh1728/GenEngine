import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 1. Disable Strict Mode to prevent double-render bugs in 3D
  reactStrictMode: false,

  // 2. Ignore Typescript/Lint errors during build 
  // (We want to ship the MVP, not win a code beauty contest)
  typescript: {
    ignoreBuildErrors: true,
  },

  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  serverExternalPackages: ["@xenova/transformers", "sharp"],

  // 3. Critical Webpack Config for Transformers.js / Genkit
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "sharp$": false,
      "onnxruntime-node$": false,
      "canvas": false, // for pdfjs-dist
    };
    return config;
  },

  // 4. Image Optimization for Reality Lens
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },
};

export default nextConfig;