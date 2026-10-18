import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Las migraciones SQL viajan con el servidor para poder crear las tablas al arrancar.
  outputFileTracingIncludes: {
    "/*": ["./drizzle/**/*"],
    "/**": ["./drizzle/**/*"],
  },
  experimental: {
    serverActions: { bodySizeLimit: "4mb" },
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
