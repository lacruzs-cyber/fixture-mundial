/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Permite logos de equipos servidos desde el CDN de API-Sports
  images: {
    remotePatterns: [{ protocol: "https", hostname: "media.api-sports.io" }],
  },
};

module.exports = nextConfig;
