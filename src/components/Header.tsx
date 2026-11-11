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

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    if (isUserMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isUserMenuOpen]);

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
          {/* Year selector */}
          <div className="flex items-center bg-slate-200/80 dark:bg-slate-800/80 p-0.5 rounded-lg border border-slate-300/70 dark:border-slate-700/60 gap-0.5">
            {availableYears.map((y) => (
              <button
                key={y}
                type="button"
                onClick={() => onYearChange(y)}
                className={`px-2.5 py-1 text-xs font-mono font-medium rounded-md transition-all whitespace-nowrap ${
                  selectedYear === y
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {y}
              </button>
            ))}
            <button
              type="button"
              onClick={onOpenManageYearsModal}
              className="p-1 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-300/60 dark:hover:bg-slate-700/60 rounded transition-colors"
              title="Add or remove planning years"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Perspective switcher: People vs Clients vs Availability vs Bench */}
          <div className="flex items-center bg-slate-200/80 dark:bg-slate-800/80 p-0.5 rounded-lg border border-slate-300/70 dark:border-slate-700/60">
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

          {/* Quick Add Buttons */}
          <div className="hidden lg:flex items-center gap-1.5">
            <button
              type="button"
              onClick={onOpenAddLeaveModal}
              className="px-2.5 py-1.5 text-xs font-medium text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/50 rounded-lg transition-colors whitespace-nowrap border border-purple-200 dark:border-purple-800"
            >
              + Time Off
            </button>
            <button
              type="button"
              onClick={onOpenAddPersonModal}
              className="px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap border border-slate-200 dark:border-slate-800"
            >
              + Person
            </button>
            <button
              type="button"
              onClick={onOpenAddProjectModal}
              className="px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap border border-slate-200 dark:border-slate-800"
            >
              + Project
            </button>
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
