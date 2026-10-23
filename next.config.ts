import type { NextConfig } from "next";
import { getServerEnv } from "./src/shared/server/env";

// Validate the active scaffold configuration before development or builds.
getServerEnv();

const nextConfig: NextConfig = {
  poweredByHeader: false,
};

export default nextConfig;
