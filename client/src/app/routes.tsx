import type { ReactNode } from "react";
import { lazy, Suspense, useContext } from "react";
import ReactLoading from "react-loading";
import type { DefaultParams, PathPattern } from "wouter";
import { Route, Switch } from "wouter";
import { AdminLayout } from "../components/admin-layout";
import Footer from "../components/footer";
import { Header } from "../components/header";
import { Padding } from "../components/padding";
import { getEffectiveHeaderLayout } from "../components/site-header/layout-options";
import { getHeaderLayoutDefinition } from "../components/site-header/layout-registry";
import { Tips, TipsPage } from "../components/tips";
import useTableOfContents from "../hooks/useTableOfContents";
import { useSiteConfig } from "../hooks/useSiteConfig";
import { ErrorPage } from "../page/error";
import { TOCHeader } from "../page/feed-toc-header";
import { ProfileContext } from "../state/profile";
import { tryInt } from "../utils/int";
import { useTranslation } from "react-i18next";

// 页面级代码分割：重型依赖（mermaid/monaco/语法高亮/katex）只随对应路由按需加载
const CallbackPage = lazy(() => import("../page/callback").then(({ CallbackPage }) => ({ default: CallbackPage })));
const CompatTasksPage = lazy(() =>
  import("../page/compat-tasks").then(({ CompatTasksPage }) => ({ default: CompatTasksPage })),
);
const FeedPage = lazy(() => import("../page/feed").then(({ FeedPage }) => ({ default: FeedPage })));
const FeedsPage = lazy(() => import("../page/feeds").then(({ FeedsPage }) => ({ default: FeedsPage })));
const HomeV2Page = lazy(() => import("../components/home-v2").then(({ HomeV2Page }) => ({ default: HomeV2Page })));
const FriendsPage = lazy(() => import("../page/friends").then(({ FriendsPage }) => ({ default: FriendsPage })));
const HealthPage = lazy(() => import("../page/health").then(({ HealthPage }) => ({ default: HealthPage })));
const HashtagPage = lazy(() => import("../page/hashtag").then(({ HashtagPage }) => ({ default: HashtagPage })));
const HashtagsPage = lazy(() => import("../page/hashtags").then(({ HashtagsPage }) => ({ default: HashtagsPage })));
const LoginPage = lazy(() => import("../page/login").then(({ LoginPage }) => ({ default: LoginPage })));
const MomentsPage = lazy(() => import("../page/moments").then(({ MomentsPage }) => ({ default: MomentsPage })));
const ProfilePage = lazy(() => import("../page/profile").then(({ ProfilePage }) => ({ default: ProfilePage })));
const QueueStatusPage = lazy(() =>
  import("../page/queue-status").then(({ QueueStatusPage }) => ({ default: QueueStatusPage })),
);
const SearchPage = lazy(() => import("../page/search").then(({ SearchPage }) => ({ default: SearchPage })));
const Settings = lazy(() => import("../page/settings").then(({ Settings }) => ({ default: Settings })));
const TimelinePage = lazy(() => import("../page/timeline").then(({ TimelinePage }) => ({ default: TimelinePage })));
const WritingPage = lazy(() => import("../page/writing").then(({ WritingPage }) => ({ default: WritingPage })));

function RouteFallback() {
  return (
    <div className="flex justify-center py-24">
      <ReactLoading type="spin" color="#FC466B" width={32} height={32} />
    </div>
  );
}

