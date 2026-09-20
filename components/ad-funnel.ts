"use client";

import {usePathname} from "next/navigation";
import {type RefObject, useCallback, useEffect, useRef, useState} from "react";
import type {PlacementBase, PlacementName} from "@/lib/adsterra";

type FunnelEvent = "ad_slot_eligible" | "ad_script_loaded" | "ad_slot_viewable" | "ad_script_error";
type Gtag = (command: "event", eventName: FunnelEvent, parameters: Record<string, unknown>) => void;
type DataLayerWindow = Window & {dataLayer?: unknown[]; gtag?: Gtag};

function pageType(pathname: string) {
  if (pathname === "/") return "home";
  if (pathname.startsWith("/guides/")) return "guide";
  if (["/about", "/privacy", "/contact"].includes(pathname.replace(/\/$/, ""))) return "legal";
  return "other";
}

function sendGa4Event(eventName: FunnelEvent, parameters: Record<string, unknown>) {
  const target = window as DataLayerWindow;
  target.dataLayer ??= [];
  if (typeof target.gtag === "function") {
    target.gtag("event", eventName, parameters);
    return;
  }
  (function queueGtagCommand(
    _command: "event",
    _eventName: FunnelEvent,
    _parameters: Record<string, unknown>,
  ) {
    target.dataLayer!.push(arguments);
  })("event", eventName, parameters);
}

export function useAdFunnel({
  siteId,
  placementName,
  placement,
  viewRef,
}: {
  siteId: string;
  placementName: PlacementName;
  placement: PlacementBase | null;
  viewRef?: RefObject<HTMLElement | null>;
}) {
  const pathname = usePathname();
  const sent = useRef(new Set<string>());
  const [scriptReady, setScriptReady] = useState(false);

  const track = useCallback((event: FunnelEvent) => {
    if (!placement) return;
    const key = `${event}:${pathname}:${placement.placementId}`;
    if (sent.current.has(key)) return;
    sendGa4Event(event, {
      site_id: siteId,
      ad_placement: placementName,
      ad_format: placement.format,
      adsterra_placement_id: placement.placementId,
      page_type: pageType(pathname),
      page_path: pathname,
      device_class: window.matchMedia("(max-width: 640px)").matches ? "mobile" : "desktop",
      render_context: placementName.startsWith("home_banner_") ? "first_viewport" : "standard",
    });
    sent.current.add(key);
  }, [pathname, placement, placementName, siteId]);

  useEffect(() => {
    track("ad_slot_eligible");
    if (scriptReady) track("ad_script_loaded");
  }, [scriptReady, track]);
  useEffect(() => {
    const element = viewRef?.current;
    if (!element || !placement || !scriptReady) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.some((entry) => entry.isIntersecting && entry.intersectionRatio >= 0.5);
      if (visible && !timer) timer = setTimeout(() => track("ad_slot_viewable"), 1000);
      if (!visible && timer) { clearTimeout(timer); timer = undefined; }
    }, {threshold: [0, 0.5, 1]});
    observer.observe(element);
    return () => { if (timer) clearTimeout(timer); observer.disconnect(); };
  }, [placement, scriptReady, track, viewRef]);

  return {
    onScriptLoad: useCallback(() => { setScriptReady(true); track("ad_script_loaded"); }, [track]),
    onScriptError: useCallback(() => track("ad_script_error"), [track]),
  };
}
