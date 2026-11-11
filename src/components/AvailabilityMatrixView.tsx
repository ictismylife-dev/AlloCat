import React from 'react';
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Trash2,
  Pencil,
  Calendar,
  AlertTriangle,
  MessageSquare,
  ArrowDownAZ,
  ArrowUpZA
} from 'lucide-react';
import {
  MONTH_NAMES,
  Person,
  Allocation,
  LeaveEntry,
  LEAVE_TYPE_CONFIG,
  EmploymentType,
  EMPLOYMENT_TYPES,
  EMPLOYMENT_BADGE_CONFIG,
  PeopleSortOrder
} from '../types';
import { getPersonCapacitySummary } from '../utils/allocationMath';
import { CommentCell } from './CommentCell';

interface AvailabilityMatrixViewProps {
  people: Person[];
  allocations: Allocation[];
  leaves: LeaveEntry[];
  selectedYear: number;
  expandedPersonIds: Set<string>;
  onTogglePersonExpand: (personId: string) => void;
  onOpenAddLeaveForPerson: (personId: string, monthIndex?: number) => void;
  onDeleteLeave: (leaveId: string) => void;
  onEditPerson?: (person: Person) => void;
  onDeletePerson?: (personId: string) => void;
  onUpdatePersonNotes?: (personId: string, notes: string) => void;
  onUpdatePersonEmployment?: (personId: string, employmentType: EmploymentType) => void;
  onUpdateLeaveNotes?: (leaveId: string, notes: string) => void;
  peopleSort?: PeopleSortOrder;
  onTogglePeopleSort?: () => void;
}

