"use client";

import Script from "next/script";
import {useEffect, useRef, useState} from "react";
import {useAdFunnel} from "@/components/ad-funnel";
import {adsterraConfig, type BannerPlacement} from "@/lib/adsterra";

function BannerRuntime({placement, onLoad, onError}:{placement:BannerPlacement;onLoad:()=>void;onError:()=>void}) {
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = host.current;
    if (!element) return;
    element.replaceChildren();
    const options = document.createElement("script");
    options.dataset.cfasync = "false";
    options.textContent = `window.atOptions=${JSON.stringify({key:placement.key,format:"iframe",height:placement.height,width:placement.width,params:{}}).replaceAll("<", "\\u003c")};`;
    const script = document.createElement("script");
    script.src = placement.src;
    script.async = true;
    script.dataset.cfasync = "false";
    script.addEventListener("load", onLoad);
    script.addEventListener("error", onError);
    element.append(options, script);
    return () => element.replaceChildren();
  }, [onError, onLoad, placement]);
  return <div ref={host}/>;
}

export function HomeAd() {
  const [mobile, setMobile] = useState<boolean | null>(null);
  const container = useRef<HTMLElement>(null);
  useEffect(() => {
    const media = window.matchMedia("(max-width: 640px)");
    const update = () => setMobile(media.matches);
    update(); media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  const placement = mobile === null ? null : mobile ? adsterraConfig.placements.homeBannerMobile : adsterraConfig.placements.homeBannerDesktop;
  const name = mobile ? "home_banner_mobile" : "home_banner_desktop";
  const funnel = useAdFunnel({siteId:adsterraConfig.siteId,placementName:name,placement,viewRef:container});
  if (!placement) return null;
  return <aside className="ad-slot" ref={container} data-ad-placement={name}><small>Advertisement</small><BannerRuntime placement={placement} onLoad={funnel.onScriptLoad} onError={funnel.onScriptError}/></aside>;
}

export function HomeSideAd() {
  const [desktop, setDesktop] = useState<boolean | null>(null);
  const container = useRef<HTMLElement>(null);
  useEffect(() => {
    const media = window.matchMedia("(min-width: 1280px)");
    const update = () => setDesktop(media.matches);
    update(); media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  const placement = desktop === true ? adsterraConfig.placements.homeSideDesktop : null;
  const funnel = useAdFunnel({siteId:adsterraConfig.siteId,placementName:"home_side_desktop",placement,viewRef:container});
  if (!placement) return null;
  return <aside className="ad-slot home-side-ad" ref={container} data-ad-placement="home_side_desktop"><small>Advertisement</small><BannerRuntime placement={placement} onLoad={funnel.onScriptLoad} onError={funnel.onScriptError}/></aside>;
}

export function GuideAd() {
  const placement = adsterraConfig.placements.guideNative;
  const host = useRef<HTMLDivElement>(null);
  const container = useRef<HTMLElement>(null);
  const funnel = useAdFunnel({siteId:adsterraConfig.siteId,placementName:"guide_native_mid",placement,viewRef:container});
  useEffect(() => {
    const element = host.current;
    if (!element || !placement) return;
    element.replaceChildren();
    const native = document.createElement("div");
    native.id = placement.containerId;
    const script = document.createElement("script");
    script.src = placement.src; script.async = true; script.dataset.cfasync = "false";
    script.addEventListener("load", funnel.onScriptLoad); script.addEventListener("error", funnel.onScriptError);
    element.append(native, script);
    return () => element.replaceChildren();
  }, [funnel.onScriptError, funnel.onScriptLoad, placement]);
  if (!placement) return null;
  return <aside className="ad-slot" ref={container} data-ad-placement="guide_native_mid"><small>Advertisement</small><div ref={host}/></aside>;
}

export function SocialBar() {
  const placement = adsterraConfig.placements.socialBar;
  const funnel = useAdFunnel({siteId:adsterraConfig.siteId,placementName:"social_global",placement});
  if (!placement) return null;
  return <Script id="adsterra-social" src={placement.src} strategy="afterInteractive" data-cfasync="false" onLoad={funnel.onScriptLoad} onError={funnel.onScriptError}/>;
}
