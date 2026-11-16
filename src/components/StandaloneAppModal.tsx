import React, { useState } from 'react';
import {
  X,
  Monitor,
  Download,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  FileCode2,
  Terminal,
  Laptop,
  WifiOff,
  AppWindow,
  HardDriveDownload
} from 'lucide-react';
import { AppState } from '../data/seedData';
import { triggerFileDownload } from '../utils/importExportUtils';
import { usePWAInstall } from '../utils/usePWAInstall';

interface StandaloneAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  appState: AppState;
}

export const StandaloneAppModal: React.FC<StandaloneAppModalProps> = ({
  isOpen,
  onClose,
  appState
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [isBundlingHtml, setIsBundlingHtml] = useState(false);
  const [status, setStatus] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  if (!isOpen) return null;

  const dateStr = new Date().toISOString().slice(0, 10);

  const buildStandaloneHtmlString = async (): Promise<string> => {
    const fetchAssetText = async (paths: string[]) => {
      for (const p of paths) {
        try {
          const res = await fetch(p);
          if (res.ok) {
            const text = await res.text();
            if (
              text &&
              !text.trim().startsWith('<!DOCTYPE html>') &&
              !text.trim().startsWith('<!doctype html>')
            ) {
              return text;
            }
          }
        } catch {
          // try next path
        }
      }
      return null;
    };

    const cssText = await fetchAssetText([
      './assets/app.css',
      './docs/assets/app.css',
      '/assets/app.css',
      '/docs/assets/app.css',
      '/AlloCat/assets/app.css',
      '/AlloCat/docs/assets/app.css'
    ]);
    const jsText = await fetchAssetText([
      './assets/app.js',
      './docs/assets/app.js',
      '/assets/app.js',
      '/docs/assets/app.js',
      '/AlloCat/assets/app.js',
      '/AlloCat/docs/assets/app.js'
    ]);

    if (!jsText) {
      throw new Error('Compiled application bundle not found.');
    }

    const embeddedJson = JSON.stringify(appState).replace(/<\//g, '<\\/');

    return `<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>AlloCat — Resource & Capacity Planner (${dateStr})</title>
  <meta name="theme-color" content="#4F46E5" />
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>${cssText || ''}</style>
</head>
<body class="bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 antialiased selection:bg-indigo-600 selection:text-white">
  <div id="root"></div>
  <script>window.__ALLOCAT_EMBEDDED_STATE__ = ${embeddedJson};</script>
  <script type="module">${jsText}</script>
</body>
</html>`;
  };

  const handleDownloadPortableHTML = async () => {
    setIsBundlingHtml(true);
    setStatus(null);
    try {
      const html = await buildStandaloneHtmlString();
      triggerFileDownload(
        html,
        `AlloCat-Standalone.html`,
        'text/html;charset=utf-8'
      );
      setStatus({
        type: 'success',
        message:
          'Downloaded AlloCat-Standalone.html! You can double-click it on any Windows PC to run AlloCat offline with all your current data embedded.'
      });
    } catch {
      setStatus({
        type: 'error',
        message: 'Could not bundle the standalone HTML file.'
      });
    } finally {
      setIsBundlingHtml(false);
    }
  };

  const handleDownloadWindowsLauncherBat = () => {
    const batContent = [
      '@echo off',
      'title AlloCat - Resource & Capacity Planner',
      'setlocal',
      'set "LOCAL_HTML=%~dp0AlloCat-Standalone.html"',
      'set "APP_URL=https://ictismylife-dev.github.io/AlloCat/"',
      '',
      'if exist "%LOCAL_HTML%" (',
      '  for %%I in ("%LOCAL_HTML%") do set "TARGET=file:///%%~fI"',
      ') else (',
      '  set "TARGET=%APP_URL%"',
      ')',
      '',
      'REM Launch in native frameless Windows App Mode via Microsoft Edge or Chrome',
      'where msedge >nul 2>nul',
      'if %ERRORLEVEL% EQU 0 (',
      '  start "" msedge --app="%TARGET%" --window-size=1640,960',
      '  exit /b 0',
      ')',
      '',
      'if exist "%ProgramFiles(x86)%\\Microsoft\\Edge\\Application\\msedge.exe" (',
      '  start "" "%ProgramFiles(x86)%\\Microsoft\\Edge\\Application\\msedge.exe" --app="%TARGET%" --window-size=1640,960',
      '  exit /b 0',
      ')',
      '',
      'if exist "%ProgramFiles%\\Microsoft\\Edge\\Application\\msedge.exe" (',
      '  start "" "%ProgramFiles%\\Microsoft\\Edge\\Application\\msedge.exe" --app="%TARGET%" --window-size=1640,960',
      '  exit /b 0',
      ')',
      '',
      'if exist "%ProgramFiles%\\Google\\Chrome\\Application\\chrome.exe" (',
      '  start "" "%ProgramFiles%\\Google\\Chrome\\Application\\chrome.exe" --app="%TARGET%" --window-size=1640,960',
      '  exit /b 0',
      ')',
      '',
      'start "" "%TARGET%"',
      'exit /b 0'
    ].join('\r\n');

    triggerFileDownload(
      batContent,
      'AlloCat-Windows-Launcher.bat',
      'application/x-bat;charset=utf-8'
    );
    setStatus({
      type: 'success',
      message:
        'Downloaded AlloCat-Windows-Launcher.bat! Place it in the same folder as AlloCat-Standalone.html (or run it directly) to open AlloCat in a native frameless Windows desktop window.'
    });
  };

  const handleDownloadFullWindowsBundle = async () => {
    await handleDownloadPortableHTML();
    setTimeout(() => {
      handleDownloadWindowsLauncherBat();
    }, 350);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-3xl max-h-[88vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-100/90 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Monitor className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Standalone Windows & Offline Desktop App
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 rounded-md border border-emerald-200 dark:border-emerald-800">
                  Windows 10 / 11 Ready
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Install AlloCat directly onto Windows (Start Menu, Taskbar & Desktop) or download a portable offline executable
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs">
          {status && (
            <div
              className={`p-3.5 rounded-xl border flex items-start gap-2.5 ${
                status.type === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                  : 'bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
              }`}
            >
              {status.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              )}
              <div className="leading-relaxed font-medium">{status.message}</div>
            </div>
          )}

          {/* Method 1: Native Windows PWA Installation */}
          <div className="p-5 rounded-xl bg-gradient-to-r from-indigo-50/90 via-blue-50/70 to-indigo-50/90 dark:from-indigo-950/40 dark:via-slate-900 dark:to-indigo-950/40 border border-indigo-200/90 dark:border-indigo-800/80 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <AppWindow className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Option 1: Install as Native Windows App (PWA)
                  </span>
                  <span className="px-2 py-0.5 text-[10px] font-mono font-semibold bg-indigo-600 text-white rounded-full">
                    Recommended
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  AlloCat is a compliant Progressive Web App with offline service worker caching. Installing it adds AlloCat to your <strong>Windows Start Menu</strong>, <strong>Taskbar</strong>, and <strong>Desktop</strong> in its own standalone window without browser tabs.
                </p>
              </div>

              {isInstalled ? (
                <div className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 text-white font-semibold shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Installed in Standalone Mode</span>
                </div>
              ) : isInstallable ? (
                <button
                  type="button"
                  onClick={async () => {
                    const ok = await install();
                    if (ok) {
                      setStatus({
                        type: 'success',
                        message:
                          'AlloCat has been installed on your device! You can now launch it from your Windows Start Menu, Desktop, or Taskbar.'
                      });
                    }
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-sm transition-all cursor-pointer shrink-0"
                >
                  <Monitor className="w-4 h-4" />
                  <span>Install on Windows Now</span>
                </button>
              ) : null}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="p-3 rounded-lg bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 space-y-1">
                <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <Laptop className="w-3.5 h-3.5 text-indigo-600" />
                  <span>In Microsoft Edge (Windows 10/11)</span>
                </div>
                <ol className="list-decimal list-inside text-[11px] text-slate-600 dark:text-slate-300 space-y-0.5">
                  <li>Click the <strong>App Available</strong> icon in the address bar (or <strong>⋯</strong> menu)</li>
                  <li>Select <strong>Apps → Install AlloCat as an app</strong></li>
                  <li>Check <strong>Pin to taskbar</strong> & <strong>Create Desktop shortcut</strong></li>
                </ol>
              </div>

              <div className="p-3 rounded-lg bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 space-y-1">
                <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <WifiOff className="w-3.5 h-3.5 text-emerald-600" />
                  <span>In Google Chrome (Windows / macOS)</span>
                </div>
                <ol className="list-decimal list-inside text-[11px] text-slate-600 dark:text-slate-300 space-y-0.5">
                  <li>Click the <strong>Install AlloCat</strong> monitor icon on the right of the URL bar</li>
                  <li>Or open <strong>⋮ Menu → Cast, save, and share → Install AlloCat...</strong></li>
                  <li>Launches in a dedicated desktop window & works offline</li>
                </ol>
              </div>
            </div>

            {isIOS && (
              <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-800 dark:text-amber-200">
                <strong>iOS / iPadOS Safari:</strong> Tap the <strong>Share</strong> button in Safari and select <strong>Add to Home Screen</strong>.
              </div>
            )}
          </div>

          {/* Method 2: Portable Offline Windows Package (HTML + .BAT) */}
          <div className="p-5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <HardDriveDownload className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Option 2: Portable Offline Windows App & Desktop Launcher
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Need a 100% self-contained offline package on your Windows PC or USB drive without installing a browser PWA? Download the portable bundle below.
                </p>
              </div>

              <button
                type="button"
                onClick={handleDownloadFullWindowsBundle}
                disabled={isBundlingHtml}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold shadow-sm transition-all cursor-pointer shrink-0"
              >
                <Sparkles className="w-4 h-4" />
                <span>
                  {isBundlingHtml
                    ? 'Bundling App...'
                    : 'Download Portable Windows Bundle'}
                </span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between gap-3">
                <div className="space-y-1">
                  <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <FileCode2 className="w-3.5 h-3.5 text-indigo-500" />
                    <span>1. Portable Offline File</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Single-file <code>AlloCat-Standalone.html</code> containing the entire compiled app and your current data.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadPortableHTML}
                  disabled={isBundlingHtml}
                  className="w-full py-1.5 px-3 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold text-slate-700 dark:text-slate-200 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>AlloCat-Standalone.html</span>
                </button>
              </div>

              <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between gap-3">
                <div className="space-y-1">
                  <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-indigo-500" />
                    <span>2. Windows App Launcher</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Batch launcher (<code>.bat</code>) that opens AlloCat in native Windows Edge/Chrome frameless <code>--app</code> mode.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadWindowsLauncherBat}
                  className="w-full py-1.5 px-3 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold text-slate-700 dark:text-slate-200 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Windows-Launcher.bat</span>
                </button>
              </div>
            </div>
          </div>

          {/* Method 3: Native Windows .EXE via Electron */}
          <div className="p-4 rounded-xl bg-slate-100/80 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200">
              <Terminal className="w-4 h-4 text-indigo-500" />
              <span>Option 3: Build a Standalone Windows .EXE Installer (Electron)</span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
              This repository also includes an Electron desktop wrapper (<code>electron/main.cjs</code>). To build a native Windows <code>.exe</code> installer locally from the source repository, run:
            </p>
            <pre className="p-2.5 rounded-lg bg-slate-900 text-slate-100 font-mono text-[11px] overflow-x-auto">
              npm install --save-dev electron electron-builder && npx electron-builder --win --x64
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