export function AppRoutes() {
  const { t } = useTranslation();

  return (
    <Suspense fallback={<RouteFallback />}>
      <Switch>
      <HomeRoute path="/">
        <FeedsPage />
      </HomeRoute>

      <AppRoute path="/timeline">
        <TimelinePage />
      </AppRoute>

      <AppRoute path="/moments">
        <MomentsPage />
      </AppRoute>

      <AppRoute path="/friends">
        <FriendsPage />
      </AppRoute>

      <AppRoute path="/hashtags">
        <HashtagsPage />
      </AppRoute>

      <AppRoute path="/hashtag/:name">
        {(params) => <HashtagPage name={params.name || ""} />}
      </AppRoute>

      <AppRoute path="/search/:keyword">
        {(params) => <SearchPage keyword={params.keyword || ""} />}
      </AppRoute>

      <AdminRoute path="/admin/settings" requirePermission title={t("settings.title")} description={t("admin.settings_description")}>
        <Settings />
      </AdminRoute>

      <AdminRoute path="/admin/health" requirePermission title={t("health.title")} description={t("admin.health_description")}>
        <HealthPage />
      </AdminRoute>

      <AdminRoute path="/admin/queue-status" requirePermission title={t("queue_status.title")} description={t("admin.queue_status_description")}>
        <QueueStatusPage />
      </AdminRoute>

      <AdminRoute path="/admin/compat-tasks" requirePermission title={t("compat_tasks.title")} description={t("admin.compat_tasks_description")}>
        <CompatTasksPage />
      </AdminRoute>

      <AdminRoute path="/admin/writing" requirePermission title={t("writing")} description={t("admin.writing_description")}>
        <WritingPage />
      </AdminRoute>

      <AdminRoute path="/admin/writing/:id" requirePermission title={t("writing")} description={t("admin.writing_description")}>
        {({ id }) => <WritingPage id={tryInt(0, id)} />}
      </AdminRoute>

      <AppRoute path="/callback">
        <CallbackPage />
      </AppRoute>

      <AppRoute path="/login">
        <LoginPage />
      </AppRoute>

      <AppRoute path="/profile">
        <ProfilePage />
      </AppRoute>

      <TocRoute path="/feed/:id">
        {(params, toc, cleanup) => <FeedPage id={params.id || ""} TOC={toc} clean={cleanup} />}
      </TocRoute>

      <TocRoute path="/:alias">
        {(params, toc, cleanup) => <FeedPage id={params.alias || ""} TOC={toc} clean={cleanup} />}
      </TocRoute>

      <AppRoute path="/user/github">
        <TipsPage>
          <Tips value={t("error.api_url")} type="error" />
        </TipsPage>
      </AppRoute>

      <AppRoute path="/*/user/github">
        <TipsPage>
          <Tips value={t("error.api_url_slash")} type="error" />
        </TipsPage>
      </AppRoute>

      <AppRoute path="/user/github/callback">
        <TipsPage>
          <Tips value={t("error.github_callback")} type="error" />
        </TipsPage>
      </AppRoute>

      <AppRoute>
        <ErrorPage error={t("error.not_found")} />
      </AppRoute>
      </Switch>
    </Suspense>
  );
}

function HomeRoute({ path, children }: { path: PathPattern; children: ReactNode }) {
  const siteConfig = useSiteConfig();

  // v2 首页同样走站点 shell（Header/Padding/Footer），只是内容不同
  return (
    <AppRoute path={path}>
      {siteConfig.homeVersion === "v2" ? <HomeV2Page /> : children}
    </AppRoute>
  );
}

function AppRoute({
  path,
  children,
  headerComponent,
  paddingClassName,
  requirePermission,
}: {
  path?: PathPattern;
  children: ReactNode | ((params: DefaultParams) => ReactNode);
  headerComponent?: ReactNode;
  paddingClassName?: string;
  requirePermission?: boolean;
}) {
  const profile = useContext(ProfileContext);
  const siteConfig = useSiteConfig();
  const { t } = useTranslation();

  const content =
    requirePermission && !profile?.permission ? <ErrorPage error={t("error.permission_denied")} /> : children;

  return (
    <Route path={path}>
      {(params) => {
        const resolvedContent = typeof content === "function" ? content(params) : content;
        const layoutDefinition = getHeaderLayoutDefinition(getEffectiveHeaderLayout(siteConfig));

        return layoutDefinition.renderRouteShell({
          header: <Header>{headerComponent}</Header>,
          content: <Padding className={paddingClassName}>{resolvedContent}</Padding>,
          footer: <Footer />,
          paddingClassName,
        });
      }}
    </Route>
  );
}

function AdminRoute({
  path,
  children,
  requirePermission,
  title,
  description,
}: {
  path: PathPattern;
  children: ReactNode | ((params: DefaultParams) => ReactNode);
  requirePermission?: boolean;
  title: string;
  description: string;
}) {
  const profile = useContext(ProfileContext);
  const { t } = useTranslation();
  const content =
    requirePermission && !profile?.permission ? <ErrorPage error={t("error.permission_denied")} /> : children;

  return (
    <Route path={path}>
      {(params) => (
        <AdminLayout title={title} description={description}>
          {typeof content === "function" ? content(params) : content}
        </AdminLayout>
      )}
    </Route>
  );
}

function TocRoute({
  path,
  children,
}: {
  path: PathPattern;
  children: (params: DefaultParams, toc: () => JSX.Element, cleanup: (id: string) => void) => ReactNode;
}) {
  const { TOC, cleanup } = useTableOfContents(".toc-content");

  return (
    <AppRoute path={path} headerComponent={TOCHeader({ TOC })} paddingClassName="mx-4">
      {(params) => children(params, TOC, cleanup)}
    </AppRoute>
  );
}
