import React, { useRef, useState } from 'react';
import {
  X,
  Download,
  Upload,
  FileSpreadsheet,
  FileJson,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Globe,
  Sparkles
} from 'lucide-react';
import { MONTH_NAMES } from '../types';
import { AppState } from '../data/seedData';

interface ExportImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  appState: AppState;
  onImportState: (newState: AppState) => void;
  onResetToDefault: () => void;
}

export const ExportImportModal: React.FC<ExportImportModalProps> = ({
  isOpen,
  onClose,
  appState,
  onImportState,
  onResetToDefault
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [isBundlingHtml, setIsBundlingHtml] = useState(false);

  if (!isOpen) return null;

  // Download self-contained single-file HTML browser app with current state embedded
  const handleDownloadStandaloneHTML = async () => {
    setIsBundlingHtml(true);
    setStatus(null);
    try {
      const fetchAssetText = async (paths: string[]) => {
        for (const p of paths) {
          try {
            const res = await fetch(p);
            if (res.ok) {
              const text = await res.text();
              if (text && !text.trim().startsWith('<!DOCTYPE html>')) {
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
        '/AlloCat/assets/app.css',
        '/AlloCat/docs/assets/app.css'
      ]);
      const jsText = await fetchAssetText([
        './assets/app.js',
        './docs/assets/app.js',
        '/AlloCat/assets/app.js',
        '/AlloCat/docs/assets/app.js'
      ]);

      if (!jsText) {
        throw new Error('Compiled bundle not found');
      }

      const embeddedJson = JSON.stringify(appState).replace(/<\//g, '<\\/');
      const dateStr = new Date().toISOString().slice(0, 10);

      const standaloneHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>AlloCat — Resource & Capacity Planner (${dateStr})</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>${cssText || ''}</style>
</head>
<body class="bg-slate-50 text-slate-900 antialiased selection:bg-indigo-600 selection:text-white">
  <div id="root"></div>
  <script>window.__ALLOCAT_EMBEDDED_STATE__ = ${embeddedJson};</script>
  <script type="module">${jsText}</script>
</body>
</html>`;

      const blob = new Blob([standaloneHtml], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `AlloCat-Browser-App-${dateStr}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setStatus({
        type: 'success',
        message:
          'Standalone browser app downloaded! Double-click that .html file to run AlloCat directly in any browser with your current data.'
      });
    } catch {
      setStatus({
        type: 'error',
        message: 'Could not bundle standalone HTML file. Please use Full Backup (.JSON) below.'
      });
    } finally {
      setIsBundlingHtml(false);
    }
  };

  const handleExportJSON = () => {
    const jsonString = JSON.stringify(appState, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const dateStr = new Date().toISOString().slice(0, 10);
    const link = document.createElement('a');
    link.href = url;
    link.download = `allocat-backup-${dateStr}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportCSV = () => {
    const { people, clients, projects, allocations, selectedYear } = appState;
    const escapeCsv = (val: string | number | undefined) => {
      const str = String(val ?? '');
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const headers = [
      'Year',
      'Person Name',
      'Role',
      'Department',
      'Person Comment',
      'Client',
      'Project',
      'Project Code',
      'Assignment Note',
      ...MONTH_NAMES
    ];

    const rows: string[][] = [headers.map(escapeCsv)];

    allocations
      .filter((a) => a.year === selectedYear)
      .forEach((alloc) => {
        const person = people.find((p) => p.id === alloc.personId);
        const project = projects.find((p) => p.id === alloc.projectId);
        if (!person || !project) return;
        const client = clients.find((c) => c.id === project.clientId);

        rows.push(
          [
            selectedYear,
            person.name,
            person.role,
            person.department,
            person.notes || '',
            client?.name || '',
            project.name,
            project.code,
            alloc.notes || project.notes || '',
            ...alloc.monthlyPercentage.map((v) => `${v}%`)
          ].map(escapeCsv)
        );
      });

    const csvContent = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const dateStr = new Date().toISOString().slice(0, 10);
    const link = document.createElement('a');
    link.href = url;
    link.download = `allocat-allocations-${selectedYear}-${dateStr}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text) as Partial<AppState>;
        if (
          !Array.isArray(parsed.people) ||
          !Array.isArray(parsed.clients) ||
          !Array.isArray(parsed.projects) ||
          !Array.isArray(parsed.allocations)
        ) {
          setStatus({
            type: 'error',
            message: 'Invalid backup file format. Missing required arrays.'
          });
          return;
        }

        const safeYears =
          Array.isArray(parsed.availableYears) && parsed.availableYears.length > 0
            ? parsed.availableYears
            : [2025, 2026, 2027];

        const safeDepts =
          Array.isArray(parsed.departments) && parsed.departments.length > 0
            ? parsed.departments
            : Array.from(new Set(parsed.people.map((p) => p.department)));

        onImportState({
          people: parsed.people,
          clients: parsed.clients,
          projects: parsed.projects,
          allocations: parsed.allocations,
          leaves: Array.isArray(parsed.leaves) ? parsed.leaves : [],
          availableYears: safeYears,
          selectedYear:
            typeof parsed.selectedYear === 'number' ? parsed.selectedYear : safeYears[0],
          departments: safeDepts
        });

        setStatus({
          type: 'success',
          message: `Imported ${parsed.people.length} team members and ${parsed.projects.length} projects!`
        });
      } catch {
        setStatus({
          type: 'error',
          message: 'Failed to parse JSON backup file.'
        });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg overflow-hidden">
        <div className="px-5 py-4 bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Browser App, Import & Export
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Download standalone browser app, or backup & restore workspace data
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-5 max-h-[82vh] overflow-y-auto">
          {status && (
            <div
              className={`p-3 rounded-lg border flex items-start gap-2.5 text-xs ${
                status.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border-rose-200 text-rose-700'
              }`}
            >
              {status.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              )}
              <span className="font-medium">{status.message}</span>
            </div>
          )}

          {/* Standalone Single-File Browser App */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-900 text-white border border-indigo-500/30 shadow-md">
            <div className="flex items-start gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 flex items-center justify-center shrink-0">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-white">
                    Run Directly in Browser (Single HTML File)
                  </h3>
                  <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5" /> Portable
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                  Download AlloCat and your current data into a single self-contained{' '}
                  <code className="text-indigo-200 font-mono">.html</code> file that opens directly in any browser without a server.
                </p>
              </div>
            </div>

            <button
              type="button"
              disabled={isBundlingHtml}
              onClick={handleDownloadStandaloneHTML}
              className="mt-3.5 w-full py-2.5 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>
                {isBundlingHtml
                  ? 'Bundling Standalone Browser App...'
                  : 'Download Standalone Browser App (.html)'}
              </span>
            </button>
          </div>

          {/* Export Section */}
          <div>
            <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Export Workspace
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleExportJSON}
                className="flex flex-col items-start p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-400 text-left"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600 flex items-center justify-center mb-2">
                  <FileJson className="w-4 h-4" />
                </div>
                <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                  Full Backup (.JSON)
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Complete lossless backup of all people, comments, projects, leaves, and years.
                </p>
              </button>

              <button
                type="button"
                onClick={handleExportCSV}
                className="flex flex-col items-start p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-emerald-400 text-left"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center mb-2">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                  Spreadsheet (.CSV)
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Export {appState.selectedYear} allocations and comments for Excel or Google Sheets.
                </p>
              </button>
            </div>
          </div>

          {/* Import Section */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
            <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Import Full Backup (.JSON)
            </h3>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-3 px-4 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 flex items-center justify-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer"
            >
              <Upload className="w-4 h-4 text-blue-600" />
              <span>Select a JSON Backup File to Restore</span>
            </button>
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                onResetToDefault();
                setStatus({
                  type: 'success',
                  message: 'Workspace reset to default demo data.'
                });
              }}
              className="text-xs font-medium text-slate-500 hover:text-rose-600 flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset to Default Demo Data</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 rounded-lg"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
