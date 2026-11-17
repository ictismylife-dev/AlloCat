import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, Plugin } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

const rootDir = path.dirname(fileURLToPath(import.meta.url));

/**
 * Copies built assets into `docs/assets/` and `public/assets/` while preserving `docs/index.html`,
 * `docs/404.html`, and `docs/.nojekyll` tracked by Git for GitHub Pages and standalone HTML bundling.
 */
function githubPagesPlugin(): Plugin {
  return {
    name: 'github-pages-prepare',
    apply: 'build',
    closeBundle() {
      try {
        const distDir = path.resolve(rootDir, 'dist');
        const indexHtmlPath = path.join(distDir, 'index.html');
        if (!fs.existsSync(indexHtmlPath)) return;

        // Remove the static-root fallback script from compiled index.html in dist/
        let builtHtml = fs.readFileSync(indexHtmlPath, 'utf-8');
        builtHtml = builtHtml.replace(
          /<script id="gh-pages-root-fallback">[\s\S]*?<\/script>\s*/i,
          ''
        );
        fs.writeFileSync(indexHtmlPath, builtHtml, 'utf-8');

        // Create 404.html and .nojekyll in dist/
        fs.writeFileSync(path.join(distDir, '404.html'), builtHtml, 'utf-8');
        fs.writeFileSync(path.join(distDir, '.nojekyll'), '# Disable Jekyll\n', 'utf-8');

        // Copy compiled assets into docs/assets/ and public/assets/
        const distAssetsDir = path.join(distDir, 'assets');
        const docsAssetsDir = path.resolve(rootDir, 'docs', 'assets');
        const publicAssetsDir = path.resolve(rootDir, 'public', 'assets');
        if (fs.existsSync(distAssetsDir)) {
          fs.mkdirSync(docsAssetsDir, { recursive: true });
          fs.cpSync(distAssetsDir, docsAssetsDir, { recursive: true });
          fs.mkdirSync(publicAssetsDir, { recursive: true });
          fs.cpSync(distAssetsDir, publicAssetsDir, { recursive: true });
        }
      } catch (err) {
        console.error('Failed to prepare GitHub Pages artifacts:', err);
      }
    },
  };
}

export default defineConfig(() => {
  return {
    base: './',
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['apple-touch-icon.png', 'icon.svg'],
        manifest: {
          id: '/',
          name: 'AlloCat — Resource & Capacity Planner',
          short_name: 'AlloCat',
          description:
            'Interactive annual resource allocation matrix for planning team staffing across clients and projects with real-time capacity and overtime tracking.',
          theme_color: '#4F46E5',
          background_color: '#020617',
          display: 'standalone',
          start_url: '/',
          scope: '/',
          icons: [
            {
              src: '/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-maskable-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        workbox: {
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'gstatic-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
          ],
        },
        devOptions: {
          enabled: true,
          type: 'module',
        },
      }),
      githubPagesPlugin(),
    ],
    resolve: {
      alias: {
        '@': path.resolve(rootDir, '.'),
      },
    },
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      rollupOptions: {
        output: {
          entryFileNames: 'assets/app.js',
          chunkFileNames: 'assets/[name].js',
          assetFileNames: 'assets/app.[ext]',
        },
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
