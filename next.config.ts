import type { NextConfig } from "next";

// Host PostHog selon la région (US par défaut, EU si NEXT_PUBLIC_POSTHOG_HOST pointe vers eu)
const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com'
const isEU = posthogHost.includes('eu.')
const phAssetHost = isEU ? 'eu-assets.i.posthog.com' : 'us-assets.i.posthog.com'
const phApiHost = isEU ? 'eu.i.posthog.com' : 'us.i.posthog.com'

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      // Proxy PostHog — /ingest/static/* doit précéder /ingest/*
      {
        source: '/ingest/static/:path*',
        destination: `https://${phAssetHost}/static/:path*`,
      },
      {
        source: '/ingest/:path*',
        destination: `https://${phApiHost}/:path*`,
      },
    ]
  },
  // Requis : PostHog utilise des trailing slashes (ex: /e/) — sans ça ils sont supprimés
  skipTrailingSlashRedirect: true,
};

export default nextConfig;
