"use client";

import {usePathname} from "next/navigation";
import {useEffect, useRef} from "react";

type AnalyticsWindow = Window & {
  dataLayer?: unknown[];
  gtag?: (...args: unknown[]) => void;
};

function pageType(pathname: string) {
  if (pathname === "/") return "home";
  if (pathname.startsWith("/guides/") || pathname.startsWith("/locations/")) return "guide";
  if (pathname === "/about" || pathname.includes("privacy") || pathname === "/contact") return "legal";
  return "other";
}
function deviceClass() {
  return window.matchMedia("(max-width: 640px)").matches ? "mobile" : "desktop";
}

function sendScrollEvent(pathname: string) {
  const analyticsWindow = window as AnalyticsWindow;
  const parameters = {
    page_path: pathname,
    page_type: pageType(pathname),
    device_class: deviceClass(),
    scroll_percent: 50,
  };
  if (typeof analyticsWindow.gtag === "function") {
    analyticsWindow.gtag("event", "content_scroll_50", parameters);
    return;
  }
  analyticsWindow.dataLayer ??= [];
  analyticsWindow.dataLayer.push(["event", "content_scroll_50", parameters]);
}

export function ContentScrollTracker() {
  const pathname = usePathname();
  const trackedPaths = useRef(new Set<string>());

  useEffect(() => {
    if (trackedPaths.current.has(pathname)) return;

    const checkDepth = () => {
      const root = document.documentElement;
      if (root.scrollHeight <= window.innerHeight + 1) return;
      const visibleBottom = window.scrollY + window.innerHeight;
      if (visibleBottom / root.scrollHeight < 0.5) return;
      trackedPaths.current.add(pathname);
      sendScrollEvent(pathname);
      window.removeEventListener("scroll", checkDepth);
    };

    window.addEventListener("scroll", checkDepth, {passive: true});
    checkDepth();
    return () => window.removeEventListener("scroll", checkDepth);
  }, [pathname]);

  return null;
}
