/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "via.placeholder.com" },
    ],
  },
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3000"],
    },
    // pg uses native Node modules (fs, net, tls, dns) — keep it server-only
    serverComponentsExternalPackages: [
      "pg",
      "pg-pool",
      "pg-connection-string",
      "pgpass",
      "@prisma/adapter-pg",
      "@prisma/client",
      "@prisma/driver-adapter-utils",
    ],
  },
};

export default nextConfig;
