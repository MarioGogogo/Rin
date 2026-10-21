import type { ReactNode } from "react";
import type { Profile } from "../../state/profile";
import type { HeaderBehaviorOption, HeaderLayoutVariant } from "./layout-options";
import type { SiteHeaderConfig } from "./shared";

export type HeaderLayoutRenderProps = {
  children?: ReactNode;
  profile?: Profile | null;
  siteConfig: SiteHeaderConfig;
  behavior: HeaderBehaviorOption;
  isAtTop: boolean;
};

export type HeaderLayoutPreviewData = {
  avatar: string;
  name: string;
  themeColor: string;
};

export type HeaderLayoutDefinition = {
  kind: "top" | "sidebar";
  // true 时 Header 不再包裹 Padding（通栏 header，如 compact/v2）
  fullBleed?: boolean;
  renderDesktop: (props: HeaderLayoutRenderProps) => ReactNode;
  renderMobile: (props: HeaderLayoutRenderProps) => ReactNode;
  renderPreview: (data: HeaderLayoutPreviewData) => ReactNode;
  renderRouteShell: (props: {
    header: ReactNode;
    content: ReactNode;
    footer: ReactNode;
    paddingClassName?: string;
  }) => ReactNode;
};

export type HeaderLayoutRegistry = Record<HeaderLayoutVariant, HeaderLayoutDefinition>;
