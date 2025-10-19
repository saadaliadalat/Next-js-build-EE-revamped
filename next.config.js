/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  eslint: {
    ignoreDuringBuilds: true,
  },

  images: {
    unoptimized: false,
    domains: ['gohbmlpmophyvmggdgrj.supabase.co'], // your Supabase domain
  },

  experimental: {
    serverActions: {}, // ✅ fixed syntax for Next.js 15
  },
};

module.exports = nextConfig;
