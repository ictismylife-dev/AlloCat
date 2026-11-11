import React, { useState, useEffect } from 'react';
import { X, CalendarRange, Check } from 'lucide-react';
import { Person, Project, Client, MONTH_FULL_NAMES } from '../types';

interface BatchAssignModalProps {
  isOpen: boolean;
  onClose: () => void;
  people: Person[];
  projects: Project[];
  clients: Client[];
  selectedYear: number;
  defaultPersonId?: string;
  defaultProjectId?: string;
  defaultMonthIndex?: number;
  onAssign: (
    personId: string,
    projectId: string,
    startMonth: number,
    endMonth: number,
    percentage: number,
    notes?: string
  ) => void;
}

export const BatchAssignModal: React.FC<BatchAssignModalProps> = ({
  isOpen,
  onClose,
  people,
  projects,
  clients,
  selectedYear,
  defaultPersonId,
  defaultProjectId,
  defaultMonthIndex,
  onAssign
}) => {
  const [personId, setPersonId] = useState(defaultPersonId || people[0]?.id || '');
  const [projectId, setProjectId] = useState(defaultProjectId || projects[0]?.id || '');
  const [startMonth, setStartMonth] = useState<number>(defaultMonthIndex ?? 0);
  const [endMonth, setEndMonth] = useState<number>(defaultMonthIndex ?? 11);
  const [percentage, setPercentage] = useState<number>(50);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (isOpen) {
      setPersonId(defaultPersonId || people[0]?.id || '');
      setProjectId(defaultProjectId || projects[0]?.id || '');
      setStartMonth(defaultMonthIndex ?? 0);
      setEndMonth(defaultMonthIndex !== undefined ? Math.min(11, defaultMonthIndex + 2) : 11);
      setPercentage(50);
      setNotes('');
    }
  }, [isOpen, defaultPersonId, defaultProjectId, defaultMonthIndex, people, projects]);

  if (!isOpen) return null;

  const getClientName = (clientId: string) =>
    clients.find((c) => c.id === clientId)?.name || 'Client';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!personId || !projectId) return;
    onAssign(
      personId,
      projectId,
      Math.min(startMonth, endMonth),
      Math.max(startMonth, endMonth),
      percentage,
      notes.trim() || undefined
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md overflow-hidden">
        <div className="px-5 py-4 bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <CalendarRange className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Assign Staff to Project ({selectedYear})
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Set allocation across a range of months
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-md">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Team Member
            </label>
            <select
              value={personId}
              onChange={(e) => setPersonId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            >
              {people.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — {p.role} ({p.department})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Project
            </label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            >
              {projects.map((proj) => (
                <option key={proj.id} value={proj.id}>
                  [{getClientName(proj.clientId)}] {proj.name} ({proj.code})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                From Month
              </label>
              <select
                value={startMonth}
                onChange={(e) => {
                  const m = Number(e.target.value);
                  setStartMonth(m);
                  if (m > endMonth) setEndMonth(m);
                }}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              >
                {MONTH_FULL_NAMES.map((m, idx) => (
                  <option key={m} value={idx}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                To Month
              </label>
              <select
                value={endMonth}
                onChange={(e) => setEndMonth(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              >
                {MONTH_FULL_NAMES.map((m, idx) => (
                  <option key={m} value={idx} disabled={idx < startMonth}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Monthly Allocation
              </label>
              <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                {percentage}%
              </span>
            </div>
            <input
              type="range"
              min={5}
              max={100}
              step={5}
              value={percentage}
              onChange={(e) => setPercentage(Number(e.target.value))}
              className="w-full accent-blue-600 cursor-pointer"
            />
            <div className="grid grid-cols-4 gap-1.5 mt-2">
              {[25, 50, 75, 100].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setPercentage(val)}
                  className={`py-1 rounded font-mono border ${
                    percentage === val
                      ? 'bg-blue-600 text-white border-blue-600 font-bold'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {val}%
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Assignment Comment (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g., Acting tech lead..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium"
            >
              <Check className="w-3.5 h-3.5" />
              Assign
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
