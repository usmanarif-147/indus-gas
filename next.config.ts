import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Lets a temporary ngrok URL use Next.js development resources during phone testing.
  allowedDevOrigins: ["*.ngrok-free.app", "*.ngrok-free.dev"]
};

export default nextConfig;
