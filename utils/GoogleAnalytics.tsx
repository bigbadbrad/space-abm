// /utils/GoogleAnalytics.tsx
"use client";

import { useEffect, useState } from 'react';
import Script from 'next/script';
import { usePathname } from 'next/navigation';

declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
    fbq: (...args: any[]) => void;
    visitorCountry?: string;
  }
}

const BLOCKED_COUNTRIES = [
  'RU', 'CN', 'IR', 'KP', 'PK', 'VN',
  'NG', 'UA', 'IN', 'SA', 'BD', 'EG', 'CZ',
];

const GoogleAnalytics = () => {
  const pathname = usePathname();
  const [allowTracking, setAllowTracking] = useState(false);
  const [gaLoaded, setGaLoaded] = useState(false);

  useEffect(() => {
    // Default to allowing tracking if no country is detected
    const country = typeof window !== 'undefined' ? window.visitorCountry : 'US';
    if (country && !BLOCKED_COUNTRIES.includes(country)) {
      setAllowTracking(true);
    } else if (!country) {
      // If no country detected, allow tracking by default
      setAllowTracking(true);
    } else {
      console.log(`GA blocked for country: ${country}`);
    }
  }, []);

  useEffect(() => {
    if (!allowTracking || !gaLoaded) return;

    const handleRouteChange = (url: string) => {
      const areaCode = window.location.hostname.split('.')[0];
      const pageLocation = window.location.href;

      if (typeof window.gtag === 'function') {
        try {
          window.gtag('config', process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS || '', {
            page_path: url,
            page_location: pageLocation,
            area_code: areaCode,
          });

          if (process.env.NEXT_PUBLIC_GOOGLE_ADS_ID) {
            window.gtag('event', 'page_view', {
              send_to: process.env.NEXT_PUBLIC_GOOGLE_ADS_ID,
              page_path: url,
            });
          }
        } catch (error) {
          console.error('Error sending GA event:', error);
        }
      }

      if (typeof window.fbq === 'function') {
        try {
          window.fbq('track', 'PageView');
        } catch (error) {
          console.error('Error sending FB event:', error);
        }
      }
    };

    handleRouteChange(pathname);

    window.addEventListener('popstate', () => handleRouteChange(window.location.pathname));

    return () => {
      window.removeEventListener('popstate', () => handleRouteChange(window.location.pathname));
    };
  }, [pathname, allowTracking, gaLoaded]);

  const handleGALoad = () => {
    setGaLoaded(true);
    console.log('Google Analytics loaded successfully');
  };

  const handleGAError = () => {
    console.error('Failed to load Google Analytics');
  };

  if (!allowTracking) return null;

  return (
    <>
      {allowTracking && process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS && (
        <>
          {/* Google Analytics - Load gtag library first */}
          <Script
            strategy="afterInteractive"
            src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS}`}
            onLoad={handleGALoad}
            onError={handleGAError}
          />
          
          {/* Google Analytics - Initialize after library loads */}
          <Script id="ga-init" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS}', {
                page_title: document.title,
                page_location: window.location.href
              });
            `}
          </Script>

          {/* Google Ads - Only load after GA is ready */}
          {process.env.NEXT_PUBLIC_GOOGLE_ADS_ID && gaLoaded && (
            <Script id="google-ads" strategy="afterInteractive">
              {`
                if (typeof gtag === 'function') {
                  gtag('config', '${process.env.NEXT_PUBLIC_GOOGLE_ADS_ID}');
                }
              `}
            </Script>
          )}

          {/* Meta Pixel */}
          {process.env.NEXT_PUBLIC_META_PIXEL_ID && (
            <>
              <Script id="meta-pixel" strategy="afterInteractive">
                {`
                  !function(f,b,e,v,n,t,s)
                  {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                  n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                  if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                  n.queue=[];t=b.createElement(e);t.async=!0;
                  t.src=v;s=b.getElementsByTagName(e)[0];
                  s.parentNode.insertBefore(t,s)}(window, document,'script',
                  'https://connect.facebook.net/en_US/fbevents.js');
                  fbq('init', '${process.env.NEXT_PUBLIC_META_PIXEL_ID}');
                  fbq('track', 'PageView');
                `}
              </Script>
              <noscript>
                <img
                  height="1"
                  width="1"
                  style={{ display: 'none' }}
                  src={`https://www.facebook.com/tr?id=${process.env.NEXT_PUBLIC_META_PIXEL_ID}&ev=PageView&noscript=1`}
                />
              </noscript>
            </>
          )}
        </>
      )}
    </>
  );
};

export default GoogleAnalytics;
