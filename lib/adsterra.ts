import rawConfig from "@/config/adsterra.json";

export type PlacementName = "social_global" | "home_banner_desktop" | "home_banner_mobile" | "guide_native_mid";
export type PlacementBase = {placementId: string; format: string; src: string};
export type BannerPlacement = PlacementBase & {format: "banner"; key: string; width: number; height: number};
export type SocialPlacement = PlacementBase & {format: "social_bar"};
export type NativePlacement = PlacementBase & {format: "native_banner"; containerId: string};

type PublicConfig = {
  schemaVersion: string;
  siteId: string;
  domain: string;
  placements: {
    socialBar: SocialPlacement | null;
    homeBannerDesktop: BannerPlacement | null;
    homeBannerMobile: BannerPlacement | null;
    guideNative: NativePlacement | null;
  };
};

export const adsterraConfig = rawConfig as PublicConfig;
