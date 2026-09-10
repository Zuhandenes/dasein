import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Проект лежит в подпапке монорепо — фиксируем корень трассировки файлов.
  outputFileTracingRoot: path.join(__dirname),
};

export default nextConfig;
