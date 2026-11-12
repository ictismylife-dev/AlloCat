import React, { useState, useRef, useEffect } from 'react';
import {
  Calendar,
  Users,
  Briefcase,
  Plus,
  AlertTriangle,
  Download,
  Sun,
  Moon,
  UserCheck,
  Cat,
  LogOut,
  KeyRound,
  ChevronDown
} from 'lucide-react';
import { ViewMode } from '../types';

interface HeaderProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  availableYears: number[];
  selectedYear: number;
  onYearChange: (year: number) => void;
  onOpenManageYearsModal: () => void;
  overtimeCount: number;
  onOpenOvertimeDrawer: () => void;
  onOpenAssignModal: () => void;
  onOpenAddPersonModal: () => void;
  onOpenAddProjectModal: () => void;
  onOpenAddLeaveModal: () => void;
  onOpenExportModal: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  currentUser?: string | null;
  onLogout?: () => void;
  onOpenChangeCredentialsModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  viewMode,
  onViewModeChange,
  availableYears,
  selectedYear,
  onYearChange,
  onOpenManageYearsModal,
  overtimeCount,
  onOpenOvertimeDrawer,
  onOpenAssignModal,
  onOpenAddPersonModal,
  onOpenAddProjectModal,
  onOpenAddLeaveModal,
  onOpenExportModal,
  isDarkMode,
  onToggleDarkMode,
  currentUser,
  onLogout,
  onOpenChangeCredentialsModal
}) => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const quickAddRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
      if (quickAddRef.current && !quickAddRef.current.contains(e.target as Node)) {
        setIsQuickAddOpen(false);
      }
    };
    if (isUserMenuOpen || isQuickAddOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isUserMenuOpen, isQuickAddOpen]);

  return (
    <header className="shrink-0 z-40 bg-slate-100 dark:bg-slate-900 border-b border-slate-300/80 dark:border-slate-800 transition-colors">
      <div className="max-w-[1720px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-6">
        {/* Zone 1: Logo Picture + Admin User Menu & Wordmark */}
        <div className="flex items-center gap-2.5 shrink-0 relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setIsUserMenuOpen((prev) => !prev)}
            className="group flex items-center gap-2 p-1 pr-2 rounded-xl hover:bg-slate-200/80 dark:hover:bg-slate-800 transition-colors cursor-pointer focus:outline-hidden"
            title={
              currentUser
                ? `Signed in as ${currentUser} — Click for account & password settings`
                : 'Account menu'
            }
          >
            <div className="relative w-8 h-8 rounded-lg bg-indigo-600 group-hover:bg-indigo-700 text-white flex items-center justify-center shadow-xs transition-colors">
              <Cat className="w-5 h-5" />
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-slate-100 dark:ring-slate-900" />
            </div>
            <div className="flex flex-col items-start text-left">
              <div className="flex items-center gap-1">
                <span className="text-base font-bold tracking-tight text-slate-900 dark:text-slate-100 leading-none">
                  AlloCat
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors" />
              </div>
              {currentUser && (
                <span className="text-[10px] font-mono font-semibold text-indigo-600 dark:text-indigo-400 leading-tight">
                  {currentUser}
                </span>
              )}
            </div>
          </button>

          <span className="hidden xl:inline-block text-xs font-mono text-slate-400 dark:text-slate-500 border-l border-slate-300 dark:border-slate-800 pl-3">
            Resource & Capacity Planner
          </span>

          {/* Dropdown Menu from Logo Picture */}
          {isUserMenuOpen && (
            <div className="absolute left-0 top-13 w-60 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl py-1.5 z-50 text-xs">
              <div className="px-3.5 py-2 border-b border-slate-100 dark:border-slate-800">
                <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">
                  Signed in as
                </div>
                <div className="font-mono font-bold text-slate-900 dark:text-slate-100 truncate mt-0.5">
                  {currentUser || 'admin'}
                </div>
              </div>

              <div className="py-1">
                {onOpenChangeCredentialsModal && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      onOpenChangeCredentialsModal();
                    }}
                    className="w-full px-3.5 py-2 text-left flex items-center gap-2.5 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <KeyRound className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span>Change Login & Password</span>
                  </button>
                )}

                {onLogout && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      onLogout();
                    }}
                    className="w-full px-3.5 py-2 text-left flex items-center gap-2.5 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Log Out / Lock Workspace</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Zone 2: View Switcher & Year Navigation */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Year dropdown selector */}
          <div className="flex items-center gap-1 bg-slate-200/80 dark:bg-slate-800/80 p-0.5 rounded-lg border border-slate-300/70 dark:border-slate-700/60">
            <div className="relative flex items-center">
              <Calendar className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 absolute left-2 pointer-events-none" />
              <select
                value={selectedYear}
                onChange={(e) => {
                  if (e.target.value === '__manage__') {
                    onOpenManageYearsModal();
                  } else {
                    onYearChange(Number(e.target.value));
                  }
                }}
                className="pl-7 pr-6 py-1 text-xs font-mono font-semibold rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs border-0 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 cursor-pointer appearance-none"
                title="Select planning year"
              >
                {availableYears.map((y) => (
                  <option key={y} value={y} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono">
                    {y}
                  </option>
                ))}
                <option value="__manage__" className="bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 font-sans font-medium">
                  + Manage Years...
                </option>
              </select>
              <ChevronDown className="w-3 h-3 text-slate-500 dark:text-slate-400 absolute right-1.5 pointer-events-none" />
            </div>

            <button
              type="button"
              onClick={onOpenManageYearsModal}
              className="p-1 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-300/60 dark:hover:bg-slate-700/60 rounded transition-colors cursor-pointer"
              title="Add or remove planning years"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Perspective switcher: Clients vs People vs Availability vs Bench */}
          <div className="flex items-center bg-slate-200/80 dark:bg-slate-800/80 p-0.5 rounded-lg border border-slate-300/70 dark:border-slate-700/60">
            <button
              type="button"
              onClick={() => onViewModeChange('clients')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-all whitespace-nowrap ${
                viewMode === 'clients'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>By Clients & Projects</span>
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange('people')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-all whitespace-nowrap ${
                viewMode === 'people'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>By People</span>
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange('availability')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-all whitespace-nowrap ${
                viewMode === 'availability'
                  ? 'bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-400 shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Availability & Leaves</span>
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange('bench')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-all whitespace-nowrap ${
                viewMode === 'bench'
                  ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-400 shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Bench</span>
            </button>
          </div>
        </div>

        {/* Zone 3: Primary Actions & Alerts */}
        <div className="flex items-center gap-2 shrink-0">
          {overtimeCount > 0 && (
            <button
              type="button"
              onClick={onOpenOvertimeDrawer}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-900 rounded-lg transition-colors whitespace-nowrap"
              title="View over-allocated person months"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
              <span className="font-mono tabular-nums font-semibold">{overtimeCount}</span>
              <span className="hidden md:inline">Overtime Alerts</span>
            </button>
          )}

          {/* Quick Add Dropdown list */}
          <div className="relative flex items-center" ref={quickAddRef}>
            <button
              type="button"
              onClick={() => setIsQuickAddOpen((prev) => !prev)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/80 rounded-lg transition-colors border border-slate-300/80 dark:border-slate-700 shadow-2xs cursor-pointer whitespace-nowrap"
              title="Create new Time Off, Person, or Project"
            >
              <Plus className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Add</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {isQuickAddOpen && (
              <div className="absolute right-0 top-10 w-52 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl py-1 z-50 text-xs animate-in fade-in zoom-in-95 duration-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsQuickAddOpen(false);
                    onOpenAddLeaveModal();
                  }}
                  className="w-full px-3 py-2 text-left flex items-center gap-2.5 text-slate-700 dark:text-slate-200 hover:bg-purple-50 dark:hover:bg-purple-950/40 hover:text-purple-700 dark:hover:text-purple-300 transition-colors cursor-pointer"
                >
                  <div className="w-6 h-6 rounded-md bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                    <Calendar className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="font-semibold">+ Time Off</div>
                    <div className="text-[10px] text-slate-400 dark:text-slate-500">Vacations, PTO & leaves</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsQuickAddOpen(false);
                    onOpenAddPersonModal();
                  }}
                  className="w-full px-3 py-2 text-left flex items-center gap-2.5 text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-700 dark:hover:text-blue-300 transition-colors cursor-pointer"
                >
                  <div className="w-6 h-6 rounded-md bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                    <Users className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="font-semibold">+ Person</div>
                    <div className="text-[10px] text-slate-400 dark:text-slate-500">New team member</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsQuickAddOpen(false);
                    onOpenAddProjectModal();
                  }}
                  className="w-full px-3 py-2 text-left flex items-center gap-2.5 text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors cursor-pointer"
                >
                  <div className="w-6 h-6 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <Briefcase className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="font-semibold">+ Project</div>
                    <div className="text-[10px] text-slate-400 dark:text-slate-500">Client project & scope</div>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Primary Action Button */}
          <button
            type="button"
            onClick={onOpenAssignModal}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Assign Staff</span>
          </button>

          {/* Backup, Import & Export */}
          <button
            type="button"
            onClick={onOpenExportModal}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors border border-slate-200 dark:border-slate-800"
            title="Full Information Import, Export & Backup"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Import / Export</span>
          </button>

          {/* Dark Mode toggle */}
          <button
            type="button"
            onClick={onToggleDarkMode}
            className="p-1.5 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </header>
  );
};
