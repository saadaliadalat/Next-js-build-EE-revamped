/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  eslint: {
    ignoreDuringBuilds: true,
  },

  images: {
    unoptimized: false, // use Next.js optimization
    domains: ['gohbmlpmophyvmggdgrj.supabase.co'], // your Supabase project domain
  },

  experimental: {
    serverActions: true,
  },
};

module.exports = nextConfig;
