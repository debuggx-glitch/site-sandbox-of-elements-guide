import {ContentScrollTracker} from "@/components/content-scroll-tracker";
import {site} from "@/lib/site";
import {Analytics} from "@vercel/analytics/next";
import {SpeedInsights} from "@vercel/speed-insights/next";
import Script from "next/script";

export function Telemetry() {
  const gaId = site.ga4MeasurementId;
  return <>
    <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive"/>
    <Script id="ga4-init" strategy="afterInteractive">{`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${gaId}',{send_page_view:true});`}</Script>
    <ContentScrollTracker/>
    <Analytics/>
    <SpeedInsights/>
  </>;
}
