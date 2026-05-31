import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Kein output:"standalone": Hostingers "Standard"-Next.js-Bereitstellung startet
  // die App über `next start` (siehe package.json "start"). Der Standalone-Server
  // (.next/standalone/server.js) wurde in dieser Next-Version/diesem Setup nicht
  // zuverlässig erzeugt → der Start lief ins Leere und der Server lieferte 503.
  reactStrictMode: true,
};

export default nextConfig;
