import React, { useRef, useState, useEffect } from 'react';
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
  Sparkles,
  Users,
  Briefcase,
  CalendarOff,
  Armchair,
  Layers,
  ShieldCheck,
  MonitorDown
} from 'lucide-react';
import { ViewMode, DEFAULT_LEAVE_TYPE_CONFIG } from '../types';
import { AppState } from '../data/seedData';
import {
  ExportScope,
  ImportMergeMode,
  generatePeopleViewCSV,
  generateClientsViewCSV,
  generateAvailabilityViewCSV,
  generateBenchViewCSV,
  generateAdminDirectoriesCSV,
  generateAllViewsCSV,
  generateViewJSON,
  generateTemplateCSV,
  importDataFromFileContent,
  triggerFileDownload
} from '../utils/importExportUtils';

interface ExportImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  appState: AppState;
  activeViewMode?: ViewMode;
  initialScope?: ExportScope;
  onImportState: (newState: AppState) => void;
  onResetToDefault: () => void;
  onOpenStandaloneModal?: () => void;
}

const SCOPE_TABS: Array<{
  id: ExportScope;
  label: string;
  shortLabel: string;
  description: string;
  csvColumnsHint: string;
  icon: React.FC<{ className?: string }>;
}> = [
  {
    id: 'all',
    label: 'All Tabs (Full Workspace)',
    shortLabel: 'All Tabs',
    description:
      'Complete workspace backup and multi-view master spreadsheet covering Clients, Projects, People, Allocations, Custom Leave Types, Scheduled Leaves, Departments, and Years.',
    csvColumnsHint:
      'Year, Record Type (Department / Leave Type / Client / Project / Person / Allocation / Leave), First Name, Last Name, Role, Department, Employment, Client, Client Status, Project, Leave Category, Leave Type Label, Badge Theme, Impact %, Jan..Dec',
    icon: Layers
  },
  {
    id: 'clients',
    label: 'By Clients & Projects View',
    shortLabel: 'Clients & Projects',
    description:
      'Client portfolios, deliverable projects, scope notes, monthly FTE totals, and assigned staff breakdowns.',
    csvColumnsHint:
      'Year, Row Type, Client, Industry, Project, Project Code, Project Status, Billable, Project Scope Comment, First Name, Last Name, Role, Department, Employment, Assignment Note, Jan..Dec',
    icon: Briefcase
  },
  {
    id: 'people',
    label: 'By People View',
    shortLabel: 'By People',
    description:
      'Team member capacity summaries, employment type, staffing comments, and project allocation rows across all 12 months.',
    csvColumnsHint:
      'Year, Row Type, First Name, Last Name, Role, Department, Employment (Internal/External/B2B), Max Capacity %, Person Comment, Client, Project, Project Code, Assignment Note, Jan..Dec',
    icon: Users
  },
  {
    id: 'availability',
    label: 'Availability & Leaves View',
    shortLabel: 'Availability & Leaves',
    description:
      'Custom & default Time Off / Leave Type definitions, effective monthly working capacities, and scheduled leave entries.',
    csvColumnsHint:
      'Year, Row Type (Leave Type / Effective Capacity / Leave Entry), First Name, Last Name, Role, Department, Employment, Max Capacity %, Leave Category, Leave Type Label, Badge Theme, Leave Title, Start Month, End Month, Impact %, Leave Note, Jan..Dec',
    icon: CalendarOff
  },
  {
    id: 'bench',
    label: 'Bench View',
    shortLabel: 'Bench',
    description:
      'Unallocated bench capacity percentages, free months count, and team member skills / bench notes.',
    csvColumnsHint:
      'Year, Row Type, First Name, Last Name, Role, Department, Employment (Internal/External/B2B), Email, Max Capacity %, Skills & Bench Comment, Avg Bench %, Free Months, Jan..Dec',
    icon: Armchair
  },
  {
    id: 'admin',
    label: 'Admin Panel & Directories',
    shortLabel: 'Admin & Directories',
    description:
      'Centralized Admin Control Panel directories: Departments, Custom Time Off & Leave Types, Client Companies, Deliverable Projects, Team Members, and Scheduled Leaves.',
    csvColumnsHint:
      'Year, Record Type (Department / Leave Type / Client / Project / Person / Leave), First Name, Last Name, Role, Department, Employment, Email, Max Capacity %, Client, Industry, Client Status, Project, Project Code, Leave Category, Leave Type Label, Badge Theme, Impact %',
    icon: ShieldCheck
  }
];

