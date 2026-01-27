import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 1. Standalone Output for optimized Vercel deployment
  output: 'standalone',

  // 2. Disable Strict Mode to prevent double-render bugs in 3D
  reactStrictMode: false,

  // 3. Experimental Features
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },

  // 4. External Packages
  serverExternalPackages: ["@xenova/transformers", "sharp", "pdf-parse"],

  // 5. Critical Webpack Config for Transformers.js / Genkit / PDF.js
  webpack: (config, { isServer }) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "sharp$": false,
      "onnxruntime-node$": false,
      "canvas": false, // for pdfjs-dist
    };

    // Optimization for bundle size
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      };
    }

    return config;
  },

  // 6. Image Optimization for Reality Lens
  images: {
    // SECURITY: Restricted to prevent SSRF. 
    remotePatterns: [
      { protocol: "https", hostname: "*.googleusercontent.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "raw.githubusercontent.com" },
    ],
    unoptimized: true, // Fallback for local/arbitrary user data
  },
};

export default nextConfig;
