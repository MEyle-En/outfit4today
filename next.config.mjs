/** @type {import('next').NextConfig} */
const nextConfig = {
  // Erlaubt Test-Builds in ein eigenes Verzeichnis, ohne einen laufenden Dev-Server (.next) zu stören
  distDir: process.env.NEXT_DIST_DIR || ".next",
};

export default nextConfig;
