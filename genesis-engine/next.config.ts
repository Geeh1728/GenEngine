import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 1. Standalone Output
  output: 'standalone',

  // 1.5 Security Headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
          { key: 'Cross-Origin-Embedder-Policy', value: 'require-corp' },
        ],
      },
    ];
  },

  // 2. Disable Strict Mode
  reactStrictMode: false,

  // 2.5 Optimization
  productionBrowserSourceMaps: false,
  typescript: {
    ignoreBuildErrors: true,
  },

  // 3. Security: Obfuscation
  poweredByHeader: false, // Hide Next.js branding

  // 4. Experimental
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },

  // 5. External Packages
  serverExternalPackages: ["@xenova/transformers", "sharp", "pdf-parse"],

  // 6. Webpack Config
  webpack: (config, { isServer }) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "yjs$": require.resolve("yjs"),
      "sharp$": false,
      "onnxruntime-node$": false,
      "canvas": false,
    };
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: require.resolve("path-browserify"),
        crypto: false,
      };
    }
    return config;
  },

  // 7. Image Optimization
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.googleusercontent.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "raw.githubusercontent.com" },
    ],
    unoptimized: true,
  },
};

export default nextConfig;