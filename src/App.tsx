import React, { useState, useMemo, useEffect } from 'react';
import {
  ViewMode,
  FilterState,
  Person,
  Client,
  Project,
  LeaveEntry,
  Department,
  EmploymentType
} from './types';
import {
  AppState,
  loadAppState,
  saveAppState,
  resetAppState
} from './data/seedData';
import {
  calculateExecutiveKPIs,
  getPersonCapacitySummary
} from './utils/allocationMath';
import { Header } from './components/Header';
import { Toolbar } from './components/Toolbar';
import { PeopleMatrixView } from './components/PeopleMatrixView';
import { ClientProjectMatrixView } from './components/ClientProjectMatrixView';
import { AvailabilityMatrixView } from './components/AvailabilityMatrixView';
import { BenchMatrixView } from './components/BenchMatrixView';
import { CellAllocationPopover } from './components/CellAllocationPopover';
import { BatchAssignModal } from './components/BatchAssignModal';
import { AddPersonModal } from './components/AddPersonModal';
import { AddClientProjectModal } from './components/AddClientProjectModal';
import { AddLeaveModal } from './components/AddLeaveModal';
import { OvertimeAlertsDrawer } from './components/OvertimeAlertsDrawer';
import { ManageYearsModal } from './components/ManageYearsModal';
import { ManageDepartmentsModal } from './components/ManageDepartmentsModal';
import { ConfirmDeletePersonModal } from './components/ConfirmDeletePersonModal';
import { ExportImportModal } from './components/ExportImportModal';
import {
  ExportScope,
  generatePeopleViewCSV,
  generateClientsViewCSV,
  generateAvailabilityViewCSV,
  generateBenchViewCSV,
  triggerFileDownload
} from './utils/importExportUtils';

