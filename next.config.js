/** @type {import('next').NextConfig} */
const nextConfig = {
  // Faster refresh
  reactStrictMode: false,
  
  // Optimize images
  images: {
    unoptimized: true,
  },
  
  // Disable source maps in dev for speed
  productionBrowserSourceMaps: false,
};

module.exports = nextConfig;
