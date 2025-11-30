/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    typedRoutes: true
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      const externals = config.externals || [];
      const pgPackages = [
        "pg",
        "pg-native",
        "pg-connection-string",
        "pg-pool",
        "pg-protocol",
        "pg-types",
        "pgpass"
      ];
      pgPackages.forEach((pkg) => {
        externals.push({ [pkg]: `commonjs ${pkg}` });
      });
      config.externals = externals;
    }
    return config;
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" }
    ]
  }
};

export default nextConfig;
