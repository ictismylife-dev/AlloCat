import React, { useState } from 'react';
import {
  UserCheck,
  Plus,
  Trash2,
  Filter,
  MessageSquare
} from 'lucide-react';
import {
  MONTH_NAMES,
  Person,
  Project,
  Client,
  Allocation,
  LeaveEntry,
  EmploymentType,
  EMPLOYMENT_TYPES,
  EMPLOYMENT_BADGE_CONFIG
} from '../types';
import { getPersonBenchSummary } from '../utils/allocationMath';
import { CommentCell } from './CommentCell';

interface BenchMatrixViewProps {
  people: Person[];
  projects: Project[];
  clients: Client[];
  allocations: Allocation[];
  leaves: LeaveEntry[];
  selectedYear: number;
  onOpenAssignModalForPerson: (personId: string, monthIndex?: number) => void;
  onDeletePerson?: (personId: string) => void;
  onUpdatePersonNotes?: (personId: string, notes: string) => void;
  onUpdatePersonEmployment?: (personId: string, employmentType: EmploymentType) => void;
}

export const BenchMatrixView: React.FC<BenchMatrixViewProps> = ({
  people,
  allocations,
  leaves,
  selectedYear,
  onOpenAssignModalForPerson,
  onDeletePerson,
  onUpdatePersonNotes,
  onUpdatePersonEmployment
}) => {
  const [onlyWithBench, setOnlyWithBench] = useState(false);
  const [minBenchPct, setMinBenchPct] = useState(20);

  const summaries = people
    .map((p) => getPersonBenchSummary(p, selectedYear, allocations, leaves))
    .filter((s) => {
      if (!onlyWithBench) return true;
      return s.monthlyBenchPct.some((pct) => pct >= minBenchPct);
    });

  return (
    <div className="w-full bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-xs">
      {/* Sub-header filter bar */}
      <div className="px-4 sm:px-6 py-2.5 bg-sky-50/60 dark:bg-sky-950/20 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
          <UserCheck className="w-4 h-4 text-sky-600 dark:text-sky-400" />
          <span>
            <strong>Bench Availability</strong> shows unallocated working capacity (Base Capacity − Leaves − Project Allocations). Click any cell to assign a project.
          </span>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1.5 cursor-pointer select-none font-medium text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={onlyWithBench}
              onChange={(e) => setOnlyWithBench(e.target.checked)}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>Only show people with available bench</span>
          </label>

          {onlyWithBench && (
            <select
              value={minBenchPct}
              onChange={(e) => setMinBenchPct(Number(e.target.value))}
              className="px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-xs"
            >
              <option value={10}>≥ 10% free</option>
              <option value={20}>≥ 20% free</option>
              <option value={50}>≥ 50% free</option>
              <option value={100}>100% free</option>
            </select>
          )}
        </div>
      </div>

      <div className="w-full overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[1360px]">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-20">
              <th className="py-2.5 px-4 w-[320px] min-w-[320px] sticky left-0 z-30 bg-slate-50 dark:bg-slate-800 border-r border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <span>Team Member</span>
                  <span className="text-[11px] font-mono font-normal text-slate-400">Avg Bench</span>
                </div>
              </th>

              <th className="py-2.5 px-3 w-[220px] min-w-[200px] max-w-[260px] bg-slate-50 dark:bg-slate-800 border-r border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                  <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                  <span>Comments & Skills Notes</span>
                </div>
              </th>

              {MONTH_NAMES.map((month, idx) => (
                <th
                  key={month}
                  className="py-2.5 px-2 text-center font-mono w-[72px] min-w-[72px] border-r border-slate-200/60 dark:border-slate-800/60 last:border-r-0"
                >
                  <div className="flex flex-col items-center">
                    <span>{month}</span>
                    <span className="text-[10px] text-slate-400 font-normal">M{idx + 1}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
            {summaries.map((summary) => {
              const { person } = summary;
              const empType: EmploymentType = person.employmentType || 'Internal';
              const empBadge = EMPLOYMENT_BADGE_CONFIG[empType];
              return (
                <tr
                  key={person.id}
                  className="group bg-white dark:bg-slate-900 hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <td className="py-3 px-4 sticky left-0 z-10 bg-inherit border-r border-slate-200 dark:border-slate-800">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className="w-7 h-7 rounded-full text-white font-semibold text-[11px] flex items-center justify-center shrink-0 shadow-xs"
                          style={{ backgroundColor: person.avatarColor }}
                        >
                          {person.initials}
                        </div>
                        <div className="min-w-0 truncate">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                              {person.name}
                            </span>
                            {onUpdatePersonEmployment ? (
                              <select
                                value={empType}
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) =>
                                  onUpdatePersonEmployment(
                                    person.id,
                                    e.target.value as EmploymentType
                                  )
                                }
                                title="Change employment type (Internal, External, B2B)"
                                className={`px-1.5 py-0.2 text-[9px] font-mono font-semibold rounded border cursor-pointer focus:outline-hidden ${empBadge.badgeClass}`}
                              >
                                {EMPLOYMENT_TYPES.map((t) => (
                                  <option
                                    key={t}
                                    value={t}
                                    className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                                  >
                                    {t}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <span
                                className={`px-1.5 py-0.2 text-[9px] font-mono font-semibold rounded border ${empBadge.badgeClass}`}
                              >
                                {empType}
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                            {person.role} · {person.department}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="font-mono text-xs font-bold px-1.5 py-0.5 rounded bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                          {summary.annualAverageBenchPct}% free
                        </span>

                        {onDeletePerson && (
                          <button
                            type="button"
                            onClick={() => onDeletePerson(person.id)}
                            className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 rounded transition-all"
                            title={`Remove ${person.name}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </td>

                  <td className="py-2.5 px-2 bg-inherit border-r border-slate-200 dark:border-slate-800 align-middle">
                    <CommentCell
                      value={person.notes}
                      onSave={(newNotes) => onUpdatePersonNotes?.(person.id, newNotes)}
                      placeholder="Add skills / bench note..."
                    />
                  </td>

                  {summary.monthlyBenchPct.map((benchPct, monthIdx) => {
                    const booked = summary.monthlyBookedPct[monthIdx];
                    return (
                      <td
                        key={monthIdx}
                        onClick={() => onOpenAssignModalForPerson(person.id, monthIdx)}
                        className={`p-1 text-center font-mono tabular-nums border-r border-slate-200/60 dark:border-slate-800/60 last:border-r-0 cursor-pointer transition-all hover:ring-2 hover:ring-sky-500/50 ${
                          benchPct >= 50
                            ? 'bg-emerald-50/70 dark:bg-emerald-950/30'
                            : benchPct > 0
                            ? 'bg-sky-50/50 dark:bg-sky-950/20'
                            : ''
                        }`}
                        title={`${benchPct}% available bench (${booked}% booked). Click to assign project.`}
                      >
                        <div className="flex flex-col items-center justify-center py-1">
                          <span
                            className={`text-xs font-bold ${
                              benchPct >= 50
                                ? 'text-emerald-700 dark:text-emerald-400'
                                : benchPct > 0
                                ? 'text-sky-700 dark:text-sky-400'
                                : 'text-slate-300 dark:text-slate-600 font-normal'
                            }`}
                          >
                            {benchPct > 0 ? `${benchPct}%` : '0%'}
                          </span>
                          {benchPct > 0 && (
                            <span className="text-[9px] text-slate-400 flex items-center gap-0.5">
                              <Plus className="w-2.5 h-2.5" /> assign
                            </span>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
