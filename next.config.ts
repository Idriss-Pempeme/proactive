import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  cacheComponents: true,
  images: {
    qualities: [75, 100],
  },
};

export default nextConfig;
