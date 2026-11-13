import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  Users,
  Building2,
  Briefcase,
  FolderKanban,
  Calendar,
  CalendarOff,
  ShieldCheck,
  Search,
  Plus,
  Pencil,
  Trash2,
  Check,
  KeyRound,
  Download,
  RotateCcw,
  AlertTriangle
} from 'lucide-react';
import {
  Client,
  ClientStatus,
  Department,
  EmploymentType,
  EMPLOYMENT_BADGE_CONFIG,
  LeaveEntry,
  LEAVE_TYPE_CONFIG,
  MONTH_NAMES,
  Person,
  Project,
  Allocation
} from '../types';
import { formatPersonTableName } from '../utils/allocationMath';

export type AdminTab =
  | 'people'
  | 'departments'
  | 'clients'
  | 'projects'
  | 'leaves'
  | 'workspace';

interface AdminPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: AdminTab;
  people: Person[];
  departments: Department[];
  clients: Client[];
  projects: Project[];
  allocations: Allocation[];
  leaves: LeaveEntry[];
  availableYears: number[];
  selectedYear: number;
  currentUser?: string | null;
  // Person handlers
  onOpenAddPerson: () => void;
  onEditPerson: (person: Person) => void;
  onDeletePerson: (personId: string) => void;
  // Department handlers
  onAddDepartment: (name: Department) => void;
  onRenameDepartment: (oldName: Department, newName: Department) => void;
  onDeleteDepartment: (name: Department) => void;
  // Client handlers
  onAddClient: (client: Omit<Client, 'id'>) => void;
  onEditClient: (client: Client) => void;
  onDeleteClient: (clientId: string) => void;
  // Project handlers
  onOpenAddProject: () => void;
  onEditProject: (project: Project) => void;
  onDeleteProject: (projectId: string) => void;
  // Leave handlers
  onOpenAddLeave: () => void;
  onDeleteLeave: (leaveId: string) => void;
  // Years & Workspace handlers
  onAddYear: (year: number) => void;
  onRemoveYear: (year: number) => void;
  onSelectYear: (year: number) => void;
  onOpenChangeCredentials: () => void;
  onOpenExportImport: () => void;
  onResetWorkspace: () => void;
}

const CLIENT_COLORS = [
  '#2563EB',
  '#059669',
  '#D97706',
  '#7C3AED',
  '#DB2777',
  '#0284C7',
  '#4F46E5',
  '#10B981',
  '#EA580C'
];

