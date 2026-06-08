/** @type {import('next').NextConfig} */
const nextConfig = {
  // Use Turbopack (default in Next 16)
  // NOTE: Removed __dirname - it's not valid in ES modules and not needed for turbopack
  
  // Transpile packages
  transpilePackages: ['maplibre-gl', 'react-map-gl'],
  
  // Environment variables exposed to browser
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || '',
  },
  
  // Images
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'basemaps.cartocdn.com',
      },
    ],
  },
  
  // Headers for CORS
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
