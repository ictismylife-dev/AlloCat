import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, Plugin } from 'vite';

const rootDir = path.dirname(fileURLToPath(import.meta.url));

/**
 * Prepares the build output in both `dist/` (for GitHub Actions) and `docs/`
 * (for GitHub Pages branch deployment at https://ictismylife-dev.github.io/AlloCat/),
 * including SPA `404.html` and `.nojekyll`.
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

        // Remove the static-root fallback script from compiled index.html in dist/ and docs/
        let builtHtml = fs.readFileSync(indexHtmlPath, 'utf-8');
        builtHtml = builtHtml.replace(
          /<script id="gh-pages-root-fallback">[\s\S]*?<\/script>\s*/i,
          ''
        );
        fs.writeFileSync(indexHtmlPath, builtHtml, 'utf-8');

        // Create 404.html and .nojekyll in dist/
        fs.writeFileSync(path.join(distDir, '404.html'), builtHtml, 'utf-8');
        fs.writeFileSync(path.join(distDir, '.nojekyll'), '', 'utf-8');

        // Mirror dist/ into docs/ so GitHub Pages branch deployment (/docs or / root) works out of the box
        const docsDir = path.resolve(rootDir, 'docs');
        if (fs.existsSync(docsDir)) {
          fs.rmSync(docsDir, { recursive: true, force: true });
        }
        fs.cpSync(distDir, docsDir, { recursive: true });

        // Ensure .nojekyll and 404.html exist in project root as well
        fs.writeFileSync(path.resolve(rootDir, '.nojekyll'), '', 'utf-8');
        const rootIndexHtml = fs.readFileSync(path.resolve(rootDir, 'index.html'), 'utf-8');
        fs.writeFileSync(path.resolve(rootDir, '404.html'), rootIndexHtml, 'utf-8');
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