export const AdminPanelModal: React.FC<AdminPanelModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'people',
  people,
  departments,
  clients,
  projects,
  allocations,
  leaves,
  availableYears,
  selectedYear,
  currentUser,
  onOpenAddPerson,
  onEditPerson,
  onDeletePerson,
  onAddDepartment,
  onRenameDepartment,
  onDeleteDepartment,
  onAddClient,
  onEditClient,
  onDeleteClient,
  onOpenAddProject,
  onEditProject,
  onDeleteProject,
  onOpenAddLeave,
  onDeleteLeave,
  onAddYear,
  onRemoveYear,
  onSelectYear,
  onOpenChangeCredentials,
  onOpenExportImport,
  onResetWorkspace
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>(initialTab);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setSearchQuery('');
    }
  }, [isOpen, initialTab]);

  // Department tab states
  const [newDeptName, setNewDeptName] = useState('');
  const [editingDept, setEditingDept] = useState<string | null>(null);
  const [editDeptValue, setEditDeptValue] = useState('');
  const [deptError, setDeptError] = useState<string | null>(null);

  // Client inline creation state
  const [isAddingClient, setIsAddingClient] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientIndustry, setNewClientIndustry] = useState('');
  const [newClientStatus, setNewClientStatus] = useState<ClientStatus>('active');
  const [newClientColor, setNewClientColor] = useState(CLIENT_COLORS[0]);
  const [clientToDeleteConfirm, setClientToDeleteConfirm] = useState<string | null>(null);

  // Project delete confirmation state
  const [projectToDeleteConfirm, setProjectToDeleteConfirm] = useState<string | null>(null);

  // Person delete confirmation state
  const [personToDeleteConfirm, setPersonToDeleteConfirm] = useState<string | null>(null);

  // Years state
  const maxYear = availableYears.length > 0 ? Math.max(...availableYears) : new Date().getFullYear();
  const [customYear, setCustomYear] = useState<string>(String(maxYear + 1));
  const [yearError, setYearError] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  // Filter lists
  const filteredPeople = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return [...people]
      .filter((p) => {
        if (!q) return true;
        return (
          p.name.toLowerCase().includes(q) ||
          p.role.toLowerCase().includes(q) ||
          p.department.toLowerCase().includes(q) ||
          p.email.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        const aLast = (a.lastName || a.name).toLowerCase();
        const bLast = (b.lastName || b.name).toLowerCase();
        return aLast.localeCompare(bLast);
      });
  }, [people, searchQuery]);

  const filteredClients = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return [...clients]
      .filter((c) => {
        if (!q) return true;
        return (
          c.name.toLowerCase().includes(q) ||
          c.industry.toLowerCase().includes(q) ||
          c.status.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [clients, searchQuery]);

  const filteredProjects = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return [...projects]
      .filter((proj) => {
        if (!q) return true;
        const client = clients.find((c) => c.id === proj.clientId);
        return (
          proj.name.toLowerCase().includes(q) ||
          proj.code.toLowerCase().includes(q) ||
          (client && client.name.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [projects, clients, searchQuery]);

  const filteredLeaves = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return [...leaves]
      .filter((l) => {
        if (!q) return true;
        const person = people.find((p) => p.id === l.personId);
        return (
          l.title.toLowerCase().includes(q) ||
          l.type.toLowerCase().includes(q) ||
          (person && person.name.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => b.year - a.year || a.startMonth - b.startMonth);
  }, [leaves, people, searchQuery]);

  if (!isOpen) return null;

  const handleCreateDept = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newDeptName.trim();
    if (!trimmed) return;
    if (trimmed.toLowerCase() === 'all') {
      setDeptError('"All" is a reserved filter keyword.');
      return;
    }
    if (departments.some((d) => d.toLowerCase() === trimmed.toLowerCase())) {
      setDeptError(`Department "${trimmed}" already exists.`);
      return;
    }
    onAddDepartment(trimmed);
    setNewDeptName('');
    setDeptError(null);
  };

  const handleSaveDeptRename = (oldName: string) => {
    const trimmed = editDeptValue.trim();
    if (!trimmed) {
      setDeptError('Department name cannot be empty.');
      return;
    }
    if (trimmed.toLowerCase() === 'all') {
      setDeptError('"All" is reserved.');
      return;
    }
    if (
      trimmed !== oldName &&
      departments.some((d) => d.toLowerCase() === trimmed.toLowerCase())
    ) {
      setDeptError(`Department "${trimmed}" already exists.`);
      return;
    }
    onRenameDepartment(oldName, trimmed);
    setEditingDept(null);
    setDeptError(null);
  };

  const handleCreateClientSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName.trim()) return;
    onAddClient({
      name: newClientName.trim(),
      industry: newClientIndustry.trim() || 'Technology',
      status: newClientStatus,
      color: newClientColor
    });
    setNewClientName('');
    setNewClientIndustry('');
    setNewClientStatus('active');
    setIsAddingClient(false);
  };

  const handleAddYearSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseInt(customYear, 10);
    if (isNaN(parsed) || parsed < 2000 || parsed > 2100) {
      setYearError('Enter a valid year between 2000 and 2100.');
      return;
    }
    if (availableYears.includes(parsed)) {
      setYearError(`Year ${parsed} already exists.`);
      return;
    }
    setYearError(null);
    onAddYear(parsed);
    setCustomYear(String(Math.max(...availableYears, parsed) + 1));
  };

  const navItems: {
    id: AdminTab;
    label: string;
    count?: number;
    icon: React.FC<{ className?: string }>;
  }[] = [
    { id: 'people', label: 'People & Team', count: people.length, icon: Users },
    { id: 'departments', label: 'Departments', count: departments.length, icon: Building2 },
    { id: 'clients', label: 'Clients', count: clients.length, icon: Briefcase },
    { id: 'projects', label: 'Projects', count: projects.length, icon: FolderKanban },
    { id: 'leaves', label: 'Time Off & Leaves', count: leaves.length, icon: CalendarOff },
    { id: 'workspace', label: 'Years & System', icon: ShieldCheck }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-5xl h-[82vh] flex flex-col overflow-hidden">
        {/* Top Modal Header */}
        <div className="px-6 py-4 bg-slate-100/90 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Admin Control Panel
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-wider bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 rounded-md border border-indigo-200 dark:border-indigo-800">
                  {currentUser || 'admin'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Centralized directory for managing people, departments, clients, projects, leaves, and workspace settings
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Main Body: Left Sidebar + Right Content */}
        <div className="flex-1 min-h-0 flex overflow-hidden">
          {/* Left Navigation Sidebar */}
          <aside className="w-56 shrink-0 bg-slate-50 dark:bg-slate-900/60 border-r border-slate-200 dark:border-slate-800 p-3 flex flex-col justify-between overflow-y-auto">
            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setActiveTab(item.id);
                      setSearchQuery('');
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                      isActive
                        ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/70 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </div>
                    {item.count !== undefined && (
                      <span
                        className={`px-1.5 py-0.5 text-[10px] font-mono rounded-md ${
                          isActive
                            ? 'bg-indigo-700 text-indigo-100'
                            : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {item.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-1.5">
              <div className="px-2 text-[10px] font-mono uppercase tracking-wider text-slate-400">
                Quick Summary ({selectedYear})
              </div>
              <div className="grid grid-cols-2 gap-1.5 text-[11px] px-1">
                <div className="p-2 rounded-lg bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-800">
                  <div className="text-slate-400 text-[10px]">Headcount</div>
                  <div className="font-mono font-bold text-slate-800 dark:text-slate-100">
                    {people.length}
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-800">
                  <div className="text-slate-400 text-[10px]">Projects</div>
                  <div className="font-mono font-bold text-slate-800 dark:text-slate-100">
                    {projects.length}
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* Right Content Area */}
          <div className="flex-1 min-w-0 flex flex-col overflow-hidden bg-white dark:bg-slate-900">
            {/* Sub-header with Search & Primary Action for List Tabs */}
            {activeTab !== 'departments' && activeTab !== 'workspace' && (
              <div className="px-6 py-3.5 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={`Search ${activeTab}...`}
                    className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-2 text-xs text-slate-400 hover:text-slate-600"
                    >
                      ×
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {activeTab === 'people' && (
                    <button
                      type="button"
                      onClick={onOpenAddPerson}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Team Member</span>
                    </button>
                  )}
                  {activeTab === 'clients' && (
                    <button
                      type="button"
                      onClick={() => setIsAddingClient((v) => !v)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>New Client Company</span>
                    </button>
                  )}
                  {activeTab === 'projects' && (
                    <button
                      type="button"
                      onClick={onOpenAddProject}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Deliverable Project</span>
                    </button>
                  )}
                  {activeTab === 'leaves' && (
                    <button
                      type="button"
                      onClick={onOpenAddLeave}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Schedule Time Off</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Tab Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* TAB 1: PEOPLE */}
              {activeTab === 'people' && (
                <div className="space-y-3">
                  {filteredPeople.length === 0 ? (
                    <div className="text-center py-12 text-xs text-slate-400">
                      No team members match your search.
                    </div>
                  ) : (
                    <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800 font-semibold">
                            <th className="py-2.5 px-4">Name (Last, First)</th>
                            <th className="py-2.5 px-3">Role</th>
                            <th className="py-2.5 px-3">Department</th>
                            <th className="py-2.5 px-3">Contract</th>
                            <th className="py-2.5 px-3 text-center">Capacity</th>
                            <th className="py-2.5 px-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                          {filteredPeople.map((person) => {
                            const empType: EmploymentType = person.employmentType || 'Internal';
                            const empBadge = EMPLOYMENT_BADGE_CONFIG[empType];
                            const isConfirmingDelete = personToDeleteConfirm === person.id;

                            return (
                              <tr
                                key={person.id}
                                className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                              >
                                <td className="py-2.5 px-4">
                                  <div className="flex items-center gap-2.5">
                                    <div
                                      className="w-7 h-7 rounded-full text-white font-semibold text-[11px] flex items-center justify-center shrink-0"
                                      style={{ backgroundColor: person.avatarColor }}
                                    >
                                      {person.initials}
                                    </div>
                                    <div>
                                      <div className="font-semibold text-slate-900 dark:text-slate-100">
                                        {formatPersonTableName(person)}
                                      </div>
                                      <div className="text-[11px] text-slate-400 font-mono">
                                        {person.email}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">
                                  {person.role}
                                </td>
                                <td className="py-2.5 px-3">
                                  <span className="px-2 py-0.5 text-[11px] rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                                    {person.department}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3">
                                  <span
                                    className={`inline-block px-2 py-0.5 text-[10px] font-semibold rounded border ${empBadge.badgeClass}`}
                                  >
                                    {empBadge.label}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 text-center font-mono font-semibold text-slate-700 dark:text-slate-300">
                                  {person.maxCapacityPercent}%
                                </td>
                                <td className="py-2.5 px-4 text-right">
                                  {isConfirmingDelete ? (
                                    <div className="inline-flex items-center gap-1.5">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          onDeletePerson(person.id);
                                          setPersonToDeleteConfirm(null);
                                        }}
                                        className="px-2 py-1 text-[11px] font-semibold bg-rose-600 text-white rounded hover:bg-rose-700 cursor-pointer"
                                      >
                                        Confirm
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setPersonToDeleteConfirm(null)}
                                        className="px-2 py-1 text-[11px] text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded cursor-pointer"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="inline-flex items-center gap-1">
                                      <button
                                        type="button"
                                        onClick={() => onEditPerson(person)}
                                        className="p-1.5 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
                                        title="Edit person"
                                      >
                                        <Pencil className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setPersonToDeleteConfirm(person.id)}
                                        className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-md transition-colors cursor-pointer"
                                        title="Remove person"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: DEPARTMENTS */}
              {activeTab === 'departments' && (
                <div className="max-w-2xl space-y-6">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      Add New Department
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Create organizational units for filtering and capacity reporting.
                    </p>
                    <form onSubmit={handleCreateDept} className="mt-3 flex gap-2">
                      <input
                        type="text"
                        value={newDeptName}
                        onChange={(e) => setNewDeptName(e.target.value)}
                        placeholder="e.g., Data Science, QA, DevOps..."
                        className="flex-1 px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                      />
                      <button
                        type="submit"
                        disabled={!newDeptName.trim()}
                        className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 rounded-lg transition-colors cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Department</span>
                      </button>
                    </form>
                    {deptError && (
                      <div className="mt-2 p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-xs text-rose-600 dark:text-rose-300">
                        {deptError}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Active Departments ({departments.length})
                    </h4>
                    <div className="divide-y divide-slate-200 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                      {departments.map((dept) => {
                        const memberCount = people.filter((p) => p.department === dept).length;
                        const isEditing = editingDept === dept;

                        return (
                          <div
                            key={dept}
                            className="flex items-center justify-between px-4 py-3 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/40"
                          >
                            {isEditing ? (
                              <div className="flex items-center gap-2 flex-1 mr-3">
                                <input
                                  type="text"
                                  value={editDeptValue}
                                  onChange={(e) => setEditDeptValue(e.target.value)}
                                  className="flex-1 px-2.5 py-1 text-xs rounded border border-indigo-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                                  autoFocus
                                />
                                <button
                                  type="button"
                                  onClick={() => handleSaveDeptRename(dept)}
                                  className="p-1.5 bg-indigo-600 text-white rounded hover:bg-indigo-700 cursor-pointer"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingDept(null);
                                    setDeptError(null);
                                  }}
                                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded cursor-pointer"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-3">
                                <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                                  {dept}
                                </span>
                                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
                                  {memberCount} {memberCount === 1 ? 'person' : 'people'}
                                </span>
                              </div>
                            )}

                            {!isEditing && (
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingDept(dept);
                                    setEditDeptValue(dept);
                                    setDeptError(null);
                                  }}
                                  className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                                  title="Rename department"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  disabled={memberCount > 0 || departments.length <= 1}
                                  onClick={() => onDeleteDepartment(dept)}
                                  className={`p-1.5 rounded-md ${
                                    memberCount === 0 && departments.length > 1
                                      ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer'
                                      : 'text-slate-200 dark:text-slate-700 cursor-not-allowed'
                                  }`}
                                  title={
                                    memberCount > 0
                                      ? `Cannot delete while ${memberCount} team member(s) belong to ${dept}`
                                      : 'Delete department'
                                  }
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: CLIENTS */}
              {activeTab === 'clients' && (
                <div className="space-y-4">
                  {isAddingClient && (
                    <form
                      onSubmit={handleCreateClientSubmit}
                      className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-indigo-200 dark:border-indigo-900 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                          New Client Company
                        </h4>
                        <button
                          type="button"
                          onClick={() => setIsAddingClient(false)}
                          className="text-xs text-slate-400 hover:text-slate-600"
                        >
                          Cancel
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-1">
                            Company Name *
                          </label>
                          <input
                            type="text"
                            required
                            value={newClientName}
                            onChange={(e) => setNewClientName(e.target.value)}
                            placeholder="e.g. Acme FinTech"
                            className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-1">
                            Industry
                          </label>
                          <input
                            type="text"
                            value={newClientIndustry}
                            onChange={(e) => setNewClientIndustry(e.target.value)}
                            placeholder="e.g. Banking, Retail, SaaS"
                            className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-1">
                            Status & Color
                          </label>
                          <div className="flex items-center gap-2">
                            <select
                              value={newClientStatus}
                              onChange={(e) => setNewClientStatus(e.target.value as ClientStatus)}
                              className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                            >
                              <option value="active">Active</option>
                              <option value="lead">Lead</option>
                              <option value="completed">Completed</option>
                            </select>
                            <div className="flex items-center gap-1">
                              {CLIENT_COLORS.slice(0, 5).map((col) => (
                                <button
                                  key={col}
                                  type="button"
                                  onClick={() => setNewClientColor(col)}
                                  className={`w-5 h-5 rounded-full transition-transform ${
                                    newClientColor === col ? 'scale-110 ring-2 ring-slate-900 dark:ring-white' : ''
                                  }`}
                                  style={{ backgroundColor: col }}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <button
                          type="submit"
                          className="px-4 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg cursor-pointer"
                        >
                          Save Client
                        </button>
                      </div>
                    </form>
                  )}

                  {filteredClients.length === 0 ? (
                    <div className="text-center py-12 text-xs text-slate-400">
                      No clients match your search.
                    </div>
                  ) : (
                    <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800 font-semibold">
                            <th className="py-2.5 px-4">Client Name</th>
                            <th className="py-2.5 px-3">Industry</th>
                            <th className="py-2.5 px-3">Status</th>
                            <th className="py-2.5 px-3 text-center">Projects</th>
                            <th className="py-2.5 px-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                          {filteredClients.map((client) => {
                            const clientProjects = projects.filter((p) => p.clientId === client.id);
                            const isConfirming = clientToDeleteConfirm === client.id;

                            return (
                              <tr
                                key={client.id}
                                className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                              >
                                <td className="py-2.5 px-4">
                                  <div className="flex items-center gap-2.5">
                                    <span
                                      className="w-3 h-3 rounded-full shrink-0"
                                      style={{ backgroundColor: client.color }}
                                    />
                                    <span className="font-semibold text-slate-900 dark:text-slate-100">
                                      {client.name}
                                    </span>
                                  </div>
                                </td>
                                <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">
                                  {client.industry}
                                </td>
                                <td className="py-2.5 px-3">
                                  <span className="px-2 py-0.5 text-[10px] font-mono uppercase rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                    {client.status}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 text-center font-mono">
                                  {clientProjects.length}
                                </td>
                                <td className="py-2.5 px-4 text-right">
                                  {isConfirming ? (
                                    <div className="inline-flex items-center gap-1.5">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          onDeleteClient(client.id);
                                          setClientToDeleteConfirm(null);
                                        }}
                                        className="px-2 py-1 text-[11px] font-semibold bg-rose-600 text-white rounded hover:bg-rose-700 cursor-pointer"
                                      >
                                        Delete ({clientProjects.length} proj)
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setClientToDeleteConfirm(null)}
                                        className="px-2 py-1 text-[11px] text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 rounded cursor-pointer"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="inline-flex items-center gap-1">
                                      <button
                                        type="button"
                                        onClick={() => onEditClient(client)}
                                        className="p-1.5 text-slate-500 hover:text-indigo-600 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                                        title="Edit client"
                                      >
                                        <Pencil className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setClientToDeleteConfirm(client.id)}
                                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                                        title="Delete client and its projects"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: PROJECTS */}
              {activeTab === 'projects' && (
                <div className="space-y-3">
                  {filteredProjects.length === 0 ? (
                    <div className="text-center py-12 text-xs text-slate-400">
                      No projects match your search.
                    </div>
                  ) : (
                    <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800 font-semibold">
                            <th className="py-2.5 px-4">Project & Code</th>
                            <th className="py-2.5 px-3">Client</th>
                            <th className="py-2.5 px-3">Status</th>
                            <th className="py-2.5 px-3 text-center">Billing</th>
                            <th className="py-2.5 px-3 text-center">Assigned ({selectedYear})</th>
                            <th className="py-2.5 px-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                          {filteredProjects.map((project) => {
                            const client = clients.find((c) => c.id === project.clientId);
                            const assignedCount = allocations.filter(
                              (a) => a.projectId === project.id && a.year === selectedYear
                            ).length;
                            const isConfirming = projectToDeleteConfirm === project.id;

                            return (
                              <tr
                                key={project.id}
                                className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                              >
                                <td className="py-2.5 px-4">
                                  <div className="flex items-center gap-2">
                                    <span
                                      className="w-2.5 h-2.5 rounded-full shrink-0"
                                      style={{ backgroundColor: project.color }}
                                    />
                                    <div>
                                      <div className="font-semibold text-slate-900 dark:text-slate-100">
                                        {project.name}
                                      </div>
                                      <div className="text-[10px] font-mono text-slate-400">
                                        {project.code}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className="py-2.5 px-3 font-medium text-slate-700 dark:text-slate-300">
                                  {client?.name || 'Unknown'}
                                </td>
                                <td className="py-2.5 px-3">
                                  <span className="px-2 py-0.5 text-[10px] font-mono uppercase rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                    {project.status}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 text-center">
                                  <span
                                    className={`px-2 py-0.5 text-[10px] font-semibold rounded ${
                                      project.billable
                                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                    }`}
                                  >
                                    {project.billable ? 'Billable' : 'Internal'}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 text-center font-mono">
                                  {assignedCount}
                                </td>
                                <td className="py-2.5 px-4 text-right">
                                  {isConfirming ? (
                                    <div className="inline-flex items-center gap-1.5">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          onDeleteProject(project.id);
                                          setProjectToDeleteConfirm(null);
                                        }}
                                        className="px-2 py-1 text-[11px] font-semibold bg-rose-600 text-white rounded hover:bg-rose-700 cursor-pointer"
                                      >
                                        Confirm
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setProjectToDeleteConfirm(null)}
                                        className="px-2 py-1 text-[11px] text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 rounded cursor-pointer"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="inline-flex items-center gap-1">
                                      <button
                                        type="button"
                                        onClick={() => onEditProject(project)}
                                        className="p-1.5 text-slate-500 hover:text-indigo-600 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                                        title="Edit project"
                                      >
                                        <Pencil className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setProjectToDeleteConfirm(project.id)}
                                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                                        title="Delete project"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 5: LEAVES & TIME OFF */}
              {activeTab === 'leaves' && (
                <div className="space-y-3">
                  {filteredLeaves.length === 0 ? (
                    <div className="text-center py-12 text-xs text-slate-400">
                      No scheduled time off entries found.
                    </div>
                  ) : (
                    <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800 font-semibold">
                            <th className="py-2.5 px-4">Team Member</th>
                            <th className="py-2.5 px-3">Leave Type & Title</th>
                            <th className="py-2.5 px-3">Year & Period</th>
                            <th className="py-2.5 px-3 text-center">Capacity Impact</th>
                            <th className="py-2.5 px-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                          {filteredLeaves.map((leave) => {
                            const person = people.find((p) => p.id === leave.personId);
                            const cfg = LEAVE_TYPE_CONFIG[leave.type];
                            return (
                              <tr
                                key={leave.id}
                                className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                              >
                                <td className="py-2.5 px-4 font-semibold text-slate-900 dark:text-slate-100">
                                  {person ? formatPersonTableName(person) : 'Unknown'}
                                </td>
                                <td className="py-2.5 px-3">
                                  <div className="flex items-center gap-2">
                                    <span
                                      className={`px-2 py-0.5 text-[10px] font-semibold rounded border ${cfg.badgeClass}`}
                                    >
                                      {cfg.label}
                                    </span>
                                    <span className="text-slate-700 dark:text-slate-300">
                                      {leave.title}
                                    </span>
                                  </div>
                                </td>
                                <td className="py-2.5 px-3 font-mono text-slate-600 dark:text-slate-300">
                                  {leave.year} · {MONTH_NAMES[leave.startMonth]}
                                  {leave.endMonth !== leave.startMonth
                                    ? ` – ${MONTH_NAMES[leave.endMonth]}`
                                    : ''}
                                </td>
                                <td className="py-2.5 px-3 text-center font-mono font-semibold text-rose-600 dark:text-rose-400">
                                  -{leave.impactPercent}%
                                </td>
                                <td className="py-2.5 px-4 text-right">
                                  <button
                                    type="button"
                                    onClick={() => onDeleteLeave(leave.id)}
                                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                                    title="Remove leave entry"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 6: WORKSPACE & YEARS */}
              {activeTab === 'workspace' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Planning Years Card */}
                  <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-4">
                    <div className="flex items-center gap-2.5">
                      <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        Planning Years Horizon
                      </h3>
                    </div>

                    <form onSubmit={handleAddYearSubmit} className="flex gap-2">
                      <input
                        type="number"
                        min={2000}
                        max={2100}
                        value={customYear}
                        onChange={(e) => setCustomYear(e.target.value)}
                        className="w-32 px-3 py-1.5 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                      />
                      <button
                        type="submit"
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Year</span>
                      </button>
                    </form>
                    {yearError && (
                      <div className="text-xs text-rose-600 dark:text-rose-400">{yearError}</div>
                    )}

                    <div className="space-y-1.5">
                      {availableYears.map((yr) => {
                        const isCurrent = yr === selectedYear;
                        return (
                          <div
                            key={yr}
                            className="flex items-center justify-between px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs"
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold">{yr}</span>
                              {isCurrent && (
                                <span className="px-2 py-0.5 text-[10px] font-semibold bg-indigo-600 text-white rounded">
                                  Active
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {!isCurrent && (
                                <button
                                  type="button"
                                  onClick={() => onSelectYear(yr)}
                                  className="text-indigo-600 dark:text-indigo-400 hover:underline text-xs cursor-pointer"
                                >
                                  Switch
                                </button>
                              )}
                              <button
                                type="button"
                                disabled={availableYears.length <= 1}
                                onClick={() => onRemoveYear(yr)}
                                className="p-1 text-slate-400 hover:text-rose-600 disabled:opacity-30 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Security & Data Card */}
                  <div className="space-y-4">
                    <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-3">
                      <div className="flex items-center gap-2.5">
                        <KeyRound className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                          Admin Credentials & Security
                        </h3>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Update the administrator login username and password required to unlock the AlloCat workspace.
                      </p>
                      <button
                        type="button"
                        onClick={onOpenChangeCredentials}
                        className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                      >
                        <KeyRound className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Change Login & Password</span>
                      </button>
                    </div>

                    <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-3">
                      <div className="flex items-center gap-2.5">
                        <Download className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                          Backup, Import / Export & Reset
                        </h3>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Export full JSON backups or CSV spreadsheets, restore from a file, or reset to demo defaults.
                      </p>
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={onOpenExportImport}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Open Import / Export</span>
                        </button>

                        {!confirmReset ? (
                          <button
                            type="button"
                            onClick={() => setConfirmReset(true)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-rose-600 dark:text-rose-400 bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/60 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Reset Demo Data</span>
                          </button>
                        ) : (
                          <div className="flex items-center gap-1.5 bg-rose-50 dark:bg-rose-950/50 px-2.5 py-1.5 rounded-lg border border-rose-200 dark:border-rose-800">
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                            <span className="text-[11px] font-semibold text-rose-700 dark:text-rose-300">
                              Overwrite all data?
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                onResetWorkspace();
                                setConfirmReset(false);
                              }}
                              className="px-2 py-0.5 text-[11px] font-bold bg-rose-600 text-white rounded cursor-pointer"
                            >
                              Yes, Reset
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmReset(false)}
                              className="px-2 py-0.5 text-[11px] text-slate-500 cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
