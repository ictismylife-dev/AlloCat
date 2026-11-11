import React from 'react';
import { ChevronDown, ChevronRight, AlertTriangle, Plus, Trash2, Pencil, Building, MessageSquare, ArrowDownAZ, ArrowUpZA } from 'lucide-react';
import {
  MONTH_NAMES,
  Person,
  Project,
  Client,
  Allocation,
  LeaveEntry,
  EmploymentType,
  EMPLOYMENT_BADGE_CONFIG,
  ClientSortOrder
} from '../types';
import { getProjectStaffingSummary, getPersonCapacitySummary, formatPersonTableName } from '../utils/allocationMath';
import { CommentCell } from './CommentCell';

interface ClientProjectMatrixViewProps {
  clients: Client[];
  projects: Project[];
  people: Person[];
  allocations: Allocation[];
  leaves?: LeaveEntry[];
  selectedYear: number;
  expandedProjectIds: Set<string>;
  onToggleProjectExpand: (projectId: string) => void;
  onOpenCellEditor: (personId: string, projectId: string, monthIndex: number) => void;
  onOpenAssignModalForProject: (projectId: string) => void;
  onDeleteAllocation: (allocationId: string) => void;
  onEditClient?: (client: Client) => void;
  onEditProject?: (project: Project) => void;
  onEditPerson?: (person: Person) => void;
  onUpdateProjectNotes?: (projectId: string, notes: string) => void;
  onUpdateAllocationNotes?: (allocationId: string, notes: string) => void;
  clientSort?: ClientSortOrder;
  onToggleClientSort?: () => void;
}

