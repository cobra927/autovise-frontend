/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    domains: ['example.com'], // Add any external domains here if you use images from external sources
  },
};

export default nextConfig;
