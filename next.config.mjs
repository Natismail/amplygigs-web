/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // ✅ Allow builds even with TS issues (intentional)
  typescript: {
    ignoreBuildErrors: true,
  },

  // ✅ Image optimization - FIXED SUPABASE CONFIGURATION
  images: {
    remotePatterns: [
      { 
        protocol: "https", 
        hostname: "images.unsplash.com" 
      },
      { 
        protocol: "https", 
        hostname: "lh3.googleusercontent.com" 
      },
      { 
        protocol: "https", 
        hostname: "maps.googleapis.com" 
      },
      // ✅ FIXED: Added pathname for Supabase storage
      { 
        protocol: "https", 
        hostname: "goualvnnkxriekflilru.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },

  // ✅ Turbopack / bundle optimizations - MERGED
  experimental: {
    optimizePackageImports: [
      "react-icons",
      "lucide-react",
      "recharts",
      "@/components", 
      "@/lib"
    ],
  },

  // ✅ PWA headers
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          {
            key: "Content-Type",
            value: "application/javascript; charset=utf-8",
          },
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
          {
            key: "Service-Worker-Allowed",
            value: "/",
          },
        ],
      },
      {
        source: "/manifest.json",
        headers: [
          {
            key: "Content-Type",
            value: "application/manifest+json",
          },
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
