import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { visualizer } from "rollup-plugin-visualizer";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const isDev = mode === 'development';
  const serverPort = Number(process.env.RIN_SERVER_PORT || "11499");
  const serverTarget = `http://127.0.0.1:${serverPort}`;
  const cacheDir = process.env.RIN_VITE_CACHE_DIR || "../.vite/client";
  
  return {
    cacheDir,
    // Note: Client configuration is fetched from server at runtime
    // No environment variables are injected at build time
    build: {
      outDir: '../dist/client',
      emptyOutDir: true,
      rollupOptions: {
        output: {
          // 按库分包：重型依赖只在对应路由的 chunk 里被引用，独立成块便于按需加载与长缓存。
          // 注意顺序：先判具体库名，再判泛 react（react-syntax-highlighter 等含 "react" 子串）。
          manualChunks(id: string) {
            if (!id.includes('node_modules')) return;
            if (id.includes('mermaid')) return 'mermaid';
            if (id.includes('monaco-editor')) return 'monaco';
            if (id.includes('katex')) return 'katex';
            if (id.includes('react-syntax-highlighter') || id.includes('refractor') || id.includes('prismjs')) {
              return 'syntax-highlighter';
            }
            if (/(^|\/)node_modules\/(react|react-dom|scheduler|react-i18next|i18next|i18next-browser-languagedetector|i18next-http-backend|wouter)\//.test(id)) {
              return 'vendor';
            }
          },
        },
      },
    },
    plugins: [
      react(),
      // Only open visualizer in build mode
      visualizer({ open: !isDev })
    ],
    server: {
      proxy: {
        "/api": {
          target: serverTarget,
          changeOrigin: false,
        },
        "/rss.xml": {
          target: serverTarget,
          changeOrigin: false,
        },
        "/atom.xml": {
          target: serverTarget,
          changeOrigin: false,
        },
        "/rss.json": {
          target: serverTarget,
          changeOrigin: false,
        },
        "/feed.json": {
          target: serverTarget,
          changeOrigin: false,
        },
        "/feed.xml": {
          target: serverTarget,
          changeOrigin: false,
        },
      },
    },
  }
})
