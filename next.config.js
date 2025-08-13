/** @type {import("next").NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: { domains: ["images.unsplash.com", "yjtqkdbkehprbvmzenyp.supabase.co"] },
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
};
module.exports = nextConfig;
