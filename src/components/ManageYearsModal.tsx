import React, { useState } from 'react';
import { X, Calendar, Plus, Trash2, AlertCircle } from 'lucide-react';

interface ManageYearsModalProps {
  isOpen: boolean;
  years: number[];
  selectedYear: number;
  onAddYear: (year: number) => void;
  onRemoveYear: (year: number) => void;
  onSelectYear: (year: number) => void;
  onClose: () => void;
}

export const ManageYearsModal: React.FC<ManageYearsModalProps> = ({
  isOpen,
  years,
  selectedYear,
  onAddYear,
  onRemoveYear,
  onSelectYear,
  onClose
}) => {
  const maxYear = years.length > 0 ? Math.max(...years) : new Date().getFullYear();
  const [customYear, setCustomYear] = useState<string>(String(maxYear + 1));
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAddYear = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseInt(customYear, 10);
    if (isNaN(parsed) || parsed < 2000 || parsed > 2100) {
      setError('Please enter a valid year between 2000 and 2100.');
      return;
    }
    if (years.includes(parsed)) {
      setError(`Year ${parsed} is already in your planning horizon.`);
      return;
    }
    setError(null);
    onAddYear(parsed);
    const nextSuggested = Math.max(...years, parsed) + 1;
    setCustomYear(String(nextSuggested));
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md overflow-hidden">
        <div className="px-5 py-4 bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Manage Planning Years
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Add or remove years in your planning timeline
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Active Planning Years ({years.length})
            </label>
            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
              {years.map((yr) => {
                const isSelected = yr === selectedYear;
                const canDelete = years.length > 1;

                return (
                  <div
                    key={yr}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg border transition-all ${
                      isSelected
                        ? 'bg-blue-50/70 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800 text-blue-950 dark:text-blue-100'
                        : 'bg-slate-50/70 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-sm font-bold">{yr}</span>
                      {isSelected && (
                        <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-600 text-white">
                          Current View
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      {!isSelected && (
                        <button
                          type="button"
                          onClick={() => onSelectYear(yr)}
                          className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline px-2 py-1"
                        >
                          Switch to {yr}
                        </button>
                      )}
                      <button
                        type="button"
                        disabled={!canDelete}
                        onClick={() => onRemoveYear(yr)}
                        className={`p-1.5 rounded-md ${
                          canDelete
                            ? 'text-slate-400 hover:text-rose-600'
                            : 'text-slate-200 dark:text-slate-700 cursor-not-allowed'
                        }`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <form onSubmit={handleAddYear} className="pt-3 border-t border-slate-200 dark:border-slate-800">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Add New Year
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={2000}
                max={2100}
                value={customYear}
                onChange={(e) => {
                  setCustomYear(e.target.value);
                  setError(null);
                }}
                className="flex-1 px-3 py-2 text-sm font-mono bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
              />
              <button
                type="submit"
                className="px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-1.5 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Year
              </button>
            </div>

            {error && (
              <div className="mt-2 flex items-center gap-1.5 text-xs text-rose-600">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </form>

          <div className="pt-2 flex items-center justify-end border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 rounded-lg"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
