import posthog from 'posthog-js'

// NEXT_PUBLIC_POSTHOG_HOST = https://eu.i.posthog.com (API ingest)
// ui_host = https://eu.posthog.com  (dashboard PostHog — sans le "i.")
const apiHost = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://eu.i.posthog.com'
const uiHost = apiHost.replace('i.posthog.com', 'posthog.com') // eu.i → eu / us.i → us

posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
  api_host: '/ingest',   // reverse proxy (anti ad-blockers)
  ui_host: uiHost,       // https://eu.posthog.com
  defaults: '2026-01-30',
  capture_pageview: false,  // géré manuellement dans providers.tsx
  capture_pageleave: true,
})
