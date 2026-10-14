import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  // Native addons (resvg for PNG export, argon2 for PIN hashing) are loaded with Node's require.
  serverExternalPackages: ["@resvg/resvg-js", "@node-rs/argon2"],
  partialPrefetching: true,
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
