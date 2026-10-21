import type { ReactNode } from "react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "wouter";
import { useSiteConfig } from "../../../hooks/useSiteConfig";
import type { Profile } from "../../../state/profile";
import type { SiteHeaderConfig } from "../shared";
import { LanguageSwitch, UserAvatar } from "../primitives/action-buttons";
import { Menu } from "../primitives/menu";
import { SearchPill } from "../primitives/search-pill";
import { ImageWithFallback } from "../../image-with-fallback";
import { PreviewActions, PreviewBrand, PreviewCanvas, PreviewContent, PreviewNav } from "../preview-primitives";
import type { HeaderLayoutDefinition } from "../layout-types";

const PREVIEW_ITEMS = ["Home", "Timeline", "Moments"];

// v2 路由切换过渡：key 变化触发 remount，播放 fade-up 动画（见 index.css 的 v2-page-in）
function PageTransition({ children }: { children: ReactNode }) {
  const [location] = useLocation();

  return (
    <div key={location} className="v2-page-enter">
      {children}
    </div>
  );
}

// v2 风格品牌区：头像或渐变首字母方块 + 名称/描述双行
function V2Brand({ siteConfig, compact = false }: { siteConfig: SiteHeaderConfig; compact?: boolean }) {
  const brandChar = (siteConfig.name || "R").trim().charAt(0).toUpperCase();
  const tileClassName = compact ? "h-8 w-8" : "h-9 w-9";

  return (
    <Link href="/" className="group flex min-w-0 items-center gap-3">
      {siteConfig.avatar ? (
        <ImageWithFallback
          src={siteConfig.avatar}
          alt={siteConfig.name}
          className={`shrink-0 overflow-hidden ${tileClassName} rounded-xl shadow-md`}
          imageClassName="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      ) : (
        <div
          className={`flex shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-theme via-theme-hover to-theme-active text-white shadow-md transition-transform duration-300 group-hover:scale-105 ${tileClassName}`}
        >
          <span className="text-sm font-extrabold tracking-tight">{brandChar}</span>
        </div>
      )}
      <div className="flex min-w-0 flex-col">
        <span
          className={`truncate font-bold tracking-tight t-primary transition-colors group-hover:text-theme ${compact ? "text-sm" : "text-base"}`}
        >
          {siteConfig.name}
        </span>
        {siteConfig.description ? (
          <span className="truncate text-[11px] font-normal t-secondary">{siteConfig.description}</span>
        ) : null}
      </div>
    </Link>
  );
}

// v2 导航胶囊：条目与 gating 规则对齐 NavBar，激活态跟随主题色；
// 激活底色为独立滑块（children[0]），切 tab 时平滑滑动到目标项
function V2NavPill() {
  const { t } = useTranslation();
  const [location] = useLocation();
  const siteConfig = useSiteConfig();
  const navRef = useRef<HTMLElement | null>(null);
  const [sliderStyle, setSliderStyle] = useState<{ left: number; width: number } | null>(null);

  const items = [
    { href: "/", title: t("article.title"), active: location === "/" },
    { href: "/timeline", title: t("timeline"), active: location.startsWith("/timeline") },
    { href: "/moments", title: t("moments.title"), active: location.startsWith("/moments"), when: siteConfig.momentsEnabled },
    {
      href: "/hashtags",
      title: t("hashtags"),
      active: location.startsWith("/hashtags") || location.startsWith("/hashtag"),
    },
    { href: "/friends", title: t("friends.title"), active: location.startsWith("/friends"), when: siteConfig.friendsEnabled },
    { href: "/about", title: t("about.title"), active: location === "/about" },
  ];

  const visibleItems = items.filter(({ when }) => when !== false);
  const activeIndex = visibleItems.findIndex(({ active }) => active);

  const measureSlider = () => {
    const nav = navRef.current;
    if (!nav || activeIndex < 0) {
      setSliderStyle(null);
      return;
    }
    // children[0] 是滑块本身，链接从 children[1] 开始
    const el = nav.children[activeIndex + 1] as HTMLElement | undefined;
    setSliderStyle(el && el.offsetWidth > 0 ? { left: el.offsetLeft, width: el.offsetWidth } : null);
  };

  useLayoutEffect(measureSlider, [location, activeIndex]);

  useEffect(() => {
    window.addEventListener("resize", measureSlider);
    return () => window.removeEventListener("resize", measureSlider);
  });

  return (
    <nav
      ref={navRef}
      className="relative hidden min-w-0 items-center rounded-full border border-black/5 bg-black/[0.03] p-1 text-xs font-semibold shadow-inner lg:flex dark:border-white/10 dark:bg-white/[0.04]"
    >
      <span
        aria-hidden="true"
        className={`absolute bottom-1 top-1 rounded-full bg-w/80 shadow-sm transition-all duration-300 ease-out ${
          sliderStyle ? "opacity-100" : "opacity-0"
        }`}
        style={sliderStyle ?? { left: 0, width: 0 }}
      />
      {visibleItems.map(({ href, title, active }) => (
        <Link
          key={href}
          href={href}
          state={{ animate: true }}
          className={`relative z-10 whitespace-nowrap rounded-full px-4 py-1.5 transition-colors duration-300 ${
            active ? "text-theme" : "text-neutral-500 hover:text-theme dark:text-neutral-400"
          }`}
        >
          {title}
        </Link>
      ))}
    </nav>
  );
}

