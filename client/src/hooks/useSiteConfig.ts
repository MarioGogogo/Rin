import { useContext } from "react";
import { ClientConfigContext } from "../state/config";
import { normalizeArticleFontFamily, normalizeArticleFontSize, normalizeArticleLineHeight } from "../components/article-typography-options";
import { normalizeArticleWidth } from "../components/article-width-options";
import { normalizeFeedCardVariant } from "../components/feed-card-options";
import { normalizeFeedLayout } from "../components/feed-layout-options";
import { normalizeHomeVersion } from "../components/home-version-options";

// Site configuration keys
export const SITE_CONFIG_KEYS = {
    headerBehavior: "header.behavior",
    name: "site.name",
    description: "site.description",
    avatar: "site.avatar",
    pageSize: "site.page_size",
    feedLayout: "feed.layout",
    feedCardVariant: "feed.card_variant",
    homeVersion: "home.version",
    articleWidth: "article.width",
    articleFontSize: "article.font_size",
    articleLineHeight: "article.line_height",
    articleFontFamily: "article.font_family",
    headerLayout: "header.layout",
    themeColor: "theme.color",
    momentsEnabled: "moments.enabled",
    friendsEnabled: "friends.enabled",
} as const;

// Hook to get site configuration
export function useSiteConfig() {
    const config = useContext(ClientConfigContext);
    const pageSizeValue = config.get<string | number>(SITE_CONFIG_KEYS.pageSize);
    const parsedPageSize =
        typeof pageSizeValue === "number"
            ? pageSizeValue
            : typeof pageSizeValue === "string"
                ? parseInt(pageSizeValue, 10)
                : NaN;

    return {
        name: config.get<string>(SITE_CONFIG_KEYS.name) || "Rin",
        description: config.get<string>(SITE_CONFIG_KEYS.description) || "",
        avatar: config.get<string>(SITE_CONFIG_KEYS.avatar) || "",
        pageSize: Number.isFinite(parsedPageSize) ? parsedPageSize : 5,
        headerBehavior: config.get<string>(SITE_CONFIG_KEYS.headerBehavior) || "fixed",
        feedLayout: normalizeFeedLayout(config.get<string>(SITE_CONFIG_KEYS.feedLayout) || "list"),
        feedCardVariant: normalizeFeedCardVariant(config.get<string>(SITE_CONFIG_KEYS.feedCardVariant) || "default"),
        homeVersion: normalizeHomeVersion(config.get<string>(SITE_CONFIG_KEYS.homeVersion) || "v1"),
        articleWidth: normalizeArticleWidth(config.get<string>(SITE_CONFIG_KEYS.articleWidth) || "normal"),
        articleFontSize: normalizeArticleFontSize(config.get<string>(SITE_CONFIG_KEYS.articleFontSize) || "normal"),
        articleLineHeight: normalizeArticleLineHeight(config.get<string>(SITE_CONFIG_KEYS.articleLineHeight) || "normal"),
        articleFontFamily: normalizeArticleFontFamily(config.get<string>(SITE_CONFIG_KEYS.articleFontFamily) || "sans"),
        headerLayout: config.get<string>(SITE_CONFIG_KEYS.headerLayout) || "classic",
        themeColor: config.get<string>(SITE_CONFIG_KEYS.themeColor) || "#fc466b",
        momentsEnabled: config.getBoolean(SITE_CONFIG_KEYS.momentsEnabled),
        friendsEnabled: config.getBoolean(SITE_CONFIG_KEYS.friendsEnabled),
    };
}

// Hook to get a specific site config value
export function useSiteConfigValue<K extends keyof typeof SITE_CONFIG_KEYS>(
    key: K
): typeof SITE_CONFIG_KEYS[K] extends "site.page_size" ? number : string {
    const config = useContext(ClientConfigContext);
    const configKey = SITE_CONFIG_KEYS[key];

    if (key === "pageSize") {
        const value = config.get<string | number>(configKey);
        const parsed =
            typeof value === "number"
                ? value
                : typeof value === "string"
                    ? parseInt(value, 10)
                    : NaN;
        return (Number.isFinite(parsed) ? parsed : 5) as any;
    }

    return (config.get<string>(configKey) || "") as any;
}
