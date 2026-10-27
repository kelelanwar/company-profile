import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow testing the dev server from a phone/another device on the LAN.
  // Next blocks dev assets for non-localhost origins by default, which leaves
  // every client component (e.g. the AI preview form) without JS.
  allowedDevOrigins: ["192.168.*.*"],
  cacheComponents: true,
  partialPrefetching: true,
  images: {
    // Placeholder photography only. Replace with real project photos in /public/images
    // before launch and delete this remotePattern.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
    ],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
