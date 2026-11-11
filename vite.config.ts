import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, Plugin } from 'vite';

const rootDir = path.dirname(fileURLToPath(import.meta.url));

/**
 * Copies built assets into `docs/assets/` while preserving `docs/index.html`,
 * `docs/404.html`, and `docs/.nojekyll` tracked by Git for GitHub Pages.
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

        // Copy compiled assets into docs/assets/ without deleting tracked docs/ files
        const distAssetsDir = path.join(distDir, 'assets');
        const docsAssetsDir = path.resolve(rootDir, 'docs', 'assets');
        if (fs.existsSync(distAssetsDir)) {
          fs.mkdirSync(docsAssetsDir, { recursive: true });
          fs.cpSync(distAssetsDir, docsAssetsDir, { recursive: true });
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
    plugins: [react(), tailwindcss(), githubPagesPlugin()],
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
