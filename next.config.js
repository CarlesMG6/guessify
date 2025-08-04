/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Disable experimental features that might cause issues
    ppr: false,
  },
  images: {
    domains: ['i.scdn.co', 'via.placeholder.com'],
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Fix for undici module in client-side builds
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
        assert: false,
        os: false,
        path: false,
      };
    }
    
    // Ignore undici in client builds
    config.externals = config.externals || [];
    config.externals.push('undici');
    
    return config;
  },
}

module.exports = nextConfig