export const AvailabilityMatrixView: React.FC<AvailabilityMatrixViewProps> = ({
  people,
  allocations,
  leaves,
  selectedYear,
  expandedPersonIds,
  onTogglePersonExpand,
  onOpenAddLeaveForPerson,
  onDeleteLeave,
  onEditPerson,
  onDeletePerson,
  onUpdatePersonNotes,
  onUpdatePersonEmployment,
  onUpdateLeaveNotes,
  peopleSort = 'default',
  onTogglePeopleSort
}) => {
  if (people.length === 0) {
    return (
      <div className="p-12 text-center text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 m-6">
        <p className="font-medium text-sm">No team members match the selected filters.</p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-xs">
      <table className="w-full text-left border-collapse min-w-[1360px]">
        <thead>
          <tr className="bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-20">
            <th className="py-2.5 px-4 w-[320px] min-w-[320px] sticky left-0 z-30 bg-slate-50 dark:bg-slate-800 border-r border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <span>Team Member & Scheduled Time Off</span>
                  {onTogglePeopleSort && (
                    <button
                      type="button"
                      onClick={onTogglePeopleSort}
                      className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-mono transition-colors cursor-pointer ${
                        peopleSort !== 'default'
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 font-bold'
                          : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700/60'
                      }`}
                      title="Sort team members alphabetically (A–Z / Z–A)"
                    >
                      {peopleSort.endsWith('-desc') ? (
                        <ArrowUpZA className="w-3 h-3" />
                      ) : (
                        <ArrowDownAZ className="w-3 h-3" />
                      )}
                      <span>{peopleSort.endsWith('-desc') ? 'Z–A' : 'A–Z'}</span>
                    </button>
                  )}
                </div>
                <span className="text-[11px] font-mono font-normal text-slate-400">Leaves</span>
              </div>
            </th>

            <th className="py-2.5 px-3 w-[220px] min-w-[200px] max-w-[260px] bg-slate-50 dark:bg-slate-800 border-r border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                <span>Comments & Leave Notes</span>
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
          {people.map((person) => {
            const isExpanded = expandedPersonIds.has(person.id);
            const empType: EmploymentType = person.employmentType || 'Internal';
            const empBadge = EMPLOYMENT_BADGE_CONFIG[empType];
            const capacitySummary = getPersonCapacitySummary(
              person.id,
              selectedYear,
              allocations,
              person.maxCapacityPercent,
              leaves
            );
            const personLeaves = leaves.filter(
              (l) => l.personId === person.id && l.year === selectedYear
            );

            return (
              <React.Fragment key={person.id}>
                <tr className="group bg-white dark:bg-slate-900 hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="py-3 px-4 sticky left-0 z-10 bg-inherit border-r border-slate-200 dark:border-slate-800">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <button
                          type="button"
                          onClick={() => onTogglePersonExpand(person.id)}
                          className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded transition-colors"
                        >
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </button>

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

                      <div className="flex items-center gap-1 shrink-0">
                        <span className="font-mono text-[11px] font-semibold px-1.5 py-0.5 rounded bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                          {personLeaves.length} {personLeaves.length === 1 ? 'leave' : 'leaves'}
                        </span>

                        {onEditPerson && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onEditPerson(person);
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded transition-all cursor-pointer"
                            title={`Edit ${person.name}`}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {onDeletePerson && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeletePerson(person.id);
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded transition-all cursor-pointer"
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
                      placeholder="Add staffing note..."
                    />
                  </td>

                  {capacitySummary.effectiveCapacities.map((effCap, monthIdx) => {
                    const reduction = capacitySummary.leaveReductions[monthIdx];
                    const booked = capacitySummary.totals[monthIdx];
                    const isConflict = booked > effCap;

                    return (
                      <td
                        key={monthIdx}
                        onClick={() => onOpenAddLeaveForPerson(person.id, monthIdx)}
                        className={`p-1 text-center font-mono tabular-nums border-r border-slate-200/60 dark:border-slate-800/60 last:border-r-0 cursor-pointer transition-all hover:ring-2 hover:ring-purple-500/50 ${
                          isConflict
                            ? 'bg-rose-50 dark:bg-rose-950/40'
                            : reduction > 0
                            ? 'bg-purple-50/70 dark:bg-purple-950/30'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                        }`}
                        title={`Effective capacity: ${effCap}% (Leave reduction: -${reduction}%, Booked projects: ${booked}%). Click to schedule leave.`}
                      >
                        <div className="flex flex-col items-center justify-center py-1">
                          <span
                            className={`text-xs font-semibold ${
                              reduction > 0
                                ? 'text-purple-700 dark:text-purple-300'
                                : 'text-emerald-600 dark:text-emerald-400'
                            }`}
                          >
                            {effCap}%
                          </span>
                          {reduction > 0 && (
                            <span className="text-[9px] text-purple-600 dark:text-purple-400 font-medium">
                              -{reduction}% off
                            </span>
                          )}
                          {isConflict && (
                            <span className="mt-0.5 inline-flex items-center gap-0.5 px-1 py-0.2 text-[8px] font-bold bg-rose-600 text-white rounded">
                              <AlertTriangle className="w-2.5 h-2.5" />
                              {booked}% bkd
                            </span>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>

                {isExpanded && (
                  <>
                    {personLeaves.map((leave) => {
                      const cfg = LEAVE_TYPE_CONFIG[leave.type];
                      const fromM = Math.min(leave.startMonth, leave.endMonth);
                      const toM = Math.max(leave.startMonth, leave.endMonth);

                      return (
                        <tr
                          key={leave.id}
                          className="bg-slate-50/50 dark:bg-slate-800/30 hover:bg-slate-100/60 dark:hover:bg-slate-800/60 transition-colors group/sub"
                        >
                          <td className="py-2 px-4 pl-12 sticky left-0 z-10 bg-inherit border-r border-slate-200 dark:border-slate-800">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <Calendar className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
                                <div className="min-w-0 truncate">
                                  <div className="font-medium text-slate-800 dark:text-slate-200 truncate text-[11px]">
                                    {leave.title}
                                  </div>
                                  <div className="text-[10px] text-slate-400 truncate">
                                    {cfg.label} · {MONTH_NAMES[fromM]}–{MONTH_NAMES[toM]} (-{leave.impactPercent}%)
                                  </div>
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => onDeleteLeave(leave.id)}
                                className="opacity-0 group-hover/sub:opacity-100 p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded transition-all"
                                title="Delete leave entry"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>

                          <td className="py-1.5 px-2 bg-inherit border-r border-slate-200 dark:border-slate-800 align-middle">
                            <CommentCell
                              value={leave.notes || ''}
                              onSave={(newNotes) => onUpdateLeaveNotes?.(leave.id, newNotes)}
                              placeholder="Add leave note..."
                            />
                          </td>

                          {MONTH_NAMES.map((_, mIdx) => {
                            const isActive = mIdx >= fromM && mIdx <= toM;
                            return (
                              <td
                                key={mIdx}
                                className={`p-1 text-center font-mono tabular-nums border-r border-slate-200/50 dark:border-slate-800/50 last:border-r-0 ${
                                  isActive ? 'bg-purple-50/70 dark:bg-purple-950/30' : ''
                                }`}
                              >
                                {isActive ? (
                                  <span
                                    className={`inline-block px-1.5 py-0.5 text-[10px] font-semibold rounded border ${cfg.badgeClass}`}
                                  >
                                    -{leave.impactPercent}%
                                  </span>
                                ) : (
                                  <span className="text-slate-300 dark:text-slate-600">—</span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}

                    <tr className="bg-slate-50/30 dark:bg-slate-800/20 border-b border-slate-200/60 dark:border-slate-800/60">
                      <td colSpan={14} className="py-1.5 px-4 pl-12 text-xs sticky left-0 z-10">
                        <button
                          type="button"
                          onClick={() => onOpenAddLeaveForPerson(person.id)}
                          className="inline-flex items-center gap-1.5 text-xs text-purple-600 dark:text-purple-400 hover:text-purple-700 font-medium py-1 px-2 rounded-md hover:bg-purple-50 dark:hover:bg-purple-950/40 transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Schedule time off for {person.name.split(' ')[0]}</span>
                        </button>
                      </td>
                    </tr>
                  </>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
