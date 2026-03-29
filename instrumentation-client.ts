import posthog from 'posthog-js'

posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
  api_host: '/ingest',                                              // reverse proxy (anti ad-blockers)
  ui_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.posthog.com', // UI toolbar
  defaults: '2026-01-30',
  capture_pageview: false,  // géré manuellement dans providers.tsx
  capture_pageleave: true,
})