export const ClientProjectMatrixView: React.FC<ClientProjectMatrixViewProps> = ({
  clients,
  projects,
  people,
  allocations,
  leaves = [],
  selectedYear,
  expandedProjectIds,
  onToggleProjectExpand,
  onOpenCellEditor,
  onOpenAssignModalForProject,
  onDeleteAllocation,
  onEditClient,
  onEditProject,
  onEditPerson,
  onUpdateProjectNotes,
  onUpdateAllocationNotes,
  clientSort = 'default',
  onToggleClientSort
}) => {
  const getPerson = (id: string) => people.find((p) => p.id === id);

  if (projects.length === 0) {
    return (
      <div className="p-12 text-center text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 m-6">
        <p className="font-medium text-sm">No clients or projects match the selected filters.</p>
        <p className="text-xs mt-1">Try clearing search terms or selecting another client filter.</p>
      </div>
    );
  }

  const clientGroups = clients
    .map((client) => {
      const clientProjects = projects.filter((p) => p.clientId === client.id);
      return {
        client,
        projects: clientProjects
      };
    })
    .filter((group) => group.projects.length > 0);

  return (
    <div className="w-full flex-1 min-h-0 overflow-auto bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-xs">
      <table className="w-full text-left border-collapse min-w-[1360px]">
        <thead>
          <tr className="bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-20">
            <th className="py-2.5 px-4 w-[320px] min-w-[320px] sticky left-0 z-30 bg-slate-50 dark:bg-slate-800 border-r border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <span>Client & Deliverable Projects</span>
                  {onToggleClientSort && (
                    <button
                      type="button"
                      onClick={onToggleClientSort}
                      className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-mono transition-colors cursor-pointer ${
                        clientSort !== 'default'
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 font-bold'
                          : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700/60'
                      }`}
                      title="Sort clients alphabetically (A–Z / Z–A)"
                    >
                      {clientSort.endsWith('-desc') ? (
                        <ArrowUpZA className="w-3 h-3" />
                      ) : (
                        <ArrowDownAZ className="w-3 h-3" />
                      )}
                      <span>{clientSort.endsWith('-desc') ? 'Z–A' : 'A–Z'}</span>
                    </button>
                  )}
                </div>
                <span className="text-[11px] font-mono font-normal text-slate-400">Team / FTE</span>
              </div>
            </th>

            <th className="py-2.5 px-3 w-[220px] min-w-[200px] max-w-[260px] bg-slate-50 dark:bg-slate-800 border-r border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                <span>Comments & Scope Notes</span>
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
          {clientGroups.map(({ client, projects: clientProjects }) => (
            <React.Fragment key={client.id}>
              <tr className="group/client bg-slate-100/70 dark:bg-slate-800/60 border-t-2 border-slate-200 dark:border-slate-700">
                <td
                  colSpan={14}
                  className="py-2 px-4 sticky left-0 z-10 bg-inherit"
                >
                  <div className="flex items-center gap-2">
                    <Building className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                    <span className="font-bold text-slate-900 dark:text-slate-100 text-xs uppercase tracking-wide">
                      {client.name}
                    </span>
                    <span className="text-slate-400 text-[11px]">· {client.industry}</span>
                    {onEditClient && (
                      <button
                        type="button"
                        onClick={() => onEditClient(client)}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-white dark:hover:bg-slate-700 border border-transparent hover:border-slate-200 dark:hover:border-slate-600 transition-all cursor-pointer"
                        title={`Edit company ${client.name}`}
                      >
                        <Pencil className="w-3 h-3" />
                        <span>Edit Company</span>
                      </button>
                    )}
                    <span className="text-[10px] text-slate-500 font-mono ml-auto">
                      {clientProjects.length} {clientProjects.length === 1 ? 'project' : 'projects'}
                    </span>
                  </div>
                </td>
              </tr>

              {clientProjects.map((project) => {
                const isExpanded = expandedProjectIds.has(project.id);
                const staffingSummary = getProjectStaffingSummary(
                  project.id,
                  selectedYear,
                  allocations
                );

                const projectAllocations = allocations.filter(
                  (a) => a.projectId === project.id && a.year === selectedYear
                );

                return (
                  <React.Fragment key={project.id}>
                    <tr className="group bg-white dark:bg-slate-900 hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-2.5 px-4 pl-6 sticky left-0 z-10 bg-inherit border-r border-slate-200 dark:border-slate-800">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <button
                              type="button"
                              onClick={() => onToggleProjectExpand(project.id)}
                              className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded transition-colors"
                              title={isExpanded ? 'Collapse staff' : 'Expand staff'}
                            >
                              {isExpanded ? (
                                <ChevronDown className="w-4 h-4" />
                              ) : (
                                <ChevronRight className="w-4 h-4" />
                              )}
                            </button>

                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: project.color }}
                            />

                            <div className="min-w-0 truncate">
                              <div className="font-semibold text-slate-900 dark:text-slate-100 truncate text-xs">
                                {project.name}
                              </div>
                              <div className="text-[10px] text-slate-400 font-mono">
                                {project.code} · {staffingSummary.assignedCount} staff
                              </div>
                            </div>
                          </div>

                          <div className="shrink-0 flex items-center gap-1 text-right">
                            <span className="font-mono text-[11px] font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded tabular-nums">
                              {staffingSummary.avgMonthlyFTE} FTE
                            </span>

                            {onEditProject && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onEditProject(project);
                                }}
                                className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded transition-all cursor-pointer"
                                title={`Edit project ${project.name}`}
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-2 px-2 bg-inherit border-r border-slate-200 dark:border-slate-800 align-middle">
                        <CommentCell
                          value={project.notes}
                          onSave={(newNotes) => onUpdateProjectNotes?.(project.id, newNotes)}
                          placeholder="Add project scope note..."
                        />
                      </td>

                      {staffingSummary.totals.map((totalPct, monthIdx) => {
                        const fteValue = +(totalPct / 100).toFixed(1);
                        return (
                          <td
                            key={monthIdx}
                            className="p-1.5 text-center font-mono tabular-nums border-r border-slate-200/60 dark:border-slate-800/60 last:border-r-0"
                          >
                            <div className="py-1 flex flex-col items-center justify-center">
                              <span
                                className={`text-xs font-semibold ${
                                  totalPct > 0
                                    ? 'text-slate-900 dark:text-slate-100'
                                    : 'text-slate-300 dark:text-slate-600'
                                }`}
                              >
                                {totalPct > 0 ? `${totalPct}%` : '—'}
                              </span>
                              {totalPct > 0 && (
                                <span className="text-[9px] text-slate-400 dark:text-slate-500">
                                  {fteValue} FTE
                                </span>
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>

                    {isExpanded && (
                      <>
                        {projectAllocations.map((alloc) => {
                          const person = getPerson(alloc.personId);
                          if (!person) return null;

                          const personCapacity = getPersonCapacitySummary(
                            person.id,
                            selectedYear,
                            allocations,
                            person.maxCapacityPercent,
                            leaves
                          );

                          return (
                            <tr
                              key={alloc.id}
                              className="bg-slate-50/50 dark:bg-slate-800/30 hover:bg-slate-100/60 dark:hover:bg-slate-800/60 transition-colors group/sub"
                            >
                              <td className="py-2 px-4 pl-14 sticky left-0 z-10 bg-inherit border-r border-slate-200 dark:border-slate-800">
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <div
                                      className="w-5 h-5 rounded-full text-white font-semibold text-[9px] flex items-center justify-center shrink-0 shadow-xs"
                                      style={{ backgroundColor: person.avatarColor }}
                                    >
                                      {person.initials}
                                    </div>
                                    <div className="min-w-0 truncate">
                                      <div className="font-medium text-slate-800 dark:text-slate-200 truncate text-[11px] flex items-center gap-1.5">
                                        <span>{formatPersonTableName(person)}</span>
                                        <span
                                          className={`px-1 py-0.1 text-[8px] font-mono font-semibold rounded border ${
                                            EMPLOYMENT_BADGE_CONFIG[
                                              (person.employmentType || 'Internal') as EmploymentType
                                            ].badgeClass
                                          }`}
                                        >
                                          {person.employmentType || 'Internal'}
                                        </span>
                                        {personCapacity.hasOvertime && (
                                          <span title="This team member is overbooked or on leave in one or more months">
                                            <AlertTriangle className="w-3 h-3 text-rose-500 shrink-0" />
                                          </span>
                                        )}
                                      </div>
                                      <div className="text-[10px] text-slate-400 truncate">
                                        {person.role} · {person.department}
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-1 shrink-0">
                                    {onEditPerson && (
                                      <button
                                        type="button"
                                        onClick={() => onEditPerson(person)}
                                        className="opacity-0 group-hover/sub:opacity-100 p-1 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded transition-all cursor-pointer"
                                        title={`Edit ${person.name}`}
                                      >
                                        <Pencil className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => onDeleteAllocation(alloc.id)}
                                      className="opacity-0 group-hover/sub:opacity-100 p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded transition-all cursor-pointer"
                                      title="Unassign person from project"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              </td>

                              <td className="py-1.5 px-2 bg-inherit border-r border-slate-200 dark:border-slate-800 align-middle">
                                <CommentCell
                                  value={alloc.notes || person.notes || ''}
                                  onSave={(newNotes) => onUpdateAllocationNotes?.(alloc.id, newNotes)}
                                  placeholder="Add role note..."
                                />
                              </td>

                              {alloc.monthlyPercentage.map((pct, monthIdx) => {
                                const personMonthTotal = personCapacity.totals[monthIdx];
                                const effCap = personCapacity.effectiveCapacities[monthIdx];
                                const isGlobalOverbooked = personMonthTotal > effCap;
                                const monthLeaves = personCapacity.monthLeaves[monthIdx];

                                return (
                                  <td
                                    key={monthIdx}
                                    onClick={() =>
                                      onOpenCellEditor(person.id, project.id, monthIdx)
                                    }
                                    className={`p-1 text-center font-mono tabular-nums border-r border-slate-200/50 dark:border-slate-800/50 last:border-r-0 cursor-pointer transition-all hover:ring-2 hover:ring-blue-500/50 hover:bg-blue-50/40 dark:hover:bg-blue-950/40 ${
                                      isGlobalOverbooked && pct > 0
                                        ? 'bg-rose-50/70 dark:bg-rose-950/30'
                                        : monthLeaves.length > 0 && pct > 0
                                        ? 'bg-purple-50/60 dark:bg-purple-950/30'
                                        : ''
                                    }`}
                                    title={`Click to edit ${person.name}'s allocation (${pct}%). Available capacity: ${effCap}%, Total workload: ${personMonthTotal}%.`}
                                  >
                                    <div className="py-1 flex flex-col items-center justify-center">
                                      <span
                                        className={`text-[11px] font-medium ${
                                          pct > 0
                                            ? 'text-slate-800 dark:text-slate-200'
                                            : 'text-slate-300 dark:text-slate-600'
                                        }`}
                                      >
                                        {pct > 0 ? `${pct}%` : '—'}
                                      </span>
                                      {isGlobalOverbooked && pct > 0 && (
                                        <span className="text-[8px] font-bold text-rose-600 dark:text-rose-400">
                                          {personMonthTotal}% ttl
                                        </span>
                                      )}
                                      {monthLeaves.length > 0 && pct > 0 && (
                                        <span className="text-[8px] font-semibold text-purple-600 dark:text-purple-400">
                                          on leave
                                        </span>
                                      )}
                                    </div>
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })}

                        <tr className="bg-slate-50/30 dark:bg-slate-800/20 border-b border-slate-200/60 dark:border-slate-800/60">
                          <td
                            colSpan={14}
                            className="py-1.5 px-4 pl-14 text-xs sticky left-0 z-10"
                          >
                            <button
                              type="button"
                              onClick={() => onOpenAssignModalForProject(project.id)}
                              className="inline-flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 font-medium py-1 px-2 rounded-md hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Assign team member to {project.name}</span>
                            </button>
                          </td>
                        </tr>
                      </>
                    )}
                  </React.Fragment>
                );
              })}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
};
