import React from 'react';
import { X, AlertTriangle, CheckCircle2, Wrench } from 'lucide-react';
import {
  Person,
  Project,
  Client,
  Allocation,
  LeaveEntry,
  MONTH_FULL_NAMES
} from '../types';
import { getPersonCapacitySummary } from '../utils/allocationMath';

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

  const conflicts: Array<{
    person: Person;
    monthIndex: number;
    totalPct: number;
    effectiveCapacity: number;
    excessPct: number;
    assignments: Array<{
      project: Project;
      client?: Client;
      percentage: number;
    }>;
  }> = [];

  for (const person of people) {
    const summary = getPersonCapacitySummary(
      person.id,
      selectedYear,
      allocations,
      person.maxCapacityPercent,
      leaves
    );
    for (const ot of summary.overtimeMonths) {
      const personAllocs = allocations.filter(
        (a) => a.personId === person.id && a.year === selectedYear
      );
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

      conflicts.push({
        person,
        monthIndex: ot.monthIndex,
        totalPct: ot.totalPct,
        effectiveCapacity: ot.effectiveCapacity,
        excessPct: ot.excessPct,
        assignments
      });
    }
  }

  const handleAutoBalance = (c: (typeof conflicts)[0]) => {
    if (c.totalPct <= 0) return;
    const scale = c.effectiveCapacity / c.totalPct;
    c.assignments.forEach((a) => {
      const scaled = Math.floor((a.percentage * scale) / 5) * 5;
      onUpdateAllocationMonth(c.person.id, a.project.id, c.monthIndex, scaled);
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex justify-end">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg h-full shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col">
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold">Overtime & Over-Allocation Alerts</h2>
              <p className="text-xs text-slate-400">
                {conflicts.length} {conflicts.length === 1 ? 'conflict' : 'conflicts'} in {selectedYear}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/60 dark:bg-slate-950/50">
          {conflicts.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3">
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
            conflicts.map((c) => (
              <div
                key={`${c.person.id}-${c.monthIndex}`}
                className="bg-white dark:bg-slate-900 rounded-xl border border-rose-200 dark:border-rose-900/80 shadow-xs overflow-hidden"
              >
                <div className="px-4 py-3 bg-rose-50/60 dark:bg-rose-950/40 border-b border-rose-100 dark:border-rose-900/60 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-7 h-7 rounded-full text-white text-xs font-semibold flex items-center justify-center"
                      style={{ backgroundColor: c.person.avatarColor }}
                    >
                      {c.person.initials}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <span>{c.person.name}</span>
                        <span className="font-mono px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300">
                          {MONTH_FULL_NAMES[c.monthIndex]} {selectedYear}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {c.person.role} · {c.person.department}
                      </div>
                    </div>
                  </div>

                  <div className="text-right font-mono">
                    <div className="text-xs font-bold text-rose-700 dark:text-rose-400">
                      {c.totalPct}% / {c.effectiveCapacity}%
                    </div>
                    <div className="text-[10px] font-semibold text-rose-600">
                      +{c.excessPct}% Over
                    </div>
                  </div>
                </div>

                <div className="p-4 space-y-3">
                  {c.assignments.map(({ project, client, percentage }) => (
                    <div key={project.id} className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: project.color }}
                        />
                        <span className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">
                          {project.name}
                        </span>
                        <span className="text-[10px] text-slate-400 truncate">
                          ({client?.name})
                        </span>
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
                              c.person.id,
                              project.id,
                              c.monthIndex,
                              Number(e.target.value)
                            )
                          }
                          className="w-24 accent-blue-600 cursor-pointer"
                        />
                        <span className="w-10 text-right font-mono text-xs font-semibold">
                          {percentage}%
                        </span>
                      </div>
                    </div>
                  ))}

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">
                      Reduce by {c.excessPct}% to resolve overtime
                    </span>
                    <button
                      type="button"
                      onClick={() => handleAutoBalance(c)}
                      className="px-2.5 py-1 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 text-xs font-medium flex items-center gap-1"
                    >
                      <Wrench className="w-3 h-3" />
                      Auto-Cap to {c.effectiveCapacity}%
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
