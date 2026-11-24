import type { NextConfig } from "next";

// Product photos are served from Cloudflare R2. Set IMAGE_HOST to your bucket's
// public hostname (e.g. "media.loomandlapel.in" or "pub-xxxx.r2.dev").
const imageHost = process.env.IMAGE_HOST || "*.r2.dev";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ protocol: "https", hostname: imageHost }],
  },
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
