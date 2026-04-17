/** @type {import('next').NextConfig} */
const nextConfig = {
  compress: true,
  poweredByHeader: false,

  images: {
    // Serve AVIF first (40-60% smaller), fall back to WebP, then original
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "via.placeholder.com" },
    ],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days — Cloudinary URLs are stable
  },

  experimental: {
    // Tree-shake large component libraries — only bundle icons/components actually imported
    optimizePackageImports: ["lucide-react", "framer-motion", "gsap"],
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
