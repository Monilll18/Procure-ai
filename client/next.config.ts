import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Turbopack empty config silences the warning if needed
  turbopack: {},
  experimental: {
    urlImports: ["https://framer.com", "https://framerusercontent.com", "https://events.framer.com"],
  },
};

export default nextConfig;
