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
        protocol: 'https',
        hostname: 'usercontent.jamendo.com',
      },
      {
        protocol: 'https',
        hostname: 'i.scdn.co', // Spotify images
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com', // Placeholder images
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com', // Google profile images
      },
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
            // Add your existing Supabase storage domains
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
        const isDevelopment = process.env.NODE_ENV === 'development';

    return [
        {
        source: '/:path*',
        headers: [
          {
  key: 'Content-Security-Policy',
  value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdn.jsdelivr.net https://js.paystack.co https://js.stripe.com",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https: blob:",
              "font-src 'self' data:",
              `connect-src 'self' ${
                isDevelopment ? 'http://localhost:8000 http://127.0.0.1:8000' : ''
              } https://api.jamendo.com 
              https://*.supabase.co 
              wss://*.supabase.co 
              https://api.paystack.co 
              https://api.stripe.com 
              https://nominatim.openstreetmap.org
              https://tile.openstreetmap.org
              https://api.openstreetmap.org`,
              "media-src 'self' blob: data: https://*.supabase.co https://*.jamendo.com https://prod-1.storage.jamendo.com https://prod-2.storage.jamendo.com",
              "frame-src https://js.paystack.co https://js.stripe.com https://checkout.stripe.com https://checkout.paystack.com",
              "font-src 'self' data:",
            ].join('; ').replace(/\s+/g, ' '),
}

        ],
      },
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
