// /utils/GoogleAnalytics.tsx
'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import Script from 'next/script';

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

export const GoogleAnalytics = (): JSX.Element | null => {
  const pathname = usePathname(); // e.g. "/pricing", "/features"
  const gaId = process.env.NEXT_PUBLIC_GA_CORE_ID;

  // avoid injecting the same GA property twice
  const idsLoaded = useRef<Set<string>>(new Set());

  /* ---- send page-view on each client-side route change ---- */
  useEffect(() => {
    if (!gaId || typeof window === 'undefined' || !window.gtag) return;

    window.gtag('config', gaId, {
      page_path: pathname,
    });
  }, [pathname, gaId]);

  /* ---- inject GA only once per property ---- */
  if (!gaId || idsLoaded.current.has(gaId)) return null;
  idsLoaded.current.add(gaId);

  const initSnippet = `
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', '${gaId}', {
      page_path: '${pathname}'
    });
  `;

  return (
    <>
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
      />
      <Script
        id={`gtag-init-${gaId}`}
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{ __html: initSnippet }}
      />
    </>
  );
};
