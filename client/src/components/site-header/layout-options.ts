import { normalizeHomeVersion } from "../home-version-options";

export const HEADER_LAYOUT_OPTIONS = ["classic", "compact"] as const;
export const HEADER_BEHAVIOR_OPTIONS = ["fixed", "static", "reveal"] as const;

export type HeaderLayoutOption = (typeof HEADER_LAYOUT_OPTIONS)[number];
export type HeaderBehaviorOption = (typeof HEADER_BEHAVIOR_OPTIONS)[number];
// "v2" 只能由 home.version=v2 驱动（见 getEffectiveHeaderLayout），不进入 HEADER_LAYOUT_OPTIONS，
// 因此不会出现在设置页的 header 布局选择器里。
export type HeaderLayoutVariant = HeaderLayoutOption | "v2";

export function normalizeHeaderLayout(value: string | undefined | null): HeaderLayoutOption {
  if (value && HEADER_LAYOUT_OPTIONS.includes(value as HeaderLayoutOption)) {
    return value as HeaderLayoutOption;
  }

  return "classic";
}

export function getEffectiveHeaderLayout(siteConfig: {
  headerLayout?: string | null;
  homeVersion?: string | null;
}): HeaderLayoutVariant {
  if (normalizeHomeVersion(siteConfig.homeVersion ?? "") === "v2") {
    return "v2";
  }

  return normalizeHeaderLayout(siteConfig.headerLayout);
}

export function normalizeHeaderBehavior(value: string | undefined | null): HeaderBehaviorOption {
  if (value && HEADER_BEHAVIOR_OPTIONS.includes(value as HeaderBehaviorOption)) {
    return value as HeaderBehaviorOption;
  }

  return "fixed";
}
