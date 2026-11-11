import React from 'react';
import { Search, ChevronsUpDown, Settings } from 'lucide-react';
import { FilterState, UtilizationFilter } from '../types';

interface ToolbarProps {
  filters: FilterState;
  onFilterChange: (newFilters: Partial<FilterState>) => void;
  departments: string[];
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
  filters,
  onFilterChange,
  departments,
  onOpenManageDepartmentsModal,
  kpis,
  isAllExpanded,
  onToggleExpandAll
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 py-3 space-y-3">
      {/* Top row: KPI cards + Global Expand */}
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
            <span className={`font-mono font-bold tabular-nums ${
              kpis.teamAverageUtilization >= 75 && kpis.teamAverageUtilization <= 100
                ? 'text-emerald-600 dark:text-emerald-400'
                : kpis.teamAverageUtilization > 100
                ? 'text-rose-600 dark:text-rose-400'
                : 'text-amber-600 dark:text-amber-400'
            }`}>
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
            <span className={`font-mono font-bold tabular-nums px-1.5 py-0.5 rounded text-[11px] ${
              kpis.totalPersonMonthsOverbooked > 0
                ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
            }`}>
              {kpis.totalPersonMonthsOverbooked} months ({kpis.overbookedPeopleCount} staff)
            </span>
          </div>
        </div>

        {/* Expand / Collapse all toggle */}
        <button
          type="button"
          onClick={onToggleExpandAll}
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700 transition-colors shrink-0"
        >
          <ChevronsUpDown className="w-3.5 h-3.5 text-slate-500" />
          <span>{isAllExpanded ? 'Collapse All Rows' : 'Expand All Rows'}</span>
        </button>
      </div>

      {/* Bottom row: Search bar + Department tabs + Utilization filter */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        {/* Search input */}
        <div className="relative w-full sm:w-64 md:w-72">
          <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search person, project, client..."
            value={filters.search}
            onChange={(e) => onFilterChange({ search: e.target.value })}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-blue-500 transition-all"
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

        {/* Filter controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Department pills */}
          <div className="hidden lg:flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-lg border border-slate-200/60 dark:border-slate-700/60">
            <button
              type="button"
              onClick={() => onFilterChange({ department: 'all' })}
              className={`px-2.5 py-1 text-xs rounded-md transition-all whitespace-nowrap ${
                filters.department === 'all'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              All Depts
            </button>
            {departments.map((dept) => (
              <button
                key={dept}
                type="button"
                onClick={() => onFilterChange({ department: dept })}
                className={`px-2.5 py-1 text-xs rounded-md transition-all whitespace-nowrap ${
                  filters.department === dept
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {dept}
              </button>
            ))}
            <button
              type="button"
              onClick={onOpenManageDepartmentsModal}
              className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 rounded transition-colors ml-0.5"
              title="Modify, rename, or add departments"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Utilization state filter */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-lg border border-slate-200/60 dark:border-slate-700/60">
            {(
              [
                { id: 'all', label: 'All Status' },
                { id: 'overbooked', label: 'Overbooked' },
                { id: 'balanced', label: 'Balanced (75–100%)' },
                { id: 'underbooked', label: 'Available (<75%)' }
              ] as const
            ).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onFilterChange({ utilization: item.id as UtilizationFilter })}
                className={`px-2.5 py-1 text-xs rounded-md transition-all whitespace-nowrap ${
                  filters.utilization === item.id
                    ? item.id === 'overbooked'
                      ? 'bg-rose-600 text-white shadow-xs font-semibold'
                      : 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
