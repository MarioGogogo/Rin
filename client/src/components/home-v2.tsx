import { useContext, useEffect, useRef, useState } from "react";
import { Helmet } from "react-helmet";
import { useTranslation } from "react-i18next";
import { Link, useSearch } from "wouter";
import type { FeedListResponse } from "@rin/api";
import { client } from "../app/runtime";
import { ClientConfigContext } from "../state/config";
import { useSiteConfig } from "../hooks/useSiteConfig";
import { siteName } from "../utils/constants";
import { Waiting } from "./loading";
import { HashTag } from "./hashtag";

type Feed = FeedListResponse["data"][number];

type TagItem = { id: number; name: string; feeds: number };

function formatShortDate(value: string) {
  const date = new Date(value);
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${mm}-${dd}`;
}

function formatPv(pv: number | undefined) {
  if (typeof pv !== "number") return null;
  return pv >= 1000 ? `${(pv / 1000).toFixed(1)}k` : String(pv);
}

function HomeV2Hero({ total }: { total: number }) {
  const { t } = useTranslation();
  const siteConfig = useSiteConfig();

  return (
    <section className="mx-auto w-full max-w-6xl pb-8 pt-10">
      <div className="relative overflow-hidden rounded-3xl border border-black/5 bg-w p-6 shadow-soft sm:p-9 dark:border-white/10">
        <div className="pointer-events-none absolute -right-10 -top-10 h-56 w-56 rounded-full bg-theme/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-10 -left-10 h-56 w-56 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="relative z-10 flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div className="max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-theme/20 bg-theme/10 px-3 py-1 text-xs font-medium text-theme">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
              {t("home_v2.hero.badge")}
            </div>
            <h1 className="text-2xl font-extrabold leading-snug tracking-tight t-primary sm:text-3xl">
              {t("home_v2.hero.greeting")}{" "}
              <span className="bg-gradient-to-r from-theme via-theme-hover to-theme-active bg-clip-text text-transparent">
                {siteConfig.name}
              </span>{" "}
              👋
            </h1>
            {siteConfig.description ? (
              <p className="text-sm font-normal leading-relaxed t-secondary sm:text-base">{siteConfig.description}</p>
            ) : null}
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-black/5 bg-secondary px-3 py-1 font-medium t-primary transition-colors hover:bg-button dark:border-white/10">
                ✍️ {t("home_v2.hero.total$count", { count: total })}
              </span>
            </div>
          </div>
          <div className="flex w-full flex-row items-center justify-between gap-3 border-t border-black/5 pt-2 md:w-auto md:flex-col md:items-end md:border-t-0 md:pt-0 dark:border-white/10">
            <span className="font-mono text-[11px] t-secondary">{t("home_v2.hero.footnote", { year: new Date().getFullYear() })}</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function HomeV2FeedCard({ feed }: { feed: Feed }) {
  const { t } = useTranslation();
  const title = feed.title || t("home_v2.card.untitled");
  const vip = Boolean(feed.vipOnly);
  const reads = formatPv(feed.pv);

  return (
    <article className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-black/5 bg-w shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover dark:border-white/10">
      <div>
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-secondary">
          {feed.avatar ? (
            <img
              alt={title}
              src={feed.avatar}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center t-secondary">
              <i className="ri-image-line text-3xl" aria-hidden="true" />
            </div>
          )}
          {vip ? (
            <span className="absolute left-3 top-3 flex items-center gap-1 rounded-full border border-amber-100/60 bg-amber-50/80 px-2.5 py-0.5 text-[11px] font-bold text-amber-700 shadow-sm backdrop-blur-md dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300">
              <img src="/vip.svg" alt="" aria-hidden="true" className="h-3.5 w-3.5" />
              {t("home_v2.card.vip_badge")}
            </span>
          ) : null}
        </div>
        <div className="p-5">
          <div className="mb-2 flex items-center gap-2 font-mono text-[11px] t-secondary">
            <span>{formatShortDate(feed.createdAt)} {t("home_v2.card.published")}</span>
            {feed.updatedAt !== feed.createdAt ? (
              <>
                <span>·</span>
                <span>{formatShortDate(feed.updatedAt)} {t("home_v2.card.updated")}</span>
              </>
            ) : null}
          </div>
          <h2 className="mb-2 line-clamp-1 text-base font-bold leading-snug t-primary transition-colors group-hover:text-theme">
            <Link href={`/feed/${feed.id}`} target="_blank" rel="noopener noreferrer">{title}</Link>
          </h2>
          <p className="mb-4 line-clamp-2 text-xs leading-relaxed t-secondary">
            {feed.summary || (vip ? t("home_v2.card.vip_summary_hint") : "")}
          </p>
          {feed.hashtags.length > 0 ? (
            <div className="flex flex-wrap gap-1.5 border-t border-black/5 pt-3 dark:border-white/10">
              {feed.hashtags.map(({ id, name }) => (
                <HashTag key={id} name={name} />
              ))}
            </div>
          ) : null}
        </div>
      </div>
      <div className="flex items-center justify-between border-t border-black/5 bg-secondary/50 px-5 py-3 text-xs t-secondary dark:border-white/10">
        <span className="flex items-center gap-1 font-mono text-[11px]">
          {reads !== null ? `${reads} ${t("home_v2.card.reads")}` : ""}
        </span>
        {vip ? (
          <Link
            href={`/feed/${feed.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-theme via-theme-hover to-theme-active px-3.5 py-1.5 text-xs font-medium text-white shadow-md shadow-theme/20 transition-all hover:opacity-95 hover:shadow-lg"
          >
            {t("home_v2.card.unlock_read")} <span className="transition-transform group-hover:translate-x-0.5">→</span>
          </Link>
        ) : (
          <Link
            href={`/feed/${feed.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center text-xs font-semibold text-theme transition-transform group-hover:translate-x-1"
          >
            {t("home_v2.card.read_more")} →
          </Link>
        )}
      </div>
    </article>
  );
}

function HomeV2Pagination({ page, hasNext, size, limit }: { page: number; hasNext: boolean; size: number; limit: number }) {
  const { t } = useTranslation();
  const pageCount = Math.max(1, Math.ceil(size / limit), hasNext ? page + 1 : page);
  const pages = Array.from({ length: pageCount }, (_, index) => index + 1);

  return (
    <div className="mt-10 flex items-center justify-center gap-1.5 text-xs">
      {page > 1 ? (
        <Link href={`/?page=${page - 1}`} className="rounded-lg border border-black/5 bg-w px-3 py-1.5 font-medium t-primary transition-colors hover:bg-button dark:border-white/10">
          {t("home_v2.pagination.prev")}
        </Link>
      ) : (
        <span className="cursor-not-allowed rounded-lg border border-black/5 bg-w px-3 py-1.5 font-medium t-secondary dark:border-white/10">{t("home_v2.pagination.prev")}</span>
      )}
      {pages.map((value) =>
        value === page ? (
          <span key={value} className="flex h-8 w-8 items-center justify-center rounded-lg bg-theme font-semibold text-white shadow-xs">{value}</span>
        ) : (
          <Link key={value} href={`/?page=${value}`} className="flex h-8 w-8 items-center justify-center rounded-lg border border-black/5 bg-w font-medium t-primary transition-colors hover:bg-button dark:border-white/10">
            {value}
          </Link>
        ),
      )}
      {hasNext ? (
        <Link href={`/?page=${page + 1}`} className="rounded-lg border border-black/5 bg-w px-3 py-1.5 font-medium t-primary transition-colors hover:bg-button dark:border-white/10">
          {t("home_v2.pagination.next")}
        </Link>
      ) : (
        <span className="cursor-not-allowed rounded-lg border border-black/5 bg-w px-3 py-1.5 font-medium t-secondary dark:border-white/10">{t("home_v2.pagination.next")}</span>
      )}
    </div>
  );
}

function HomeV2Sidebar({ feeds, tags }: { feeds: Feed[]; tags: TagItem[] }) {
  const { t } = useTranslation();
  const clientConfig = useContext(ClientConfigContext);
  const rssEnabled = clientConfig.getBoolean("rss");
  const latest = feeds.slice(0, 5);
  const topTags = [...tags].sort((a, b) => b.feeds - a.feeds).slice(0, 7);
  const tagTints = [
    "bg-blue-50/80 hover:bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:hover:bg-blue-500/20 dark:text-blue-300",
    "bg-emerald-50/80 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 dark:text-emerald-300",
    "bg-indigo-50/80 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-500/10 dark:hover:bg-indigo-500/20 dark:text-indigo-300",
    "bg-amber-50/80 hover:bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:hover:bg-amber-500/20 dark:text-amber-300",
    "bg-purple-50/80 hover:bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:hover:bg-purple-500/20 dark:text-purple-300",
    "bg-rose-50/80 hover:bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 dark:text-rose-300",
    "bg-secondary t-primary hover:bg-button",
  ];

  return (
    <aside className="space-y-6 lg:col-span-4">
      <div className="rounded-2xl border border-black/5 bg-w p-5 shadow-soft dark:border-white/10">
        <div className="mb-3 flex items-center justify-between border-b border-black/5 pb-3 dark:border-white/10">
          <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider t-primary">
            <span>🔥</span> {t("home_v2.sidebar.latest")}
          </h3>
          <span className="font-mono text-[10px] t-secondary">LATEST</span>
        </div>
        <div className="space-y-3">
          {latest.map((feed, index) => (
            <Link key={feed.id} href={`/feed/${feed.id}`} target="_blank" rel="noopener noreferrer" className="group flex items-start gap-2.5 py-1">
              <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded font-mono text-xs font-bold ${index === 0 ? "bg-theme/10 text-theme" : "bg-secondary t-secondary"}`}>
                {index + 1}
              </span>
              <div className="min-w-0">
                <p className="line-clamp-1 text-xs font-medium leading-snug t-primary transition-colors group-hover:text-theme">{feed.title || t("home_v2.card.untitled")}</p>
                <span className="font-mono text-[10px] t-secondary">{formatShortDate(feed.createdAt)}{feed.hashtags[0] ? ` · ${feed.hashtags[0].name}` : ""}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {topTags.length > 0 ? (
        <div className="rounded-2xl border border-black/5 bg-w p-5 shadow-soft dark:border-white/10">
          <div className="mb-3 flex items-center justify-between border-b border-black/5 pb-3 dark:border-white/10">
            <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider t-primary">
              <span>🏷️</span> {t("home_v2.sidebar.tags")}
            </h3>
            <Link href="/hashtags" className="text-[11px] text-theme hover:underline">{t("home_v2.sidebar.tags_all")}</Link>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {topTags.map(({ id, name, feeds: count }, index) => (
              <Link key={id} href={`/hashtag/${name}`} className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${tagTints[index % tagTints.length]}`}>
                #{name} <span className="font-mono text-[10px] opacity-75">{count}</span>
              </Link>
            ))}
          </div>
        </div>
      ) : null}

      {rssEnabled ? (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-950 p-5 text-white shadow-soft">
          <div className="relative z-10 space-y-2.5">
            <span className="inline-block rounded-full border border-white/10 bg-white/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-theme">
              📮 RSS
            </span>
            <h3 className="text-sm font-bold tracking-tight text-white">{t("home_v2.sidebar.rss_title")}</h3>
            <p className="text-xs font-normal leading-relaxed text-slate-300">{t("home_v2.sidebar.rss_desc")}</p>
            <div className="pt-1">
              <a
                href="/rss.xml"
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full rounded-xl bg-gradient-to-r from-theme via-theme-hover to-theme-active px-3 py-2 text-center text-xs font-semibold text-white shadow-md shadow-theme/20 transition-all hover:opacity-95 active:scale-[0.98]"
              >
                {t("home_v2.sidebar.rss_action")}
              </a>
            </div>
          </div>
        </div>
      ) : null}
    </aside>
  );
}

export function HomeV2Page() {
  const { t } = useTranslation();
  const siteConfig = useSiteConfig();
  const query = new URLSearchParams(useSearch());
  const page = Math.max(1, Number.parseInt(query.get("page") ?? "1", 10) || 1);
  const limit = siteConfig.pageSize;
  const [result, setResult] = useState<FeedListResponse | null>(null);
  const [tags, setTags] = useState<TagItem[]>([]);
  const ref = useRef("");

  useEffect(() => {
    const key = `${page} ${limit}`;
    if (ref.current === key) return;
    ref.current = key;
    client.feed.list({ page, limit, type: "normal" }).then(({ data }) => {
      if (data) setResult(data);
    });
  }, [page, limit]);

  useEffect(() => {
    client.tag.list().then(({ data }) => {
      // 服务端 tag 列表返回 { id, name, feeds: number }，与 @rin/api 的 Tag.count 命名不一致
      const list = (data ?? []) as unknown as TagItem[];
      if (Array.isArray(list)) setTags(list.filter((tag) => tag.feeds > 0));
    });
  }, []);

  const feeds = Array.isArray(result?.data) ? result.data : [];
  const topTags = [...tags].sort((a, b) => b.feeds - a.feeds).slice(0, 4);

  return (
    <div className="home-v2">
      <Helmet>
        <title>{`${siteConfig.name} - ${siteConfig.description || siteName}`}</title>
        <meta property="og:site_name" content={siteName} />
        <meta property="og:title" content={siteConfig.name} />
        <meta property="og:image" content={siteConfig.avatar} />
      </Helmet>
      <HomeV2Hero total={result?.size ?? 0} />
      <main id="articles" className="mx-auto w-full max-w-6xl py-4">
        <div className="flex flex-col items-start justify-between gap-4 border-b border-black/5 pb-6 sm:flex-row sm:items-center dark:border-white/10">
          <div className="scrollbar-none flex w-full items-center gap-1.5 overflow-x-auto pb-1 sm:w-auto sm:pb-0">
            <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-neutral-800 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm dark:bg-neutral-200 dark:text-neutral-800">
              {t("home_v2.category.all")}
              {result ? <span className="rounded-full bg-white/15 px-1.5 py-0.5 font-mono text-[10px] dark:bg-black/10">{result.size}</span> : null}
            </span>
            {topTags.map(({ id, name, feeds: count }) => (
              <Link
                key={id}
                href={`/hashtag/${name}`}
                className="flex shrink-0 items-center gap-1 rounded-full border border-black/5 bg-w px-3.5 py-1.5 text-xs font-medium t-secondary transition-colors hover:bg-button dark:border-white/10"
              >
                # {name} <span className="font-mono text-[10px] t-secondary">{count}</span>
              </Link>
            ))}
          </div>
        </div>
        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12">
          <section className="lg:col-span-8">
            <Waiting for={result !== null}>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {feeds.map((feed) => (
                  <HomeV2FeedCard key={feed.id} feed={feed} />
                ))}
              </div>
              <HomeV2Pagination page={page} hasNext={Boolean(result?.hasNext)} size={result?.size ?? 0} limit={limit} />
            </Waiting>
          </section>
          <HomeV2Sidebar feeds={feeds} tags={tags} />
        </div>
      </main>
    </div>
  );
}
