import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Check,
  Trash2,
  AlertTriangle,
  Activity,
  Layers,
  Calendar
} from 'lucide-react';
import { MONTH_FULL_NAMES, Person, Project, Client, Allocation, LeaveEntry } from '../types';

interface CellAllocationPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  person: Person;
  project: Project;
  monthIndex: number;
  currentPercentage: number;
  personMonthlyTotalOtherProjects: number;
  projects?: Project[];
  clients?: Client[];
  allocations?: Allocation[];
  leaves?: LeaveEntry[];
  selectedYear?: number;
  onSave: (newPercentage: number, fillOptions?: { applyToAllRemaining?: boolean; applyToAllYear?: boolean }) => void;
  onDeleteAllocation?: () => void;
  onSwitchProject?: (projectId: string) => void;
}

export const CellAllocationPopover: React.FC<CellAllocationPopoverProps> = ({
  isOpen,
  onClose,
  person,
  project,
  monthIndex,
  currentPercentage,
  projects = [],
  clients = [],
  allocations = [],
  leaves = [],
  selectedYear = 2026,
  onSave,
  onDeleteAllocation,
  onSwitchProject
}) => {
  const [percentage, setPercentage] = useState<number>(currentPercentage);
  const [fillMode, setFillMode] = useState<'single' | 'remaining' | 'year'>('single');

  useEffect(() => {
    setPercentage(currentPercentage);
    setFillMode('single');
  }, [currentPercentage, monthIndex, person.id, project.id, isOpen]);

  const activeLeavesInMonth = useMemo(() => {
    return leaves.filter((l) => {
      if (l.personId !== person.id || l.year !== selectedYear) return false;
      const from = Math.min(l.startMonth, l.endMonth);
      const to = Math.max(l.startMonth, l.endMonth);
      return monthIndex >= from && monthIndex <= to;
    });
  }, [leaves, person.id, selectedYear, monthIndex]);

  const totalLeaveImpact = activeLeavesInMonth.reduce((acc, l) => acc + l.impactPercent, 0);
  const effectiveCapacity = Math.max(0, person.maxCapacityPercent - totalLeaveImpact);

  const personAllocationsInMonth = useMemo(() => {
    const personAllocs = allocations.filter(
      (a) => a.personId === person.id && a.year === selectedYear
    );

    const list: Array<{
      projectId: string;
      projectName: string;
      projectCode: string;
      projectColor: string;
      clientName: string;
      isBillable: boolean;
      percentage: number;
      isCurrent: boolean;
      notes?: string;
    }> = [];

    let hasCurrentProject = false;

    for (const alloc of personAllocs) {
      const isCurrent = alloc.projectId === project.id;
      if (isCurrent) hasCurrentProject = true;

      const proj = projects.find((p) => p.id === alloc.projectId) || (isCurrent ? project : null);
      if (!proj) continue;

      const client = clients.find((c) => c.id === proj.clientId);
      const allocatedPct = isCurrent ? percentage : (alloc.monthlyPercentage[monthIndex] || 0);

      if (isCurrent || allocatedPct > 0) {
        list.push({
          projectId: proj.id,
          projectName: proj.name,
          projectCode: proj.code,
          projectColor: proj.color,
          clientName: client?.name || 'Internal',
          isBillable: proj.billable,
          percentage: allocatedPct,
          isCurrent,
          notes: alloc.notes || proj.notes
        });
      }
    }

    if (!hasCurrentProject && project) {
      const client = clients.find((c) => c.id === project.clientId);
      list.unshift({
        projectId: project.id,
        projectName: project.name,
        projectCode: project.code,
        projectColor: project.color,
        clientName: client?.name || 'Internal',
        isBillable: project.billable,
        percentage: percentage,
        isCurrent: true,
        notes: project.notes
      });
    }

    return list.sort((a, b) => {
      if (a.isCurrent) return -1;
      if (b.isCurrent) return 1;
      return b.percentage - a.percentage;
    });
  }, [allocations, projects, clients, person.id, project, monthIndex, selectedYear, percentage]);

  if (!isOpen) return null;

  const otherProjectsSum = personAllocationsInMonth
    .filter((item) => !item.isCurrent)
    .reduce((sum, item) => sum + item.percentage, 0);

  const totalWithNewAllocation = otherProjectsSum + percentage;
  const isOverAllocated = totalWithNewAllocation > effectiveCapacity;
  const excess = totalWithNewAllocation - effectiveCapacity;
  const unassignedCapacity = Math.max(0, effectiveCapacity - totalWithNewAllocation);

  const presets = [0, 25, 50, 75, 100];

  const handleApply = () => {
    onSave(percentage, {
      applyToAllRemaining: fillMode === 'remaining',
      applyToAllYear: fillMode === 'year'
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4 max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span 
                className="w-3 h-3 rounded-full shrink-0" 
                style={{ backgroundColor: project.color }}
              />
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                {project.name}
              </h3>
              <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                {project.code}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
              <span className="font-semibold text-slate-700 dark:text-slate-200">{person.name}</span>
              <span>({person.role})</span>
              <span>·</span>
              <span className="font-semibold text-blue-600 dark:text-blue-400">{MONTH_FULL_NAMES[monthIndex]} {selectedYear}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Input & Quick Presets */}
        <div className="space-y-2.5 bg-slate-50/60 dark:bg-slate-800/40 p-3.5 rounded-xl border border-slate-200/70 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <span>{project.name} Allocation:</span>
            </label>
            <div className="flex items-center gap-1.5">
              <span className="text-base font-bold font-mono text-blue-600 dark:text-blue-400 tabular-nums">
                {percentage}%
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                ({(percentage / 100).toFixed(2)} FTE)
              </span>
            </div>
          </div>

          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={percentage}
            onChange={(e) => setPercentage(Number(e.target.value))}
            className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />

          <div className="grid grid-cols-5 gap-1.5 pt-0.5">
            {presets.map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => setPercentage(val)}
                className={`py-1 text-xs font-mono font-medium rounded-md border transition-all ${
                  percentage === val
                    ? 'bg-blue-600 border-blue-600 text-white font-bold shadow-xs'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                {val}%
              </button>
            ))}
          </div>
        </div>

        {/* TOTAL WORKLOAD & ALLOCATIONS SECTION */}
        <div className={`p-3.5 rounded-xl border text-xs space-y-3 transition-colors ${
          isOverAllocated
            ? 'bg-rose-50/60 dark:bg-rose-950/25 border-rose-300 dark:border-rose-900/80 text-rose-900 dark:text-rose-200'
            : totalWithNewAllocation >= effectiveCapacity
            ? 'bg-emerald-50/60 dark:bg-emerald-950/25 border-emerald-300 dark:border-emerald-900/80 text-emerald-900 dark:text-emerald-200'
            : 'bg-slate-50/80 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200'
        }`}>
          <div className="flex items-center justify-between pb-2 border-b border-slate-200/80 dark:border-slate-700/80">
            <div className="flex items-center gap-1.5">
              {isOverAllocated ? (
                <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 animate-pulse" />
              ) : (
                <Activity className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
              )}
              <span className="font-bold text-xs text-slate-900 dark:text-slate-100">
                Total {person.name.split(' ')[0]}'s {MONTH_FULL_NAMES[monthIndex]} Workload:
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-sm tabular-nums text-slate-900 dark:text-slate-100">
                {totalWithNewAllocation}%
                <span className="text-[11px] font-normal text-slate-500 dark:text-slate-400">
                  {' '}/ {effectiveCapacity}%
                </span>
              </span>

              {isOverAllocated ? (
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-rose-600 text-white shadow-2xs">
                  +{excess}% Over
                </span>
              ) : totalWithNewAllocation === effectiveCapacity ? (
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-600 text-white shadow-2xs">
                  Balanced
                </span>
              ) : (
                <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                  {unassignedCapacity}% Available
                </span>
              )}
            </div>
          </div>

          {/* Multi-segment Visual Capacity Bar */}
          <div className="space-y-1">
            <div className="h-2 w-full bg-slate-200/80 dark:bg-slate-700/80 rounded-full overflow-hidden flex shadow-inner">
              {personAllocationsInMonth.map((item) => {
                if (item.percentage <= 0) return null;
                const visualDenominator = Math.max(100, totalWithNewAllocation + totalLeaveImpact);
                const widthPct = (item.percentage / visualDenominator) * 100;

                return (
                  <div
                    key={item.projectId}
                    className="h-full transition-all duration-150"
                    style={{ width: `${widthPct}%`, backgroundColor: item.projectColor }}
                    title={`${item.projectName}: ${item.percentage}%`}
                  />
                );
              })}

              {totalLeaveImpact > 0 && (
                <div
                  className="h-full bg-purple-500 transition-all duration-150"
                  style={{
                    width: `${(totalLeaveImpact / Math.max(100, totalWithNewAllocation + totalLeaveImpact)) * 100}%`
                  }}
                  title={`Time Off & Leaves: -${totalLeaveImpact}% available capacity`}
                />
              )}
            </div>

            <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono px-0.5">
              <span>0%</span>
              <span>Available Capacity: {effectiveCapacity}% {totalLeaveImpact > 0 ? `(reduced from ${person.maxCapacityPercent}% by leaves)` : ''}</span>
              <span>{Math.max(100, totalWithNewAllocation)}%</span>
            </div>
          </div>

          {/* WHERE THIS PERSON IS ALLOCATED LIST */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700 dark:text-slate-300">
              <span className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-slate-500" />
                <span>Where {person.name.split(' ')[0]} is allocated in {MONTH_FULL_NAMES[monthIndex]}:</span>
              </span>
              <span className="text-[10px] font-normal text-slate-400">
                {personAllocationsInMonth.length} {personAllocationsInMonth.length === 1 ? 'assignment' : 'assignments'}
              </span>
            </div>

            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-0.5">
              {personAllocationsInMonth.map((item) => (
                <div
                  key={item.projectId}
                  className={`flex items-center justify-between p-2 rounded-lg border text-xs transition-all ${
                    item.isCurrent
                      ? 'bg-blue-50/90 dark:bg-blue-950/50 border-blue-400/80 dark:border-blue-700/80 shadow-2xs ring-1 ring-blue-500/30'
                      : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/70 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0 pr-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0 shadow-2xs"
                      style={{ backgroundColor: item.projectColor }}
                    />
                    <div className="min-w-0 truncate">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                          {item.projectName}
                        </span>
                        {item.isCurrent ? (
                          <span className="shrink-0 px-1.5 py-0.2 text-[9px] font-bold rounded-sm bg-blue-600 text-white tracking-wide uppercase">
                            Currently Editing
                          </span>
                        ) : null}
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate flex items-center gap-1 mt-0.5">
                        <span className="font-medium text-slate-700 dark:text-slate-300">{item.clientName}</span>
                        <span>·</span>
                        <span className="font-mono">{item.projectCode}</span>
                        {item.isBillable && (
                          <>
                            <span>·</span>
                            <span className="text-emerald-600 dark:text-emerald-400">Billable</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`font-mono font-bold text-xs tabular-nums px-2 py-0.5 rounded-md ${
                      item.isCurrent
                        ? 'bg-blue-600 text-white font-bold'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200'
                    }`}>
                      {item.percentage}%
                    </span>

                    {!item.isCurrent && onSwitchProject && (
                      <button
                        type="button"
                        onClick={() => onSwitchProject(item.projectId)}
                        className="px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 bg-slate-100 dark:bg-slate-700/80 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded border border-slate-200 dark:border-slate-600 transition-colors"
                        title={`Switch editor to ${item.projectName}`}
                      >
                        Edit
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {activeLeavesInMonth.map((leave) => (
                <div
                  key={leave.id}
                  className="flex items-center justify-between p-2 rounded-lg border border-purple-200 dark:border-purple-900/60 bg-purple-50/70 dark:bg-purple-950/30 text-xs text-purple-900 dark:text-purple-300"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Calendar className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
                    <div className="min-w-0 truncate">
                      <span className="font-semibold block truncate">
                        {leave.title} ({leave.type})
                      </span>
                      <span className="text-[10px] text-purple-700 dark:text-purple-400 block truncate">
                        Scheduled absence · Available capacity reduced by {leave.impactPercent}%
                      </span>
                    </div>
                  </div>
                  <span className="font-mono font-bold text-xs text-purple-700 dark:text-purple-300 shrink-0 px-2 py-0.5 bg-purple-100 dark:bg-purple-900/60 rounded">
                    -{leave.impactPercent}%
                  </span>
                </div>
              ))}

              {personAllocationsInMonth.length === 1 && personAllocationsInMonth[0].isCurrent && activeLeavesInMonth.length === 0 && (
                <p className="text-[11px] text-slate-400 dark:text-slate-500 italic py-1 pl-1">
                  No other active project allocations for {person.name.split(' ')[0]} in {MONTH_FULL_NAMES[monthIndex]}.
                </p>
              )}
            </div>
          </div>

          {isOverAllocated ? (
            <div className="p-2 bg-rose-100/70 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 rounded-lg text-[11px] text-rose-800 dark:text-rose-300 font-medium flex items-start gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <span>
                Over-capacity warning: Allocation exceeds available limit by +{excess}%. Other projects currently take {otherProjectsSum}%.
              </span>
            </div>
          ) : (
            <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between pt-0.5 px-0.5">
              <span>Other projects take {otherProjectsSum}%. Total workload remains within {effectiveCapacity}% capacity.</span>
              {unassignedCapacity > 0 && (
                <span className="font-medium text-sky-700 dark:text-sky-400">{unassignedCapacity}% bench available</span>
              )}
            </div>
          )}
        </div>

        {/* Batch Fill options */}
        <div className="space-y-1.5 pt-0.5">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Apply {percentage}% across timeline:
          </label>
          <div className="grid grid-cols-3 gap-1.5 text-xs">
            <button
              type="button"
              onClick={() => setFillMode('single')}
              className={`p-2 text-left rounded-lg border transition-all ${
                fillMode === 'single'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 font-semibold text-blue-900 dark:text-blue-200 shadow-2xs ring-1 ring-blue-500/20'
                  : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-400'
              }`}
            >
              Only {MONTH_FULL_NAMES[monthIndex].slice(0, 3)}
            </button>
            <button
              type="button"
              onClick={() => setFillMode('remaining')}
              className={`p-2 text-left rounded-lg border transition-all ${
                fillMode === 'remaining'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 font-semibold text-blue-900 dark:text-blue-200 shadow-2xs ring-1 ring-blue-500/20'
                  : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-400'
              }`}
            >
              {MONTH_FULL_NAMES[monthIndex].slice(0, 3)} → Dec
            </button>
            <button
              type="button"
              onClick={() => setFillMode('year')}
              className={`p-2 text-left rounded-lg border transition-all ${
                fillMode === 'year'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 font-semibold text-blue-900 dark:text-blue-200 shadow-2xs ring-1 ring-blue-500/20'
                  : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-400'
              }`}
            >
              All 12 Months
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
          {onDeleteAllocation ? (
            <button
              type="button"
              onClick={() => {
                if (confirm(`Remove ${project.name} assignment record for ${person.name}?`)) {
                  onDeleteAllocation();
                  onClose();
                }
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-rose-600 hover:text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Remove Project
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="inline-flex items-center gap-1 px-4 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors"
            >
              <Check className="w-3.5 h-3.5" />
              Apply {percentage}%
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
