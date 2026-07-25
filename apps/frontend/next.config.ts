import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import withSerwistInit from "@serwist/next";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  // Serwist's webpack integration doesn't support Turbopack (used by `next dev`),
  // so the service worker only builds for production (`next build`, which uses webpack).
  disable: process.env.NODE_ENV !== "production",
  // Registration is handled by <SerwistProvider> instead of the plugin's own entry script.
  register: false,
});

const nextConfig: NextConfig = {
  experimental: {
    trustHostHeader: true,
  },
};

export default withSerwist(withNextIntl(nextConfig));
