'use client'
import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import posthog from 'posthog-js'

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Init PostHog une seule fois — garde sur le key + check anti double-init
  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      process.env.NEXT_PUBLIC_POSTHOG_KEY &&
      !posthog.config  // pas encore initialisé
    ) {
      posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
        api_host: '/ingest',            // reverse proxy Next.js → eu.i.posthog.com
        ui_host: 'https://eu.posthog.com',
        defaults: '2026-01-30',
        capture_pageview: false,        // géré manuellement ci-dessous
        capture_pageleave: true,
      })
    }
  }, [])

  // Capture $pageview à chaque changement de route
  useEffect(() => {
    if (pathname) {
      let url = window.origin + pathname
      if (searchParams?.toString()) {
        url = url + `?${searchParams.toString()}`
      }
      posthog.capture('$pageview', { $current_url: url })
    }
  }, [pathname, searchParams])

  return <>{children}</>
}
