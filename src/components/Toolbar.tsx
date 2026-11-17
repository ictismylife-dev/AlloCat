import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  ChevronsUpDown,
  Settings,
  ArrowDownAZ,
  ArrowUpZA,
  Briefcase,
  Activity,
  ChevronDown,
  Calendar,
  Eye,
  EyeOff,
  Building2,
  Users
} from 'lucide-react';
import {
  FilterState,
  UtilizationFilter,
  ViewMode,
  Client,
  EmploymentType,
  EMPLOYMENT_TYPES,
  PeopleSortOrder,
  ClientSortOrder,
  MONTH_NAMES
} from '../types';

interface ToolbarProps {
  viewMode: ViewMode;
  filters: FilterState;
  onFilterChange: (newFilters: Partial<FilterState>) => void;
  departments: string[];
  clients?: Client[];
  onOpenManageDepartmentsModal: () => void;
  kpis: {
    totalPeople: number;
    activeProjectsCount: number;
    teamAverageUtilization: number;
    overbookedPeopleCount: number;
    totalPersonMonthsOverbooked: number;
    totalLeaveMonthsCount?: number;
    activeLeavesCount?: number;
  };
  isAllExpanded: boolean;
  onToggleExpandAll: () => void;
  selectedYear: number;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  viewMode,
  filters,
  onFilterChange,
  departments,
  clients = [],
  onOpenManageDepartmentsModal,
  kpis,
  isAllExpanded,
  onToggleExpandAll
}) => {
  const [isMonthsMenuOpen, setIsMonthsMenuOpen] = useState(false);
  const monthsMenuRef = useRef<HTMLDivElement>(null);

  const visibleMonths =
    filters.visibleMonths && filters.visibleMonths.length === 12
      ? filters.visibleMonths
      : Array(12).fill(true);

  const visibleMonthsCount = visibleMonths.filter(Boolean).length;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (monthsMenuRef.current && !monthsMenuRef.current.contains(e.target as Node)) {
        setIsMonthsMenuOpen(false);
      }
    };
    if (isMonthsMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMonthsMenuOpen]);

  const handleToggleSingleMonth = (monthIdx: number) => {
    const next = [...visibleMonths];
    next[monthIdx] = !next[monthIdx];
    onFilterChange({ visibleMonths: next });
  };

  const handleSetMonthsPreset = (indicesToShow: number[]) => {
    const set = new Set(indicesToShow);
    const next = Array.from({ length: 12 }, (_, i) => set.has(i));
    onFilterChange({ visibleMonths: next });
  };

  return (
    <div className="shrink-0 z-30 bg-slate-100/95 dark:bg-slate-900 border-b border-slate-300/80 dark:border-slate-800 px-4 sm:px-6 py-3 space-y-3">
      {/* Top row: KPI cards + View Export/Import + Global Expand */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* KPI Strip */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-5 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 dark:text-slate-500 font-medium">Headcount:</span>
            <span className="font-mono font-bold text-slate-800 dark:text-slate-200 tabular-nums">
              {kpis.totalPeople}
            </span>
          </div>

          <div className="hidden sm:inline-block w-px h-3.5 bg-slate-200 dark:bg-slate-800" />

          <div className="flex items-center gap-2">
            <span className="text-slate-400 dark:text-slate-500 font-medium">Active Projects:</span>
            <span className="font-mono font-bold text-slate-800 dark:text-slate-200 tabular-nums">
              {kpis.activeProjectsCount}
            </span>
          </div>

          <div className="hidden sm:inline-block w-px h-3.5 bg-slate-200 dark:bg-slate-800" />

          <div className="flex items-center gap-2">
            <span className="text-slate-400 dark:text-slate-500 font-medium">Avg Annual Utilization:</span>
            <span
              className={`font-mono font-bold tabular-nums ${
                kpis.teamAverageUtilization >= 75 && kpis.teamAverageUtilization <= 100
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : kpis.teamAverageUtilization > 100
                  ? 'text-rose-600 dark:text-rose-400'
                  : 'text-amber-600 dark:text-amber-400'
              }`}
            >
              {kpis.teamAverageUtilization}%
            </span>
          </div>

          <div className="hidden sm:inline-block w-px h-3.5 bg-slate-200 dark:bg-slate-800" />

          <div className="flex items-center gap-2">
            <span className="text-slate-400 dark:text-slate-500 font-medium">Time Off & Leaves:</span>
            <span className="font-mono font-bold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 px-1.5 py-0.5 rounded text-[11px] tabular-nums">
              {kpis.activeLeavesCount ?? 0} ({kpis.totalLeaveMonthsCount ?? 0} person-mos)
            </span>
          </div>

          <div className="hidden sm:inline-block w-px h-3.5 bg-slate-200 dark:bg-slate-800" />

          <div className="flex items-center gap-2">
            <span className="text-slate-400 dark:text-slate-500 font-medium">Overtime Alerts:</span>
            <span
              className={`font-mono font-bold tabular-nums px-1.5 py-0.5 rounded text-[11px] ${
                kpis.totalPersonMonthsOverbooked > 0
                  ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                  : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
              }`}
            >
              {kpis.totalPersonMonthsOverbooked} months ({kpis.overbookedPeopleCount} staff)
            </span>
          </div>
        </div>

        {/* Right actions: Expand/Collapse All */}
        {viewMode !== 'bench' && (
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onToggleExpandAll}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
            >
              <ChevronsUpDown className="w-3.5 h-3.5 text-slate-500" />
              <span>{isAllExpanded ? 'Collapse All Rows' : 'Expand All Rows'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Bottom row: Search bar + Alphabetical Sort + Department / Client filter + Months Visibility + Utilization filter */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Search input */}
          <div className="relative w-full sm:w-64 md:w-72">
            <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search person, project, client..."
              value={filters.search}
              onChange={(e) => onFilterChange({ search: e.target.value })}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-slate-800/80 border border-slate-300/80 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-blue-500 transition-all"
            />
            {filters.search && (
              <button
                type="button"
                onClick={() => onFilterChange({ search: '' })}
                className="absolute right-2 top-2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ×
              </button>
            )}
          </div>

          {/* Alphabetical Sort Selector for People or Clients */}
          {viewMode === 'clients' ? (
            <div className="flex items-center gap-1 bg-slate-200/80 dark:bg-slate-800/80 p-0.5 rounded-lg border border-slate-300/70 dark:border-slate-700/60">
              <button
                type="button"
                onClick={() =>
                  onFilterChange({
                    clientSort:
                      (filters.clientSort || 'client-asc') === 'client-asc' ? 'client-desc' : 'client-asc'
                  })
                }
                className={`flex items-center gap-1 px-2 py-1 text-xs rounded-md transition-all cursor-pointer ${
                  (filters.clientSort || 'client-asc') !== 'default'
                    ? 'bg-blue-600 text-white font-semibold shadow-2xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700'
                }`}
                title="Toggle alphabetical sort for Clients (A-Z / Z-A)"
              >
                {(filters.clientSort || 'client-asc').endsWith('-desc') ? (
                  <ArrowUpZA className="w-3.5 h-3.5" />
                ) : (
                  <ArrowDownAZ className="w-3.5 h-3.5" />
                )}
                <span>
                  {(filters.clientSort || 'client-asc') === 'client-desc' ? 'Clients Z–A' : 'Clients A–Z'}
                </span>
              </button>

              <select
                value={filters.clientSort || 'client-asc'}
                onChange={(e) =>
                  onFilterChange({ clientSort: e.target.value as ClientSortOrder })
                }
                className="px-2 py-1 text-xs rounded-md bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 focus:outline-hidden cursor-pointer"
                title="Sort Clients & Projects alphabetically"
              >
                <option value="client-asc">Clients: A → Z (Default)</option>
                <option value="client-desc">Clients: Z → A</option>
                <option value="project-asc">Projects: A → Z</option>
                <option value="project-desc">Projects: Z → A</option>
                <option value="default">Original Order</option>
              </select>
            </div>
          ) : (
            <div className="flex items-center gap-1 bg-slate-200/80 dark:bg-slate-800/80 p-0.5 rounded-lg border border-slate-300/70 dark:border-slate-700/60">
              <button
                type="button"
                onClick={() =>
                  onFilterChange({
                    peopleSort:
                      (filters.peopleSort || 'lastName-asc') === 'lastName-asc'
                        ? 'lastName-desc'
                        : 'lastName-asc'
                  })
                }
                className={`flex items-center gap-1 px-2 py-1 text-xs rounded-md transition-all cursor-pointer ${
                  (filters.peopleSort || 'lastName-asc') !== 'default'
                    ? 'bg-blue-600 text-white font-semibold shadow-2xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700'
                }`}
                title="Toggle alphabetical sort for People (A-Z / Z-A)"
              >
                {(filters.peopleSort || 'lastName-asc').endsWith('-desc') ? (
                  <ArrowUpZA className="w-3.5 h-3.5" />
                ) : (
                  <ArrowDownAZ className="w-3.5 h-3.5" />
                )}
                <span>
                  {(filters.peopleSort || 'lastName-asc').endsWith('-desc') ? 'Z–A' : 'A–Z'}
                </span>
              </button>

              <select
                value={filters.peopleSort || 'lastName-asc'}
                onChange={(e) =>
                  onFilterChange({ peopleSort: e.target.value as PeopleSortOrder })
                }
                className="px-2 py-1 text-xs rounded-md bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 focus:outline-hidden cursor-pointer"
                title="Sort People alphabetically by Last Name or First Name"
              >
                <option value="lastName-asc">Last Name: A → Z (Default)</option>
                <option value="lastName-desc">Last Name: Z → A</option>
                <option value="firstName-asc">First Name: A → Z</option>
                <option value="firstName-desc">First Name: Z → A</option>
                <option value="default">Original Order</option>
              </select>
            </div>
          )}
        </div>

        {/* Filter controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Individual Months Visibility Switcher */}
          <div
            className="relative flex items-center bg-slate-200/80 dark:bg-slate-800/80 p-0.5 rounded-lg border border-slate-300/70 dark:border-slate-700/60"
            ref={monthsMenuRef}
          >
            <button
              type="button"
              onClick={() => setIsMonthsMenuOpen((prev) => !prev)}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md shadow-xs transition-colors cursor-pointer whitespace-nowrap ${
                visibleMonthsCount < 12
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white'
              }`}
              title="Show or hide individual months (Jan–Dec)"
            >
              <Calendar
                className={`w-3.5 h-3.5 ${
                  visibleMonthsCount < 12
                    ? 'text-indigo-200'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              />
              <span>Months</span>
              <span
                className={`font-mono text-[10px] px-1 py-0.2 rounded ${
                  visibleMonthsCount < 12
                    ? 'bg-indigo-700 text-indigo-100'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                {visibleMonthsCount}/12
              </span>
              <ChevronDown
                className={`w-3 h-3 ${
                  visibleMonthsCount < 12
                    ? 'text-indigo-200'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              />
            </button>

            {isMonthsMenuOpen && (
              <div className="absolute right-0 top-9 w-72 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl p-3 z-50 text-xs">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <div className="font-bold text-slate-900 dark:text-slate-100">
                      Visible Months ({visibleMonthsCount}/12)
                    </div>
                    <div className="text-[10px] text-slate-400 dark:text-slate-500">
                      Click any month to switch visible / invisible
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      handleSetMonthsPreset([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11])
                    }
                    className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                  >
                    Show All
                  </button>
                </div>

                {/* Quick Range Presets */}
                <div className="flex flex-wrap items-center gap-1 mb-2.5">
                  <button
                    type="button"
                    onClick={() => handleSetMonthsPreset([0, 1, 2])}
                    className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
                  >
                    Q1
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetMonthsPreset([3, 4, 5])}
                    className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
                  >
                    Q2
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetMonthsPreset([6, 7, 8])}
                    className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
                  >
                    Q3
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetMonthsPreset([9, 10, 11])}
                    className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
                  >
                    Q4
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetMonthsPreset([0, 1, 2, 3, 4, 5])}
                    className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
                  >
                    H1
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetMonthsPreset([6, 7, 8, 9, 10, 11])}
                    className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
                  >
                    H2
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetMonthsPreset([])}
                    className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/60 text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer ml-auto"
                  >
                    Hide All
                  </button>
                </div>

                {/* Individual 12 Months Grid */}
                <div className="grid grid-cols-3 gap-1.5">
                  {MONTH_NAMES.map((month, idx) => {
                    const isVisible = visibleMonths[idx];
                    return (
                      <button
                        key={month}
                        type="button"
                        onClick={() => handleToggleSingleMonth(idx)}
                        className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg border text-xs font-mono transition-all cursor-pointer ${
                          isVisible
                            ? 'bg-indigo-50/90 dark:bg-indigo-950/60 border-indigo-300 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200 font-semibold'
                            : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 line-through'
                        }`}
                        title={
                          isVisible
                            ? `Click to hide ${month} (M${idx + 1})`
                            : `Click to show ${month} (M${idx + 1})`
                        }
                      >
                        <span>{month}</span>
                        {isVisible ? (
                          <Eye className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                        ) : (
                          <EyeOff className="w-3.5 h-3.5 text-slate-400 dark:text-slate-600 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {viewMode === 'clients' && clients.length > 0 ? (
            /* Client filter dropdown when on By Clients & Projects tab */
            <div className="flex items-center bg-slate-200/80 dark:bg-slate-800/80 p-0.5 rounded-lg border border-slate-300/70 dark:border-slate-700/60">
              <div className="relative flex items-center">
                <Briefcase className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 absolute left-2.5 pointer-events-none" />
                <select
                  value={filters.clientFilter}
                  onChange={(e) => onFilterChange({ clientFilter: e.target.value })}
                  className="pl-8 pr-7 py-1 text-xs font-semibold rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs border-0 focus:outline-hidden focus:ring-1 focus:ring-blue-500 cursor-pointer appearance-none"
                  title="Filter by Client"
                >
                  <option value="all" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                    All Clients ({clients.length})
                  </option>
                  {clients.map((client) => (
                    <option
                      key={client.id}
                      value={client.id}
                      className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    >
                      {client.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3 h-3 text-slate-500 dark:text-slate-400 absolute right-2 pointer-events-none" />
              </div>
            </div>
          ) : (
            /* Department filter dropdown on People, Availability, and Bench tabs */
            <div className="flex items-center gap-1 bg-slate-200/80 dark:bg-slate-800/80 p-0.5 rounded-lg border border-slate-300/70 dark:border-slate-700/60">
              <div className="relative flex items-center">
                <Building2 className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 absolute left-2.5 pointer-events-none" />
                <select
                  value={filters.department}
                  onChange={(e) => {
                    if (e.target.value === '__manage_depts__') {
                      onOpenManageDepartmentsModal();
                    } else {
                      onFilterChange({ department: e.target.value });
                    }
                  }}
                  className="pl-8 pr-7 py-1 text-xs font-semibold rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs border-0 focus:outline-hidden focus:ring-1 focus:ring-blue-500 cursor-pointer appearance-none"
                  title="Filter by Department"
                >
                  <option value="all" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                    All Departments ({departments.length})
                  </option>
                  {departments.map((dept) => (
                    <option
                      key={dept}
                      value={dept}
                      className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    >
                      {dept}
                    </option>
                  ))}
                  <option
                    value="__manage_depts__"
                    className="bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 font-medium"
                  >
                    + Manage Departments...
                  </option>
                </select>
                <ChevronDown className="w-3 h-3 text-slate-500 dark:text-slate-400 absolute right-2 pointer-events-none" />
              </div>

              <button
                type="button"
                onClick={onOpenManageDepartmentsModal}
                className="p-1 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-300/60 dark:hover:bg-slate-700/60 rounded transition-colors cursor-pointer"
                title="Modify, rename, or add departments"
              >
                <Settings className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Employment Type filter dropdown (All / Internal / External / B2B) */}
          {viewMode !== 'clients' && (
            <div className="flex items-center bg-slate-200/80 dark:bg-slate-800/80 p-0.5 rounded-lg border border-slate-300/70 dark:border-slate-700/60">
              <div className="relative flex items-center">
                <Users className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 absolute left-2.5 pointer-events-none" />
                <select
                  value={filters.employmentFilter || 'all'}
                  onChange={(e) =>
                    onFilterChange({
                      employmentFilter: e.target.value as EmploymentType | 'all'
                    })
                  }
                  className="pl-8 pr-7 py-1 text-xs font-semibold rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs border-0 focus:outline-hidden focus:ring-1 focus:ring-blue-500 cursor-pointer appearance-none"
                  title="Filter by Employment Type"
                >
                  <option value="all" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                    All Employment
                  </option>
                  {EMPLOYMENT_TYPES.map((emp) => (
                    <option
                      key={emp}
                      value={emp}
                      className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    >
                      {emp}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3 h-3 text-slate-500 dark:text-slate-400 absolute right-2 pointer-events-none" />
              </div>
            </div>
          )}

          {/* Utilization state filter dropdown */}
          <div className="flex items-center bg-slate-200/80 dark:bg-slate-800/80 p-0.5 rounded-lg border border-slate-300/70 dark:border-slate-700/60">
            <div className="relative flex items-center">
              <Activity
                className={`w-3.5 h-3.5 absolute left-2.5 pointer-events-none ${
                  filters.utilization === 'overbooked'
                    ? 'text-rose-600 dark:text-rose-400'
                    : filters.utilization === 'balanced'
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : filters.utilization === 'underbooked'
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              />
              <select
                value={filters.utilization}
                onChange={(e) =>
                  onFilterChange({ utilization: e.target.value as UtilizationFilter })
                }
                className="pl-8 pr-7 py-1 text-xs font-semibold rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs border-0 focus:outline-hidden focus:ring-1 focus:ring-blue-500 cursor-pointer appearance-none"
                title="Filter by utilization status"
              >
                <option value="all" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                  All Status
                </option>
                <option value="overbooked" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                  Overbooked
                </option>
                <option value="balanced" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                  Balanced (75–100%)
                </option>
                <option value="underbooked" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                  Available (&lt;75%)
                </option>
              </select>
              <ChevronDown className="w-3 h-3 text-slate-500 dark:text-slate-400 absolute right-2 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
