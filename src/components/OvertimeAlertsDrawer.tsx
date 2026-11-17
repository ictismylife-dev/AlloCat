import React from 'react';
import { X, AlertTriangle, CheckCircle2, Wrench, Calendar, Sparkles } from 'lucide-react';
import {
  Person,
  Project,
  Client,
  Allocation,
  LeaveEntry,
  MONTH_FULL_NAMES,
  EmploymentType,
  EMPLOYMENT_BADGE_CONFIG
} from '../types';
import { getPersonCapacitySummary, formatPersonTableName } from '../utils/allocationMath';

interface OvertimeAlertsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  people: Person[];
  projects: Project[];
  clients: Client[];
  allocations: Allocation[];
  leaves: LeaveEntry[];
  selectedYear: number;
  onUpdateAllocationMonth: (
    personId: string,
    projectId: string,
    monthIndex: number,
    newPercentage: number
  ) => void;
}

interface PersonConflictGroup {
  person: Person;
  months: Array<{
    monthIndex: number;
    totalPct: number;
    effectiveCapacity: number;
    excessPct: number;
    activeLeaves: LeaveEntry[];
    assignments: Array<{
      project: Project;
      client?: Client;
      percentage: number;
    }>;
  }>;
  totalOverbookedMonths: number;
  maxExcessPct: number;
}

