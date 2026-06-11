import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  outputFileTracingIncludes: {
    "*": ["./node_modules/@swc/helpers/**/*"],
  },
};

export default nextConfig;
