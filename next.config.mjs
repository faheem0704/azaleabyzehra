/** @type {import('next').NextConfig} */
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com",
      "frame-src https://api.razorpay.com https://checkout.razorpay.com",
      "img-src 'self' https://res.cloudinary.com https://images.unsplash.com https://via.placeholder.com data: blob:",
      "media-src 'self' https://res.cloudinary.com",
      "connect-src 'self' https://api.razorpay.com",
      "font-src 'self' https://fonts.gstatic.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    ].join("; "),
  },
];

const nextConfig = {
  compress: true,
  poweredByHeader: false,

  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },

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
    optimizePackageImports: ["lucide-react", "framer-motion", "gsap", "lenis"],
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
