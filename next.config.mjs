/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // ✅ Allow builds even with TS issues (intentional)
  typescript: {
    ignoreBuildErrors: true,
  },

  // ⚠️ REMOVED eslint config (Next 16 no longer supports it here)
  // eslint: { ignoreDuringBuilds: true },

  // ✅ Image optimization
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "maps.googleapis.com" },
      { protocol: "https", hostname: "goualvnnkxriekflilru.supabase.co" },
      { protocol: "https", hostname: "*.supabase.co" },
    ],
  },

  // ✅ Turbopack / bundle optimizations
  experimental: {
    optimizePackageImports: [
      "react-icons",
      "lucide-react",
      "recharts",
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





// /** @type {import('next').NextConfig} */
// const nextConfig = {
//   typescript: { 
//     ignoreBuildErrors: true 
//   },
//   eslint: { 
//     ignoreDuringBuilds: true 
//   },
//   images: {
//     remotePatterns: [
//       { protocol: "https", hostname: "images.unsplash.com" },
//       { protocol: "https", hostname: "lh3.googleusercontent.com" },
//       { protocol: "https", hostname: "maps.googleapis.com" },
//       { protocol: "https", hostname: "goualvnnkxriekflilru.supabase.co" },
//     ],
//   },
//   // Enable Turbopack optimizations
//   experimental: {
//     optimizePackageImports: ['react-icons', 'lucide-react', 'recharts'],
//   },
//   // Headers for PWA
//   async headers() {
//     return [
//       {
//         source: '/sw.js',
//         headers: [
//           {
//             key: 'Cache-Control',
//             value: 'public, max-age=0, must-revalidate',
//           },
//           {
//             key: 'Service-Worker-Allowed',
//             value: '/',
//           },
//         ],
//       },
//       {
//         source: '/manifest.json',
//         headers: [
//           {
//             key: 'Cache-Control',
//             value: 'public, max-age=31536000, immutable',
//           },
//         ],
//       },
//     ];
//   },
// };

// export default nextConfig;




// import withPWA from "next-pwa";

// const isDev = process.env.NODE_ENV === "development";

// const runtimeCaching = [
//   {
//     urlPattern: /^https:\/\/goualvnnkxriekflilru\.supabase\.co\/.*/,
//     handler: "CacheFirst",
//     options: {
//       cacheName: "supabase-images",
//       expiration: { maxEntries: 50, maxAgeSeconds: 86400 },
//     },
//   },
//   {
//     urlPattern: /^\/api\/.*$/,
//     handler: "NetworkFirst",
//     options: { cacheName: "api-cache", networkTimeoutSeconds: 5 },
//   },
// ];

// const nextConfig = withPWA({
//   pwa: {
//     dest: "public",
//     register: true,
//     skipWaiting: true,
//     disable: isDev, // disable caching in dev
//     runtimeCaching,
//   },
//   typescript: { ignoreBuildErrors: true },
//   eslint: { ignoreDuringBuilds: true },
//   images: {
//     remotePatterns: [
//       { protocol: "https", hostname: "images.unsplash.com" },
//       { protocol: "https", hostname: "lh3.googleusercontent.com" },
//       { protocol: "https", hostname: "maps.googleapis.com" },
//       { protocol: "https", hostname: "goualvnnkxriekflilru.supabase.co" },
//     ],
//   },
//   // Silences Turbopack warnings
//   turbopack: {},
// });

// export default nextConfig;