export function App() {
  const [appState, setAppState] = useState<AppState>(() => loadAppState());
  const [viewMode, setViewMode] = useState<ViewMode>('people');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);

  const [filters, setFilters] = useState<FilterState>({
    search: '',
    department: 'all',
    employmentFilter: 'all',
    utilization: 'all',
    clientFilter: 'all'
  });

  const [expandedPersonIds, setExpandedPersonIds] = useState<Set<string>>(
    () => new Set(appState.people.map((p) => p.id))
  );
  const [expandedProjectIds, setExpandedProjectIds] = useState<Set<string>>(
    () => new Set(appState.projects.map((p) => p.id))
  );

  // Active cell editor popover state
  const [activeCellEditor, setActiveCellEditor] = useState<{
    personId: string;
    projectId: string;
    monthIndex: number;
  } | null>(null);

  // Modal states
  const [assignModalState, setAssignModalState] = useState<{
    isOpen: boolean;
    personId?: string;
    projectId?: string;
    monthIndex?: number;
  }>({ isOpen: false });
  const [isAddPersonOpen, setIsAddPersonOpen] = useState(false);
  const [isAddProjectOpen, setIsAddProjectOpen] = useState(false);
  const [leaveModalState, setLeaveModalState] = useState<{
    isOpen: boolean;
    personId?: string;
    monthIndex?: number;
  }>({ isOpen: false });
  const [isOvertimeDrawerOpen, setIsOvertimeDrawerOpen] = useState(false);
  const [isManageYearsOpen, setIsManageYearsOpen] = useState(false);
  const [isManageDepartmentsOpen, setIsManageDepartmentsOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportModalScope, setExportModalScope] = useState<ExportScope>('all');
  const [personToDelete, setPersonToDelete] = useState<Person | null>(null);

  // Save state changes to localStorage
  useEffect(() => {
    saveAppState(appState);
  }, [appState]);

  // Toggle dark mode class on root html element
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const {
    people,
    clients,
    projects,
    allocations,
    leaves,
    availableYears,
    selectedYear,
    departments
  } = appState;

  const kpis = useMemo(
    () => calculateExecutiveKPIs(people, projects, allocations, leaves, selectedYear),
    [people, projects, allocations, leaves, selectedYear]
  );

  // Filtered people
  const filteredPeople = useMemo(() => {
    return people.filter((person) => {
      if (filters.department !== 'all' && person.department !== filters.department) {
        return false;
      }

      if (
        filters.employmentFilter &&
        filters.employmentFilter !== 'all' &&
        (person.employmentType || 'Internal') !== filters.employmentFilter
      ) {
        return false;
      }

      if (filters.search.trim() !== '') {
        const q = filters.search.toLowerCase();
        const personAllocs = allocations.filter(
          (a) => a.personId === person.id && a.year === selectedYear
        );
        const matchesProject = personAllocs.some((a) => {
          const proj = projects.find((p) => p.id === a.projectId);
          const client = proj ? clients.find((c) => c.id === proj.clientId) : undefined;
          return (
            proj?.name.toLowerCase().includes(q) ||
            proj?.code.toLowerCase().includes(q) ||
            client?.name.toLowerCase().includes(q)
          );
        });

        const matchesPerson =
          person.name.toLowerCase().includes(q) ||
          person.role.toLowerCase().includes(q) ||
          person.department.toLowerCase().includes(q) ||
          (person.employmentType || 'Internal').toLowerCase().includes(q) ||
          (person.notes && person.notes.toLowerCase().includes(q));

        if (!matchesPerson && !matchesProject) return false;
      }

      if (filters.utilization !== 'all') {
        const summary = getPersonCapacitySummary(
          person.id,
          selectedYear,
          allocations,
          person.maxCapacityPercent,
          leaves
        );
        if (filters.utilization === 'overbooked' && !summary.hasOvertime) return false;
        if (
          filters.utilization === 'balanced' &&
          (summary.hasOvertime || summary.annualAverage < 75)
        ) {
          return false;
        }
        if (filters.utilization === 'underbooked' && summary.annualAverage >= 75) {
          return false;
        }
      }

      return true;
    });
  }, [people, allocations, projects, clients, leaves, selectedYear, filters]);

  // Filtered projects
  const filteredProjects = useMemo(() => {
    return projects.filter((proj) => {
      if (filters.clientFilter !== 'all' && proj.clientId !== filters.clientFilter) {
        return false;
      }
      if (filters.search.trim() !== '') {
        const q = filters.search.toLowerCase();
        const client = clients.find((c) => c.id === proj.clientId);
        return (
          proj.name.toLowerCase().includes(q) ||
          proj.code.toLowerCase().includes(q) ||
          (proj.notes && proj.notes.toLowerCase().includes(q)) ||
          (client && client.name.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [projects, clients, filters]);

  const handleTogglePersonExpand = (personId: string) => {
    setExpandedPersonIds((prev) => {
      const next = new Set(prev);
      if (next.has(personId)) next.delete(personId);
      else next.add(personId);
      return next;
    });
  };

  const handleToggleProjectExpand = (projectId: string) => {
    setExpandedProjectIds((prev) => {
      const next = new Set(prev);
      if (next.has(projectId)) next.delete(projectId);
      else next.add(projectId);
      return next;
    });
  };

  const isAllExpanded =
    viewMode === 'clients'
      ? expandedProjectIds.size >= projects.length
      : expandedPersonIds.size >= people.length;

  const handleToggleExpandAll = () => {
    if (viewMode === 'clients') {
      if (expandedProjectIds.size >= projects.length) {
        setExpandedProjectIds(new Set());
      } else {
        setExpandedProjectIds(new Set(projects.map((p) => p.id)));
      }
    } else {
      if (expandedPersonIds.size >= people.length) {
        setExpandedPersonIds(new Set());
      } else {
        setExpandedPersonIds(new Set(people.map((p) => p.id)));
      }
    }
  };

  // Open cell editor when clicking a person's summary month cell
  const handleOpenPersonMonth = (personId: string, monthIndex: number) => {
    const personAllocs = allocations.filter(
      (a) => a.personId === personId && a.year === selectedYear
    );
    const activeInMonth = personAllocs.find((a) => (a.monthlyPercentage[monthIndex] || 0) > 0);
    const fallbackProjectId =
      activeInMonth?.projectId || personAllocs[0]?.projectId || projects[0]?.id;
    if (!fallbackProjectId) return;
    setActiveCellEditor({
      personId,
      projectId: fallbackProjectId,
      monthIndex
    });
  };

  const handleSaveCellAllocation = (
    newPercentage: number,
    fillOptions?: { applyToAllRemaining?: boolean; applyToAllYear?: boolean }
  ) => {
    if (!activeCellEditor) return;
    const { personId, projectId, monthIndex } = activeCellEditor;

    setAppState((prev) => {
      const existingIdx = prev.allocations.findIndex(
        (a) =>
          a.personId === personId &&
          a.projectId === projectId &&
          a.year === prev.selectedYear
      );

      const nextAllocations = [...prev.allocations];

      if (existingIdx >= 0) {
        const updatedMonths = [...nextAllocations[existingIdx].monthlyPercentage];
        if (fillOptions?.applyToAllYear) {
          for (let m = 0; m < 12; m++) updatedMonths[m] = newPercentage;
        } else if (fillOptions?.applyToAllRemaining) {
          for (let m = monthIndex; m < 12; m++) updatedMonths[m] = newPercentage;
        } else {
          updatedMonths[monthIndex] = newPercentage;
        }
        nextAllocations[existingIdx] = {
          ...nextAllocations[existingIdx],
          monthlyPercentage: updatedMonths
        };
      } else {
        const freshMonths = Array(12).fill(0);
        if (fillOptions?.applyToAllYear) {
          for (let m = 0; m < 12; m++) freshMonths[m] = newPercentage;
        } else if (fillOptions?.applyToAllRemaining) {
          for (let m = monthIndex; m < 12; m++) freshMonths[m] = newPercentage;
        } else {
          freshMonths[monthIndex] = newPercentage;
        }
        nextAllocations.push({
          id: `a-${Date.now()}`,
          personId,
          projectId,
          year: prev.selectedYear,
          monthlyPercentage: freshMonths
        });
      }

      return {
        ...prev,
        allocations: nextAllocations
      };
    });
  };

  const handleUpdateAllocationMonth = (
    personId: string,
    projectId: string,
    monthIndex: number,
    newPercentage: number
  ) => {
    setAppState((prev) => ({
      ...prev,
      allocations: prev.allocations.map((a) => {
        if (
          a.personId === personId &&
          a.projectId === projectId &&
          a.year === prev.selectedYear
        ) {
          const nextMonths = [...a.monthlyPercentage];
          nextMonths[monthIndex] = newPercentage;
          return { ...a, monthlyPercentage: nextMonths };
        }
        return a;
      })
    }));
  };

  const handleBatchAssign = (
    personId: string,
    projectId: string,
    startMonth: number,
    endMonth: number,
    percentage: number,
    notes?: string
  ) => {
    setAppState((prev) => {
      const existingIdx = prev.allocations.findIndex(
        (a) =>
          a.personId === personId &&
          a.projectId === projectId &&
          a.year === prev.selectedYear
      );
      const nextAllocations = [...prev.allocations];

      if (existingIdx >= 0) {
        const updatedMonths = [...nextAllocations[existingIdx].monthlyPercentage];
        for (let m = startMonth; m <= endMonth; m++) {
          updatedMonths[m] = percentage;
        }
        nextAllocations[existingIdx] = {
          ...nextAllocations[existingIdx],
          monthlyPercentage: updatedMonths,
          notes: notes !== undefined ? notes : nextAllocations[existingIdx].notes
        };
      } else {
        const freshMonths = Array(12).fill(0);
        for (let m = startMonth; m <= endMonth; m++) {
          freshMonths[m] = percentage;
        }
        nextAllocations.push({
          id: `a-${Date.now()}`,
          personId,
          projectId,
          year: prev.selectedYear,
          monthlyPercentage: freshMonths,
          notes
        });
      }

      return {
        ...prev,
        allocations: nextAllocations
      };
    });
    setExpandedPersonIds((prev) => new Set(prev).add(personId));
    setExpandedProjectIds((prev) => new Set(prev).add(projectId));
  };

  const handleDeleteAllocation = (allocationId: string) => {
    setAppState((prev) => ({
      ...prev,
      allocations: prev.allocations.filter((a) => a.id !== allocationId)
    }));
  };

  const handleAddPerson = (personData: Omit<Person, 'id'>) => {
    const newPerson: Person = {
      ...personData,
      id: `p-${Date.now()}`
    };
    setAppState((prev) => ({
      ...prev,
      people: [...prev.people, newPerson]
    }));
    setExpandedPersonIds((prev) => new Set(prev).add(newPerson.id));
  };

  const handleDeletePerson = (personId: string) => {
    setAppState((prev) => ({
      ...prev,
      people: prev.people.filter((p) => p.id !== personId),
      allocations: prev.allocations.filter((a) => a.personId !== personId),
      leaves: prev.leaves.filter((l) => l.personId !== personId)
    }));
  };

  const handleAddProject = (
    projectData: Omit<Project, 'id'>,
    newClientData?: Omit<Client, 'id'>
  ) => {
    setAppState((prev) => {
      let targetClientId = projectData.clientId;
      const nextClients = [...prev.clients];

      if (newClientData) {
        const createdClient: Client = {
          ...newClientData,
          id: `c-${Date.now()}`
        };
        nextClients.push(createdClient);
        targetClientId = createdClient.id;
      }

      const createdProject: Project = {
        ...projectData,
        clientId: targetClientId,
        id: `proj-${Date.now()}`
      };

      return {
        ...prev,
        clients: nextClients,
        projects: [...prev.projects, createdProject]
      };
    });
  };

  const handleSaveLeave = (leaveData: Omit<LeaveEntry, 'id'>) => {
    const newLeave: LeaveEntry = {
      ...leaveData,
      id: `leave-${Date.now()}`
    };
    setAppState((prev) => ({
      ...prev,
      leaves: [...prev.leaves, newLeave]
    }));
    setExpandedPersonIds((prev) => new Set(prev).add(leaveData.personId));
  };

  const handleDeleteLeave = (leaveId: string) => {
    setAppState((prev) => ({
      ...prev,
      leaves: prev.leaves.filter((l) => l.id !== leaveId)
    }));
  };

  // Notes & Employment updaters
  const handleUpdatePersonNotes = (personId: string, notes: string) => {
    setAppState((prev) => ({
      ...prev,
      people: prev.people.map((p) => (p.id === personId ? { ...p, notes } : p))
    }));
  };

  const handleUpdatePersonEmployment = (
    personId: string,
    employmentType: EmploymentType
  ) => {
    setAppState((prev) => ({
      ...prev,
      people: prev.people.map((p) =>
        p.id === personId ? { ...p, employmentType } : p
      )
    }));
  };

  const handleUpdateProjectNotes = (projectId: string, notes: string) => {
    setAppState((prev) => ({
      ...prev,
      projects: prev.projects.map((p) => (p.id === projectId ? { ...p, notes } : p))
    }));
  };

  const handleUpdateAllocationNotes = (allocationId: string, notes: string) => {
    setAppState((prev) => ({
      ...prev,
      allocations: prev.allocations.map((a) =>
        a.id === allocationId ? { ...a, notes } : a
      )
    }));
  };

  const handleUpdateLeaveNotes = (leaveId: string, notes: string) => {
    setAppState((prev) => ({
      ...prev,
      leaves: prev.leaves.map((l) => (l.id === leaveId ? { ...l, notes } : l))
    }));
  };

  // Years management
  const handleAddYear = (year: number) => {
    setAppState((prev) => {
      const nextYears = Array.from(new Set([...prev.availableYears, year])).sort(
        (a, b) => a - b
      );
      return {
        ...prev,
        availableYears: nextYears,
        selectedYear: year
      };
    });
  };

  const handleRemoveYear = (yearToRemove: number) => {
    setAppState((prev) => {
      if (prev.availableYears.length <= 1) return prev;
      const nextYears = prev.availableYears.filter((y) => y !== yearToRemove);
      return {
        ...prev,
        availableYears: nextYears,
        selectedYear:
          prev.selectedYear === yearToRemove ? nextYears[0] : prev.selectedYear,
        allocations: prev.allocations.filter((a) => a.year !== yearToRemove),
        leaves: prev.leaves.filter((l) => l.year !== yearToRemove)
      };
    });
  };

  // Department management
  const handleRenameDepartment = (oldName: Department, newName: Department) => {
    setAppState((prev) => ({
      ...prev,
      departments: prev.departments.map((d) => (d === oldName ? newName : d)),
      people: prev.people.map((p) =>
        p.department === oldName ? { ...p, department: newName } : p
      )
    }));
    if (filters.department === oldName) {
      setFilters((prev) => ({ ...prev, department: newName }));
    }
  };

  const handleAddDepartment = (newName: Department) => {
    setAppState((prev) => ({
      ...prev,
      departments: prev.departments.includes(newName)
        ? prev.departments
        : [...prev.departments, newName]
    }));
  };

  const handleDeleteDepartment = (deptName: Department) => {
    setAppState((prev) => ({
      ...prev,
      departments: prev.departments.filter((d) => d !== deptName)
    }));
    if (filters.department === deptName) {
      setFilters((prev) => ({ ...prev, department: 'all' }));
    }
  };

  // Active cell editor details
  const activeEditorData = useMemo(() => {
    if (!activeCellEditor) return null;
    const person = people.find((p) => p.id === activeCellEditor.personId);
    const project = projects.find((p) => p.id === activeCellEditor.projectId);
    if (!person || !project) return null;

    const existingAlloc = allocations.find(
      (a) =>
        a.personId === person.id &&
        a.projectId === project.id &&
        a.year === selectedYear
    );
    const currentPercentage =
      existingAlloc?.monthlyPercentage[activeCellEditor.monthIndex] || 0;

    const otherAllocsSum = allocations
      .filter(
        (a) =>
          a.personId === person.id &&
          a.projectId !== project.id &&
          a.year === selectedYear
      )
      .reduce(
        (sum, a) => sum + (a.monthlyPercentage[activeCellEditor.monthIndex] || 0),
        0
      );

    return {
      person,
      project,
      monthIndex: activeCellEditor.monthIndex,
      currentPercentage,
      otherAllocsSum,
      existingAllocId: existingAlloc?.id
    };
  }, [activeCellEditor, people, projects, allocations, selectedYear]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <Header
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        availableYears={availableYears}
        selectedYear={selectedYear}
        onYearChange={(year) => setAppState((prev) => ({ ...prev, selectedYear: year }))}
        onOpenManageYearsModal={() => setIsManageYearsOpen(true)}
        overtimeCount={kpis.totalPersonMonthsOverbooked}
        onOpenOvertimeDrawer={() => setIsOvertimeDrawerOpen(true)}
        onOpenAssignModal={() => setAssignModalState({ isOpen: true })}
        onOpenAddPersonModal={() => setIsAddPersonOpen(true)}
        onOpenAddProjectModal={() => setIsAddProjectOpen(true)}
        onOpenAddLeaveModal={() => setLeaveModalState({ isOpen: true })}
        onOpenExportModal={() => {
          setExportModalScope('all');
          setIsExportModalOpen(true);
        }}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode((d) => !d)}
      />

      <Toolbar
        viewMode={viewMode}
        filters={filters}
        onFilterChange={(partial) => setFilters((prev) => ({ ...prev, ...partial }))}
        departments={departments}
        clients={clients}
        onOpenManageDepartmentsModal={() => setIsManageDepartmentsOpen(true)}
        kpis={kpis}
        isAllExpanded={isAllExpanded}
        onToggleExpandAll={handleToggleExpandAll}
        selectedYear={selectedYear}
        onQuickExportCurrentViewCSV={() => {
          const dateStr = new Date().toISOString().slice(0, 10);
          if (viewMode === 'people') {
            const csv = generatePeopleViewCSV(appState, filteredPeople);
            triggerFileDownload(
              csv,
              `allocat-by-people-${selectedYear}-${dateStr}.csv`,
              'text/csv;charset=utf-8;'
            );
          } else if (viewMode === 'clients') {
            const csv = generateClientsViewCSV(appState, filteredProjects);
            triggerFileDownload(
              csv,
              `allocat-by-clients-projects-${selectedYear}-${dateStr}.csv`,
              'text/csv;charset=utf-8;'
            );
          } else if (viewMode === 'availability') {
            const csv = generateAvailabilityViewCSV(appState, filteredPeople);
            triggerFileDownload(
              csv,
              `allocat-availability-leaves-${selectedYear}-${dateStr}.csv`,
              'text/csv;charset=utf-8;'
            );
          } else if (viewMode === 'bench') {
            const csv = generateBenchViewCSV(appState, filteredPeople);
            triggerFileDownload(
              csv,
              `allocat-bench-${selectedYear}-${dateStr}.csv`,
              'text/csv;charset=utf-8;'
            );
          }
        }}
        onOpenImportExportForCurrentView={() => {
          setExportModalScope(viewMode);
          setIsExportModalOpen(true);
        }}
      />

      <main className="flex-1 max-w-[1720px] w-full mx-auto">
        {viewMode === 'people' && (
          <PeopleMatrixView
            people={filteredPeople}
            clients={clients}
            projects={projects}
            allocations={allocations}
            leaves={leaves}
            selectedYear={selectedYear}
            expandedPersonIds={expandedPersonIds}
            onTogglePersonExpand={handleTogglePersonExpand}
            onOpenCellEditor={(personId, projectId, monthIndex) =>
              setActiveCellEditor({ personId, projectId, monthIndex })
            }
            onOpenPersonMonth={handleOpenPersonMonth}
            onOpenAssignModalForPerson={(personId) =>
              setAssignModalState({ isOpen: true, personId })
            }
            onDeleteAllocation={handleDeleteAllocation}
            onDeletePerson={(personId) => {
              const found = people.find((p) => p.id === personId);
              if (found) setPersonToDelete(found);
            }}
            onUpdatePersonNotes={handleUpdatePersonNotes}
            onUpdatePersonEmployment={handleUpdatePersonEmployment}
            onUpdateAllocationNotes={handleUpdateAllocationNotes}
          />
        )}

        {viewMode === 'clients' && (
          <ClientProjectMatrixView
            clients={clients}
            projects={filteredProjects}
            people={people}
            allocations={allocations}
            leaves={leaves}
            selectedYear={selectedYear}
            expandedProjectIds={expandedProjectIds}
            onToggleProjectExpand={handleToggleProjectExpand}
            onOpenCellEditor={(personId, projectId, monthIndex) =>
              setActiveCellEditor({ personId, projectId, monthIndex })
            }
            onOpenAssignModalForProject={(projectId) =>
              setAssignModalState({ isOpen: true, projectId })
            }
            onDeleteAllocation={handleDeleteAllocation}
            onUpdateProjectNotes={handleUpdateProjectNotes}
            onUpdateAllocationNotes={handleUpdateAllocationNotes}
          />
        )}

        {viewMode === 'availability' && (
          <AvailabilityMatrixView
            people={filteredPeople}
            allocations={allocations}
            leaves={leaves}
            selectedYear={selectedYear}
            expandedPersonIds={expandedPersonIds}
            onTogglePersonExpand={handleTogglePersonExpand}
            onOpenAddLeaveForPerson={(personId, monthIndex) =>
              setLeaveModalState({ isOpen: true, personId, monthIndex })
            }
            onDeleteLeave={handleDeleteLeave}
            onDeletePerson={(personId) => {
              const found = people.find((p) => p.id === personId);
              if (found) setPersonToDelete(found);
            }}
            onUpdatePersonNotes={handleUpdatePersonNotes}
            onUpdatePersonEmployment={handleUpdatePersonEmployment}
            onUpdateLeaveNotes={handleUpdateLeaveNotes}
          />
        )}

        {viewMode === 'bench' && (
          <BenchMatrixView
            people={filteredPeople}
            projects={projects}
            clients={clients}
            allocations={allocations}
            leaves={leaves}
            selectedYear={selectedYear}
            onOpenAssignModalForPerson={(personId, monthIndex) =>
              setAssignModalState({ isOpen: true, personId, monthIndex })
            }
            onDeletePerson={(personId) => {
              const found = people.find((p) => p.id === personId);
              if (found) setPersonToDelete(found);
            }}
            onUpdatePersonNotes={handleUpdatePersonNotes}
            onUpdatePersonEmployment={handleUpdatePersonEmployment}
          />
        )}
      </main>

      {/* Cell Allocation & Total Workload Breakdown Popover */}
      {activeEditorData && (
        <CellAllocationPopover
          isOpen={true}
          onClose={() => setActiveCellEditor(null)}
          person={activeEditorData.person}
          project={activeEditorData.project}
          monthIndex={activeEditorData.monthIndex}
          currentPercentage={activeEditorData.currentPercentage}
          personMonthlyTotalOtherProjects={activeEditorData.otherAllocsSum}
          projects={projects}
          clients={clients}
          allocations={allocations}
          leaves={leaves}
          selectedYear={selectedYear}
          onSave={handleSaveCellAllocation}
          onDeleteAllocation={
            activeEditorData.existingAllocId
              ? () => handleDeleteAllocation(activeEditorData.existingAllocId!)
              : undefined
          }
          onSwitchProject={(newProjectId) =>
            setActiveCellEditor((prev) =>
              prev ? { ...prev, projectId: newProjectId } : null
            )
          }
        />
      )}

      <BatchAssignModal
        isOpen={assignModalState.isOpen}
        onClose={() => setAssignModalState({ isOpen: false })}
        people={people}
        projects={projects}
        clients={clients}
        selectedYear={selectedYear}
        defaultPersonId={assignModalState.personId}
        defaultProjectId={assignModalState.projectId}
        defaultMonthIndex={assignModalState.monthIndex}
        onAssign={handleBatchAssign}
      />

      <AddPersonModal
        isOpen={isAddPersonOpen}
        onClose={() => setIsAddPersonOpen(false)}
        departments={departments}
        onSavePerson={handleAddPerson}
      />

      <AddClientProjectModal
        isOpen={isAddProjectOpen}
        onClose={() => setIsAddProjectOpen(false)}
        clients={clients}
        onSaveProject={handleAddProject}
      />

      <AddLeaveModal
        isOpen={leaveModalState.isOpen}
        onClose={() => setLeaveModalState({ isOpen: false })}
        people={people}
        selectedYear={selectedYear}
        defaultPersonId={leaveModalState.personId}
        defaultMonthIndex={leaveModalState.monthIndex}
        onSaveLeave={handleSaveLeave}
      />

      <OvertimeAlertsDrawer
        isOpen={isOvertimeDrawerOpen}
        onClose={() => setIsOvertimeDrawerOpen(false)}
        people={people}
        projects={projects}
        clients={clients}
        allocations={allocations}
        leaves={leaves}
        selectedYear={selectedYear}
        onUpdateAllocationMonth={handleUpdateAllocationMonth}
      />

      <ManageYearsModal
        isOpen={isManageYearsOpen}
        onClose={() => setIsManageYearsOpen(false)}
        years={availableYears}
        selectedYear={selectedYear}
        onAddYear={handleAddYear}
        onRemoveYear={handleRemoveYear}
        onSelectYear={(yr) => setAppState((prev) => ({ ...prev, selectedYear: yr }))}
      />

      <ManageDepartmentsModal
        isOpen={isManageDepartmentsOpen}
        onClose={() => setIsManageDepartmentsOpen(false)}
        departments={departments}
        people={people}
        onRenameDepartment={handleRenameDepartment}
        onAddDepartment={handleAddDepartment}
        onDeleteDepartment={handleDeleteDepartment}
      />

      <ConfirmDeletePersonModal
        person={personToDelete}
        onClose={() => setPersonToDelete(null)}
        onConfirmDelete={handleDeletePerson}
      />

      <ExportImportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        appState={appState}
        activeViewMode={viewMode}
        initialScope={exportModalScope}
        onImportState={(newState) => setAppState(newState)}
        onResetToDefault={() => setAppState(resetAppState())}
      />
    </div>
  );
}

export default App;