function V2HeaderBar({
  children,
  profile,
  siteConfig,
}: {
  children?: ReactNode;
  profile?: Profile | null;
  siteConfig: SiteHeaderConfig;
}) {
  return (
    <div className="w-full border-b border-black/5 bg-white/60 backdrop-blur-xl dark:border-white/10 dark:bg-dark/60">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <V2Brand siteConfig={siteConfig} />
        <div className="flex min-w-0 flex-1 items-center justify-center">
          <V2NavPill />
        </div>
        <div className="flex shrink-0 items-center gap-2.5">
          {children ? <div className="flex items-center text-sm t-primary">{children}</div> : null}
          <SearchPill />
          <LanguageSwitch plain />
          <UserAvatar profile={profile} plain />
        </div>
      </div>
    </div>
  );
}

export const v2LayoutDefinition: HeaderLayoutDefinition = {
  kind: "top",
  fullBleed: true,
  renderDesktop({ children, profile, siteConfig }) {
    return (
      <div className="hidden w-full lg:block">
        <V2HeaderBar siteConfig={siteConfig} profile={profile}>
          {children}
        </V2HeaderBar>
      </div>
    );
  },
  renderMobile({ children, profile, siteConfig }) {
    return (
      <div className="w-full lg:hidden">
        <div className="flex w-full items-center border-b border-black/5 bg-white/60 backdrop-blur-xl dark:border-white/10 dark:bg-dark/60">
          <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
            <V2Brand siteConfig={siteConfig} compact />
            <div className="flex min-w-0 items-center gap-2">
              {children ? <div className="flex items-center text-sm t-primary">{children}</div> : null}
              <SearchPill />
              <Menu profile={profile} />
            </div>
          </div>
        </div>
      </div>
    );
  },
  renderPreview(data) {
    return (
      <PreviewCanvas className="w-full overflow-hidden rounded-[22px] p-3">
        <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3">
          <PreviewBrand data={data} />
          <div className="mx-2 flex min-w-0 items-center justify-center">
            <div className="max-w-full rounded-full bg-white px-2 py-2 shadow-lg shadow-black/5 ring-1 ring-black/5 dark:bg-white/[0.08] dark:shadow-black/20 dark:ring-white/10">
              <PreviewNav center items={PREVIEW_ITEMS} themeColor={data.themeColor} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-6 w-10 rounded-full bg-black/[0.04] dark:bg-white/[0.08]" />
            <PreviewActions themeColor={data.themeColor} />
          </div>
        </div>
        <PreviewContent />
      </PreviewCanvas>
    );
  },
  renderRouteShell({ header, content, footer }) {
    return (
      <>
        {header}
        <PageTransition>{content}</PageTransition>
        {footer}
      </>
    );
  },
};
