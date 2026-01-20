import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  serverExternalPackages: ["@xenova/transformers", "sharp"],
  webpack: (config) => {
    // Handling aliases for transformers.js
    config.resolve.alias = {
      ...config.resolve.alias,
      "sharp$": false,
      "onnxruntime-node$": false,
      "canvas": false, // for pdfjs-dist
    };
    return config;
  },
};

export default nextConfig;
