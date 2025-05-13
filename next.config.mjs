/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    reactRefresh: false,  // Disable React Fast Refresh in development
  },
  images: {
    domains: ['example.com'], // Add any external domains here if you use images from external sources
  },
};

export default nextConfig;
