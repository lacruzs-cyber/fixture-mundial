/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Permite logos de equipos servidos desde el CDN de TheSportsDB
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "crests.football-data.org" },
      { protocol: "https", hostname: "flagcdn.com" },
    ],
  },
};

module.exports = nextConfig;
