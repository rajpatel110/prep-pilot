import type { NextConfig } from "next";
import { getServerEnv } from "./src/shared/server/env";

// Validate the active scaffold configuration before development or builds.
getServerEnv();

const nextConfig: NextConfig = {
  poweredByHeader: false,
  headers() {
    return [
      "/verify-email",
      "/reset-password",
      "/forgot-password",
      "/api/v1/identity/:path*",
    ].map((source) => ({
      source,
      headers: [
        { key: "Referrer-Policy", value: "no-referrer" },
        { key: "X-Robots-Tag", value: "noindex, nofollow" },
        { key: "Cache-Control", value: "no-store" },
      ],
    }));
  },
};

export default nextConfig;
