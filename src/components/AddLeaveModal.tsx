import React, { useState, useEffect } from 'react';
import { X, Calendar, Check } from 'lucide-react';
import {
  Person,
  LeaveEntry,
  LeaveType,
  MONTH_FULL_NAMES,
  LEAVE_TYPE_CONFIG
} from '../types';

interface AddLeaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  people: Person[];
  selectedYear: number;
  defaultPersonId?: string;
  defaultMonthIndex?: number;
  onSaveLeave: (leave: Omit<LeaveEntry, 'id'>) => void;
}

export const AddLeaveModal: React.FC<AddLeaveModalProps> = ({
  isOpen,
  onClose,
  people,
  selectedYear,
  defaultPersonId,
  defaultMonthIndex,
  onSaveLeave
}) => {
  const [personId, setPersonId] = useState(defaultPersonId || people[0]?.id || '');
  const [type, setType] = useState<LeaveType>('vacation');
  const [title, setTitle] = useState('Annual Vacation');
  const [startMonth, setStartMonth] = useState<number>(defaultMonthIndex ?? 6);
  const [endMonth, setEndMonth] = useState<number>(defaultMonthIndex ?? 6);
  const [impactPercent, setImpactPercent] = useState<number>(50);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (isOpen) {
      setPersonId(defaultPersonId || people[0]?.id || '');
      setStartMonth(defaultMonthIndex ?? 6);
      setEndMonth(defaultMonthIndex ?? 6);
      setType('vacation');
      setTitle('Annual Vacation');
      setImpactPercent(50);
      setNotes('');
    }
  }, [isOpen, defaultPersonId, defaultMonthIndex, people]);

  if (!isOpen) return null;

  const handleTypeSelect = (newType: LeaveType) => {
    setType(newType);
    const cfg = LEAVE_TYPE_CONFIG[newType];
    setTitle(cfg.label);
    setImpactPercent(cfg.defaultImpact);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!personId || !title.trim()) return;
    onSaveLeave({
      personId,
      type,
      title: title.trim(),
      year: selectedYear,
      startMonth: Math.min(startMonth, endMonth),
      endMonth: Math.max(startMonth, endMonth),
      impactPercent,
      notes: notes.trim() || undefined
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md overflow-hidden">
        <div className="px-5 py-4 bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Schedule Time Off / Leave ({selectedYear})
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Reduces available working capacity during selected months
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md"
          >
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
                  {p.name} ({p.role})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Leave Category
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {(Object.keys(LEAVE_TYPE_CONFIG) as LeaveType[]).map((lt) => (
                <button
                  key={lt}
                  type="button"
                  onClick={() => handleTypeSelect(lt)}
                  className={`px-2.5 py-1.5 rounded-lg border text-left font-medium transition-all ${
                    type === lt
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/60 text-purple-900 dark:text-purple-200 font-semibold'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  {LEAVE_TYPE_CONFIG[lt].label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Title / Reason
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Start Month
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
                End Month
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
                Capacity Reduction Impact
              </label>
              <span className="font-mono font-bold text-purple-600 dark:text-purple-400">
                -{impactPercent}%
              </span>
            </div>
            <input
              type="range"
              min={10}
              max={100}
              step={5}
              value={impactPercent}
              onChange={(e) => setImpactPercent(Number(e.target.value))}
              className="w-full accent-purple-600 cursor-pointer"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Notes (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Handover details, coverage plan..."
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
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-medium"
            >
              <Check className="w-3.5 h-3.5" />
              Save Time Off
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
