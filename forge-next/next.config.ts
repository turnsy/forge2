import type { NextConfig } from "next";
import { withEve } from "eve/next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdf-parse", "@napi-rs/canvas"],
};

export default withEve(nextConfig, {
  devServerTimeoutMs: 300_000,
});