export const OvertimeAlertsDrawer: React.FC<OvertimeAlertsDrawerProps> = ({
  isOpen,
  onClose,
  people,
  projects,
  clients,
  allocations,
  leaves,
  selectedYear,
  onUpdateAllocationMonth
}) => {
  if (!isOpen) return null;

  const personGroups: PersonConflictGroup[] = [];

  for (const person of people) {
    const summary = getPersonCapacitySummary(
      person.id,
      selectedYear,
      allocations,
      person.maxCapacityPercent,
      leaves
    );

    if (summary.overtimeMonths.length > 0) {
      const personAllocs = allocations.filter(
        (a) => a.personId === person.id && a.year === selectedYear
      );

      const conflictMonths = summary.overtimeMonths.map((ot) => {
        const assignments = personAllocs
          .map((a) => {
            const project = projects.find((p) => p.id === a.projectId);
            if (!project) return null;
            return {
              project,
              client: clients.find((c) => c.id === project.clientId),
              percentage: a.monthlyPercentage[ot.monthIndex] || 0
            };
          })
          .filter((item): item is NonNullable<typeof item> => Boolean(item && item.percentage > 0));

        return {
          monthIndex: ot.monthIndex,
          totalPct: ot.totalPct,
          effectiveCapacity: ot.effectiveCapacity,
          excessPct: ot.excessPct,
          activeLeaves: ot.activeLeaves,
          assignments
        };
      });

      const maxExcessPct = Math.max(...conflictMonths.map((m) => m.excessPct));

      personGroups.push({
        person,
        months: conflictMonths,
        totalOverbookedMonths: conflictMonths.length,
        maxExcessPct
      });
    }
  }

  const totalConflictsCount = personGroups.reduce((acc, g) => acc + g.months.length, 0);

  const handleAutoBalanceMonth = (
    personId: string,
    monthIndex: number,
    totalPct: number,
    effectiveCapacity: number,
    assignments: Array<{ project: Project; percentage: number }>
  ) => {
    if (totalPct <= 0) return;
    const scale = effectiveCapacity / totalPct;
    assignments.forEach((a) => {
      const scaled = Math.floor((a.percentage * scale) / 5) * 5;
      onUpdateAllocationMonth(personId, a.project.id, monthIndex, scaled);
    });
  };

  const handleAutoBalancePersonAll = (group: PersonConflictGroup) => {
    group.months.forEach((m) => {
      handleAutoBalanceMonth(
        group.person.id,
        m.monthIndex,
        m.totalPct,
        m.effectiveCapacity,
        m.assignments
      );
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex justify-end">
      <div className="bg-white dark:bg-slate-900 w-full max-w-xl h-full shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold">Overtime & Over-Allocation Alerts</h2>
              <p className="text-xs text-slate-400">
                {totalConflictsCount} {totalConflictsCount === 1 ? 'conflict' : 'conflicts'} across{' '}
                {personGroups.length} {personGroups.length === 1 ? 'person' : 'people'} in {selectedYear}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer transition-colors"
            title="Close alerts drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content list grouped by person */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 bg-slate-50/70 dark:bg-slate-950/50">
          {personGroups.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Zero Capacity Conflicts
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Every team member is within their effective monthly capacity.
              </p>
            </div>
          ) : (
            personGroups.map((group) => {
              const empType: EmploymentType = group.person.employmentType || 'Internal';
              const empBadge = EMPLOYMENT_BADGE_CONFIG[empType];

              return (
                <div
                  key={group.person.id}
                  className="bg-white dark:bg-slate-900 rounded-xl border border-rose-200 dark:border-rose-900/80 shadow-xs overflow-hidden"
                >
                  {/* Person Group Header */}
                  <div className="px-4 py-3 bg-rose-50/90 dark:bg-rose-950/50 border-b border-rose-200/80 dark:border-rose-900/60 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-8 h-8 rounded-full text-white text-xs font-semibold flex items-center justify-center shrink-0 shadow-2xs"
                        style={{ backgroundColor: group.person.avatarColor }}
                      >
                        {group.person.initials}
                      </div>

                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 flex-wrap">
                          <span className="truncate">{formatPersonTableName(group.person)}</span>
                          <span
                            className={`px-1.5 py-0.2 text-[9px] font-mono font-semibold rounded border ${empBadge.badgeClass}`}
                          >
                            {empType}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          {group.person.role} · {group.person.department}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="text-right font-mono">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-200 border border-rose-300 dark:border-rose-800">
                          <AlertTriangle className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                          <span>
                            {group.totalOverbookedMonths}{' '}
                            {group.totalOverbookedMonths === 1 ? 'month' : 'months'}
                          </span>
                        </span>
                      </div>

                      {group.totalOverbookedMonths > 1 && (
                        <button
                          type="button"
                          onClick={() => handleAutoBalancePersonAll(group)}
                          className="px-2.5 py-1 rounded-md bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-medium flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
                          title="Auto-cap all overbooked months for this person"
                        >
                          <Sparkles className="w-3 h-3" />
                          <span>Auto-Cap All</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Overtime Months for this person */}
                  <div className="p-4 space-y-3.5 bg-white dark:bg-slate-900">
                    {group.months.map((m) => (
                      <div
                        key={`${group.person.id}-${m.monthIndex}`}
                        className="p-3.5 bg-slate-50/80 dark:bg-slate-800/40 rounded-lg border border-slate-200 dark:border-slate-800 space-y-3"
                      >
                        {/* Month Header Banner */}
                        <div className="flex items-center justify-between gap-2 border-b border-slate-200/60 dark:border-slate-800/80 pb-2.5">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 shadow-2xs">
                              {MONTH_FULL_NAMES[m.monthIndex]} {selectedYear}
                            </span>

                            {m.activeLeaves.length > 0 && (
                              <span
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300"
                                title={`Effective capacity reduced to ${m.effectiveCapacity}% due to ${m.activeLeaves.map((l) => l.title).join(', ')}`}
                              >
                                <Calendar className="w-3 h-3" />
                                <span>Time off: {m.effectiveCapacity}% cap</span>
                              </span>
                            )}
                          </div>

                          <div className="text-right font-mono">
                            <div className="text-xs font-bold text-rose-700 dark:text-rose-400">
                              {m.totalPct}% allocated / {m.effectiveCapacity}% cap
                            </div>
                            <div className="text-[10px] font-semibold text-rose-600 dark:text-rose-400">
                              +{m.excessPct}% overtime
                            </div>
                          </div>
                        </div>

                        {/* Project Sliders for this month */}
                        <div className="space-y-2">
                          {m.assignments.map(({ project, client, percentage }) => (
                            <div
                              key={project.id}
                              className="flex items-center justify-between gap-3 text-xs"
                            >
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                <span
                                  className="w-2.5 h-2.5 rounded-full shrink-0"
                                  style={{ backgroundColor: project.color }}
                                />
                                <span className="font-medium text-slate-800 dark:text-slate-200 truncate">
                                  {project.name}
                                </span>
                                {client && (
                                  <span className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
                                    ({client.name})
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <input
                                  type="range"
                                  min={0}
                                  max={100}
                                  step={5}
                                  value={percentage}
                                  onChange={(e) =>
                                    onUpdateAllocationMonth(
                                      group.person.id,
                                      project.id,
                                      m.monthIndex,
                                      Number(e.target.value)
                                    )
                                  }
                                  className="w-24 accent-blue-600 cursor-pointer"
                                />
                                <span className="w-10 text-right font-mono font-semibold tabular-nums text-slate-800 dark:text-slate-200">
                                  {percentage}%
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Month Action Footer */}
                        <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/80 flex items-center justify-between gap-2">
                          <span className="text-[11px] text-slate-500 dark:text-slate-400">
                            Reduce total by <strong className="text-rose-600 dark:text-rose-400">{m.excessPct}%</strong> to resolve
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              handleAutoBalanceMonth(
                                group.person.id,
                                m.monthIndex,
                                m.totalPct,
                                m.effectiveCapacity,
                                m.assignments
                              )
                            }
                            className="px-2.5 py-1 rounded bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-400 text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <Wrench className="w-3 h-3" />
                            <span>Auto-Cap to {m.effectiveCapacity}%</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
