/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Permite logos de equipos servidos desde el CDN de TheSportsDB
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "www.thesportsdb.com" },
      { protocol: "https", hostname: "r2.thesportsdb.com" },
      { protocol: "https", hostname: "flagcdn.com" },
    ],
  },
};

module.exports = nextConfig;