export const ExportImportModal: React.FC<ExportImportModalProps> = ({
  isOpen,
  onClose,
  appState,
  activeViewMode = 'clients',
  initialScope,
  onImportState,
  onResetToDefault,
  onOpenStandaloneModal
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedScope, setSelectedScope] = useState<ExportScope>(
    initialScope || activeViewMode || 'all'
  );
  const [mergeMode, setMergeMode] = useState<ImportMergeMode>('merge');
  const [status, setStatus] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [isBundlingHtml, setIsBundlingHtml] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSelectedScope(initialScope || activeViewMode || 'all');
      setStatus(null);
    }
  }, [isOpen, initialScope, activeViewMode]);

  if (!isOpen) return null;

  const currentTabConfig =
    SCOPE_TABS.find((t) => t.id === selectedScope) || SCOPE_TABS[0];
  const dateStr = new Date().toISOString().slice(0, 10);
  const leaveTypesCount = Object.keys(
    appState.leaveTypes || DEFAULT_LEAVE_TYPE_CONFIG
  ).length;

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

      const standaloneHtml = `<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>AlloCat — Resource & Capacity Planner (${dateStr})</title>
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

      triggerFileDownload(
        standaloneHtml,
        `AlloCat-Browser-App-${dateStr}.html`,
        'text/html;charset=utf-8'
      );

      setStatus({
        type: 'success',
        message:
          'Standalone browser app downloaded! Double-click that .html file to run AlloCat directly in any browser with your current data.'
      });
    } catch {
      setStatus({
        type: 'error',
        message: 'Could not bundle standalone HTML file. Please use JSON or CSV export below.'
      });
    } finally {
      setIsBundlingHtml(false);
    }
  };

  const handleExportScopeCSV = (scope: ExportScope) => {
    const yr = appState.selectedYear;
    if (scope === 'people') {
      const csv = generatePeopleViewCSV(appState);
      triggerFileDownload(
        csv,
        `allocat-by-people-${yr}-${dateStr}.csv`,
        'text/csv;charset=utf-8;'
      );
      setStatus({
        type: 'success',
        message: `Exported "By People" view (${appState.people.length} team members) to CSV.`
      });
    } else if (scope === 'clients') {
      const csv = generateClientsViewCSV(appState);
      triggerFileDownload(
        csv,
        `allocat-by-clients-projects-${yr}-${dateStr}.csv`,
        'text/csv;charset=utf-8;'
      );
      setStatus({
        type: 'success',
        message: `Exported "By Clients & Projects" view (${appState.clients.length} clients, ${appState.projects.length} projects) to CSV.`
      });
    } else if (scope === 'availability') {
      const csv = generateAvailabilityViewCSV(appState);
      triggerFileDownload(
        csv,
        `allocat-availability-leaves-${yr}-${dateStr}.csv`,
        'text/csv;charset=utf-8;'
      );
      setStatus({
        type: 'success',
        message: `Exported "Availability & Leaves" view (${leaveTypesCount} leave types, ${appState.leaves.filter((l) => l.year === yr).length} scheduled leaves) to CSV.`
      });
    } else if (scope === 'bench') {
      const csv = generateBenchViewCSV(appState);
      triggerFileDownload(
        csv,
        `allocat-bench-${yr}-${dateStr}.csv`,
        'text/csv;charset=utf-8;'
      );
      setStatus({
        type: 'success',
        message: `Exported "Bench" availability view (${appState.people.length} team members) to CSV.`
      });
    } else if (scope === 'admin') {
      const csv = generateAdminDirectoriesCSV(appState);
      triggerFileDownload(
        csv,
        `allocat-admin-directories-${yr}-${dateStr}.csv`,
        'text/csv;charset=utf-8;'
      );
      setStatus({
        type: 'success',
        message: `Exported "Admin & Directories" CSV (${appState.departments.length} departments, ${leaveTypesCount} leave types, ${appState.clients.length} clients, ${appState.projects.length} projects, ${appState.people.length} people).`
      });
    } else {
      const csv = generateAllViewsCSV(appState);
      triggerFileDownload(
        csv,
        `allocat-all-views-master-${yr}-${dateStr}.csv`,
        'text/csv;charset=utf-8;'
      );
      setStatus({
        type: 'success',
        message: `Exported All Views Master CSV (${appState.departments.length} departments, ${leaveTypesCount} leave types, ${appState.clients.length} clients, ${appState.projects.length} projects, ${appState.people.length} people, ${appState.allocations.length} allocations, ${appState.leaves.length} leaves).`
      });
    }
  };

  const handleExportScopeJSON = (scope: ExportScope) => {
    const yr = appState.selectedYear;
    const json = generateViewJSON(appState, scope);
    const filename =
      scope === 'all'
        ? `allocat-full-backup-${dateStr}.json`
        : scope === 'admin'
        ? `allocat-admin-directories-${yr}-${dateStr}.json`
        : `allocat-${scope}-${yr}-${dateStr}.json`;

    triggerFileDownload(json, filename, 'application/json');
    setStatus({
      type: 'success',
      message:
        scope === 'all'
          ? 'Exported Full Workspace Backup (.JSON) including all views, departments, and custom leave types.'
          : `Exported "${currentTabConfig.shortLabel}" data (.JSON).`
    });
  };

  const handleDownloadTemplateCSV = (
    scope: ExportScope,
    includeExampleRows: boolean = true
  ) => {
    const yr = appState.selectedYear;
    const csv = generateTemplateCSV(scope, yr, includeExampleRows);
    const tabInfo = SCOPE_TABS.find((t) => t.id === scope) || SCOPE_TABS[0];
    const suffix = includeExampleRows ? 'example-template' : 'empty-template';
    const scopeSlug =
      scope === 'all'
        ? 'all-views'
        : scope === 'clients'
        ? 'clients-projects'
        : scope === 'availability'
        ? 'availability-leaves'
        : scope === 'admin'
        ? 'admin-directories'
        : scope;

    triggerFileDownload(
      csv,
      `allocat-${scopeSlug}-${suffix}-${yr}.csv`,
      'text/csv;charset=utf-8;'
    );
    setStatus({
      type: 'success',
      message: includeExampleRows
        ? `Downloaded pre-built "${tabInfo.shortLabel}" example template (.CSV). Fill in your rows and import it below!`
        : `Downloaded empty "${tabInfo.shortLabel}" template (.CSV) with headers ready to fill.`
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const result = importDataFromFileContent(
          text,
          file.name,
          appState,
          selectedScope,
          mergeMode
        );
        onImportState(result.nextState);
        setStatus({
          type: 'success',
          message: result.summaryMessage
        });
      } catch (err) {
        setStatus({
          type: 'error',
          message:
            err instanceof Error
              ? err.message
              : 'Failed to parse file. Please upload a valid AlloCat .CSV or .JSON file.'
        });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-3xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Import & Export Center — All Views & Admin Directories ({appState.selectedYear})
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Export or import CSV spreadsheets and JSON backups for any matrix view, Admin Panel directory, or standalone app
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scope Selector Tabs */}
        <div className="px-5 pt-3 pb-2.5 bg-slate-50/60 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Select Module / View to Export or Import:
            </span>
            <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono text-slate-500 dark:text-slate-400">
              <span className="px-1.5 py-0.5 rounded bg-slate-200/70 dark:bg-slate-800">
                {appState.clients.length} Clients
              </span>
              <span className="px-1.5 py-0.5 rounded bg-slate-200/70 dark:bg-slate-800">
                {appState.projects.length} Projects
              </span>
              <span className="px-1.5 py-0.5 rounded bg-slate-200/70 dark:bg-slate-800">
                {appState.people.length} People
              </span>
              <span className="px-1.5 py-0.5 rounded bg-slate-200/70 dark:bg-slate-800">
                {appState.departments.length} Depts
              </span>
              <span className="px-1.5 py-0.5 rounded bg-purple-100/80 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300">
                {leaveTypesCount} Leave Types
              </span>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {SCOPE_TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = selectedScope === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setSelectedScope(tab.id);
                    setStatus(null);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer border ${
                    isActive
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs font-semibold'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.shortLabel}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5 overflow-y-auto flex-1">
          {status && (
            <div
              className={`p-3 rounded-lg border flex items-start gap-2.5 text-xs ${
                status.type === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                  : 'bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-200'
              }`}
            >
              {status.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              )}
              <span className="font-medium">{status.message}</span>
            </div>
          )}

          {/* Selected Scope Banner & Export Actions */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-3.5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wide flex items-center gap-2">
                  <span>Export: {currentTabConfig.label}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                    {appState.selectedYear}
                  </span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  {currentTabConfig.description}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleExportScopeCSV(selectedScope)}
                className="flex items-start gap-3 p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 text-left transition-all cursor-pointer group"
              >
                <div className="w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                    Export {currentTabConfig.shortLabel} (.CSV)
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Spreadsheet table ready for Excel, Google Sheets, or re-importing.
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleExportScopeJSON(selectedScope)}
                className="flex items-start gap-3 p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 text-left transition-all cursor-pointer group"
              >
                <div className="w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <FileJson className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                    Export {currentTabConfig.shortLabel} (.JSON)
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Structured JSON data for {currentTabConfig.shortLabel.toLowerCase()}.
                  </p>
                </div>
              </button>
            </div>

            {/* Quick 1-click CSV buttons for all individual modules when on "All Tabs" */}
            {selectedScope === 'all' && (
              <div className="pt-2 border-t border-slate-200/80 dark:border-slate-700/70">
                <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-2">
                  Or quick-export individual module spreadsheets (.CSV):
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {(
                    [
                      { id: 'clients', label: 'Clients & Projects' },
                      { id: 'people', label: 'By People' },
                      { id: 'availability', label: 'Leaves & Types' },
                      { id: 'bench', label: 'Bench View' },
                      { id: 'admin', label: 'Admin Directories' }
                    ] as const
                  ).map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleExportScopeCSV(item.id)}
                      className="px-2.5 py-1.5 rounded-lg text-[11px] font-medium bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-emerald-500 text-slate-700 dark:text-slate-300 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Import Section for Selected Tab / View (Supports both .CSV and .JSON) */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wide">
                  Import into {currentTabConfig.label} (.CSV or .JSON)
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Upload any exported <code className="font-mono">.csv</code> spreadsheet or{' '}
                  <code className="font-mono">.json</code> file to update people, departments, clients, projects, allocations, custom leave types, or leaves.
                </p>
              </div>

              {/* Merge vs Replace toggle */}
              <div className="flex items-center bg-white dark:bg-slate-900 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 text-[11px]">
                <button
                  type="button"
                  onClick={() => setMergeMode('merge')}
                  className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                    mergeMode === 'merge'
                      ? 'bg-blue-600 text-white font-semibold'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                  title="Update matching rows and add new ones without deleting unrelated records"
                >
                  Merge & Update
                </button>
                <button
                  type="button"
                  onClick={() => setMergeMode('replace')}
                  className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                    mergeMode === 'replace'
                      ? 'bg-amber-600 text-white font-semibold'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                  title="Replace existing records for this view/year with the imported file"
                >
                  Replace Existing
                </button>
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-white/80 dark:bg-slate-900/70 border border-slate-200/70 dark:border-slate-700/70 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
              <span className="font-semibold text-slate-700 dark:text-slate-300 font-sans">
                Supported CSV columns:{' '}
              </span>
              {currentTabConfig.csvColumnsHint}
            </div>

            {/* Pre-built CSV Template Downloads inside Import Section */}
            <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Pre-built CSV Import Templates ({currentTabConfig.shortLabel})</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Download a ready-to-fill CSV template with the exact column headers for this module.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleDownloadTemplateCSV(selectedScope, true)}
                    className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80 flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Download CSV template pre-populated with example rows showing the format"
                  >
                    <Download className="w-3 h-3" />
                    <span>Example Template (.CSV)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDownloadTemplateCSV(selectedScope, false)}
                    className="px-2.5 py-1.5 rounded-lg text-[11px] font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Download blank CSV template containing only the column headers"
                  >
                    <Download className="w-3 h-3" />
                    <span>Empty Headers (.CSV)</span>
                  </button>
                </div>
              </div>

              {/* Quick links for all tab templates */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 mr-1">
                  All module templates:
                </span>
                {SCOPE_TABS.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => handleDownloadTemplateCSV(t.id, true)}
                    className={`px-2 py-0.5 rounded text-[10px] font-medium border transition-colors cursor-pointer flex items-center gap-1 ${
                      selectedScope === t.id
                        ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                        : 'bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-blue-400'
                    }`}
                    title={`Download ${t.label} example CSV template`}
                  >
                    <Download className="w-2.5 h-2.5" />
                    <span>{t.shortLabel}</span>
                  </button>
                ))}
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.json,text/csv,application/json"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-3 px-4 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-400 bg-white/50 dark:bg-slate-900/40 flex items-center justify-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer transition-colors"
            >
              <Upload className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>
                Select .CSV or .JSON File to Import ({currentTabConfig.shortLabel})
              </span>
            </button>
          </div>

          {/* Standalone Single-File Browser App & Windows Desktop App Center */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-900 text-white border border-indigo-500/30 shadow-md">
            <div className="flex items-start gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 flex items-center justify-center shrink-0">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-white">
                    Portable Offline Browser File & Windows Desktop App
                  </h3>
                  <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5" /> Standalone
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                  Bundle AlloCat and your current workspace state (including custom leave types and departments) into a single self-contained{' '}
                  <code className="text-indigo-200 font-mono">.html</code> file, or open the Windows Desktop App installer center.
                </p>
              </div>
            </div>

            <div className="mt-3.5 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                disabled={isBundlingHtml}
                onClick={handleDownloadStandaloneHTML}
                className="py-2.5 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>
                  {isBundlingHtml
                    ? 'Bundling Standalone HTML...'
                    : 'Download Single-File App (.html)'}
                </span>
              </button>

              {onOpenStandaloneModal && (
                <button
                  type="button"
                  onClick={onOpenStandaloneModal}
                  className="py-2.5 px-4 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-200 border border-indigo-400/30 font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <MonitorDown className="w-4 h-4 text-indigo-400" />
                  <span>Windows Desktop App Center</span>
                </button>
              )}
            </div>
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
              className="text-xs font-medium text-slate-500 hover:text-rose-600 flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset to Default Demo Data</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
