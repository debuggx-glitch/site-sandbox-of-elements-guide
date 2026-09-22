import rawConfig from "@/config/adsterra.json";

export type PlacementName = "home_banner_desktop" | "home_banner_mobile" | "home_side_desktop" | "guide_native_mid";
export type PlacementBase = {placementId: string; format: string; src: string};
export type BannerPlacement = PlacementBase & {format: "banner"; key: string; width: number; height: number};
export type NativePlacement = PlacementBase & {format: "native_banner"; containerId: string};

type PublicConfig = {
  schemaVersion: string;
  siteId: string;
  domain: string;
  placements: {
    homeBannerDesktop: BannerPlacement | null;
    homeBannerMobile: BannerPlacement | null;
    homeSideDesktop: BannerPlacement | null;
    guideNative: NativePlacement | null;
  };
};

export const adsterraConfig = rawConfig as PublicConfig;
