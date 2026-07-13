import path from "node:path";
import dotenv from "dotenv";
import type { NextConfig } from "next";

// Next.js only auto-loads .env files from this app's own directory, but the
// monorepo's single shared .env lives at the repo root — load it explicitly
// (without overriding any apps/web/.env.local a developer may have set).
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@druksave/shared"],
};

export default nextConfig;
