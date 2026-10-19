// 文章排版个性化：字号 / 行距 / 字体。仅作用于正文容器 .toc-content（见 index.css），
// 通过 CSS 变量注入，模式与 theme-color.ts 的 --theme-rgb 一致。
// 与 packages/config 的 CLIENT_CONFIG_DEFAULTS 中 article.font_size / article.line_height / article.font_family 对应。

export const ARTICLE_FONT_SIZE_OPTIONS = ["small", "normal", "large", "xlarge"] as const;
export const ARTICLE_LINE_HEIGHT_OPTIONS = ["compact", "normal", "relaxed"] as const;
export const ARTICLE_FONT_FAMILY_OPTIONS = ["sans", "serif"] as const;

export type ArticleFontSize = (typeof ARTICLE_FONT_SIZE_OPTIONS)[number];
export type ArticleLineHeight = (typeof ARTICLE_LINE_HEIGHT_OPTIONS)[number];
export type ArticleFontFamily = (typeof ARTICLE_FONT_FAMILY_OPTIONS)[number];

export function normalizeArticleFontSize(value: string): ArticleFontSize {
  return ARTICLE_FONT_SIZE_OPTIONS.includes(value as ArticleFontSize) ? (value as ArticleFontSize) : "normal";
}

export function normalizeArticleLineHeight(value: string): ArticleLineHeight {
  return ARTICLE_LINE_HEIGHT_OPTIONS.includes(value as ArticleLineHeight) ? (value as ArticleLineHeight) : "normal";
}

export function normalizeArticleFontFamily(value: string): ArticleFontFamily {
  return ARTICLE_FONT_FAMILY_OPTIONS.includes(value as ArticleFontFamily) ? (value as ArticleFontFamily) : "sans";
}

// 取值映射：被 index.css 的 .toc-content 变量默认值与设置页预览卡共用
export const ARTICLE_FONT_SIZE_VALUE: Record<ArticleFontSize, string> = {
  small: "0.9rem",
  normal: "1rem",
  large: "1.125rem",
  xlarge: "1.25rem",
};

export const ARTICLE_LINE_HEIGHT_VALUE: Record<ArticleLineHeight, string> = {
  compact: "1.5",
  normal: "1.75",
  relaxed: "2",
};

export const ARTICLE_FONT_FAMILY_VALUE: Record<ArticleFontFamily, string> = {
  sans: 'Cantarell, "Noto Sans SC", "PingFang SC", "Microsoft YaHei", "Hiragino Sans GB", sans-serif',
  serif: '"Source Han Serif CN VF", "Noto Serif SC", Georgia, "Songti SC", serif',
};

export interface ArticleTypography {
  fontSize: ArticleFontSize;
  lineHeight: ArticleLineHeight;
  fontFamily: ArticleFontFamily;
}

export function applyArticleTypography(typography: ArticleTypography): void {
  const root = document.documentElement;
  root.style.setProperty("--article-font-size", ARTICLE_FONT_SIZE_VALUE[typography.fontSize]);
  root.style.setProperty("--article-line-height", ARTICLE_LINE_HEIGHT_VALUE[typography.lineHeight]);
  root.style.setProperty("--article-font-family", ARTICLE_FONT_FAMILY_VALUE[typography.fontFamily]);
}

// 从原始 client config record 读取三个 key（缺省回退默认值）并注入
export function applyArticleTypographyFromConfig(config: Record<string, unknown>): void {
  applyArticleTypography({
    fontSize: normalizeArticleFontSize(String(config["article.font_size"] ?? "normal")),
    lineHeight: normalizeArticleLineHeight(String(config["article.line_height"] ?? "normal")),
    fontFamily: normalizeArticleFontFamily(String(config["article.font_family"] ?? "sans")),
  });
}
