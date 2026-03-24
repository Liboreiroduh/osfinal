import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // Allow cross-origin requests from preview
  allowedDevOrigins: [
    'preview-chat-d1da64d9-0b12-428d-9ace-142815cbdec8.space.z.ai',
    '.space.z.ai',
  ],
};

export default nextConfig;
