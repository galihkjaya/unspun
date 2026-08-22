import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // In dev, /api/* is served by the local FastAPI process (npm run api).
  // In production, vercel.json routes /api/* to the Python function instead.
  async rewrites() {
    return process.env.NODE_ENV === "development"
      ? [{ source: "/api/:path*", destination: "http://127.0.0.1:8000/api/:path*" }]
      : [];
  },
};

export default nextConfig;
