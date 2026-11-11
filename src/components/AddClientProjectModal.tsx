import React, { useState, useEffect } from 'react';
import { X, Briefcase, Building, Pencil, Check, Trash2 } from 'lucide-react';
import { Client, ClientStatus, Project, ProjectStatus } from '../types';

interface AddClientProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  clients: Client[];
  projectToEdit?: Project | null;
  clientToEdit?: Client | null;
  onSaveProject: (
    project: Omit<Project, 'id'>,
    newClient?: Omit<Client, 'id'>
  ) => void;
  onUpdateProject?: (
    project: Project,
    updatedClient?: Client,
    newClient?: Omit<Client, 'id'>
  ) => void;
  onUpdateClient?: (client: Client) => void;
  onDeleteProject?: (projectId: string) => void;
}

const PROJECT_COLORS = [
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

export const AddClientProjectModal: React.FC<AddClientProjectModalProps> = ({
  isOpen,
  onClose,
  clients,
  projectToEdit,
  clientToEdit,
  onSaveProject,
  onUpdateProject,
  onUpdateClient,
  onDeleteProject
}) => {
  const isEditingClientOnly = Boolean(clientToEdit && !projectToEdit);
  const isEditingProject = Boolean(projectToEdit);

  const [clientMode, setClientMode] = useState<'existing' | 'editCurrent' | 'new'>('existing');
  const [clientId, setClientId] = useState(clients[0]?.id || '');

  // Fields for creating a new client or editing an existing client
  const [clientName, setClientName] = useState('');
  const [clientIndustry, setClientIndustry] = useState('');
  const [clientStatus, setClientStatus] = useState<ClientStatus>('active');
  const [clientColor, setClientColor] = useState(PROJECT_COLORS[0]);

  // Project fields
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [projectStatus, setProjectStatus] = useState<ProjectStatus>('active');
  const [color, setColor] = useState(PROJECT_COLORS[0]);
  const [billable, setBillable] = useState(true);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!isOpen) return;

    if (clientToEdit && !projectToEdit) {
      setClientId(clientToEdit.id);
      setClientName(clientToEdit.name);
      setClientIndustry(clientToEdit.industry);
      setClientStatus(clientToEdit.status || 'active');
      setClientColor(clientToEdit.color || PROJECT_COLORS[0]);
      return;
    }

    if (projectToEdit) {
      const parentClient = clients.find((c) => c.id === projectToEdit.clientId) || clients[0];
      setClientMode('existing');
      setClientId(projectToEdit.clientId || parentClient?.id || '');
      setClientName(parentClient?.name || '');
      setClientIndustry(parentClient?.industry || '');
      setClientStatus(parentClient?.status || 'active');
      setClientColor(parentClient?.color || PROJECT_COLORS[0]);

      setName(projectToEdit.name);
      setCode(projectToEdit.code);
      setProjectStatus(projectToEdit.status || 'active');
      setColor(projectToEdit.color || PROJECT_COLORS[0]);
      setBillable(projectToEdit.billable ?? true);
      setNotes(projectToEdit.notes || '');
      return;
    }

    // Default Add Mode
    const firstClient = clients[0];
    setClientMode(firstClient ? 'existing' : 'new');
    setClientId(firstClient?.id || '');
    setClientName('');
    setClientIndustry('');
    setClientStatus('active');
    setClientColor(PROJECT_COLORS[0]);

    setName('');
    setCode('');
    setProjectStatus('active');
    setColor(PROJECT_COLORS[0]);
    setBillable(true);
    setNotes('');
  }, [isOpen, projectToEdit, clientToEdit, clients]);

  if (!isOpen) return null;

  const handleSelectExistingClientChange = (newId: string) => {
    setClientId(newId);
    const found = clients.find((c) => c.id === newId);
    if (found) {
      setClientName(found.name);
      setClientIndustry(found.industry);
      setClientStatus(found.status);
      setClientColor(found.color);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Editing Company / Client only
    if (isEditingClientOnly && clientToEdit && onUpdateClient) {
      if (!clientName.trim()) return;
      onUpdateClient({
        ...clientToEdit,
        name: clientName.trim(),
        industry: clientIndustry.trim() || 'Technology',
        status: clientStatus,
        color: clientColor
      });
      onClose();
      return;
    }

    // 2. Adding or Editing a Project
    if (!name.trim()) return;
    const generatedCode =
      code.trim() ||
      name
        .trim()
        .split(/\s+/)
        .map((w) => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 6);

    if (isEditingProject && projectToEdit && onUpdateProject) {
      if (clientMode === 'new') {
        if (!clientName.trim()) return;
        onUpdateProject(
          {
            ...projectToEdit,
            name: name.trim(),
            code: generatedCode,
            status: projectStatus,
            color,
            billable,
            notes: notes.trim() || undefined
          },
          undefined,
          {
            name: clientName.trim(),
            industry: clientIndustry.trim() || 'Technology',
            color,
            status: 'active'
          }
        );
      } else if (clientMode === 'editCurrent') {
        const existingClient = clients.find((c) => c.id === clientId);
        const updatedClientObj: Client | undefined =
          existingClient && clientName.trim()
            ? {
                ...existingClient,
                name: clientName.trim(),
                industry: clientIndustry.trim() || existingClient.industry
              }
            : undefined;

        onUpdateProject(
          {
            ...projectToEdit,
            clientId,
            name: name.trim(),
            code: generatedCode,
            status: projectStatus,
            color,
            billable,
            notes: notes.trim() || undefined
          },
          updatedClientObj
        );
      } else {
        onUpdateProject({
          ...projectToEdit,
          clientId,
          name: name.trim(),
          code: generatedCode,
          status: projectStatus,
          color,
          billable,
          notes: notes.trim() || undefined
        });
      }
      onClose();
      return;
    }

    // 3. Creating a new project
    if (clientMode === 'new') {
      if (!clientName.trim()) return;
      onSaveProject(
        {
          clientId: 'NEW',
          name: name.trim(),
          code: generatedCode,
          status: projectStatus,
          color,
          billable,
          notes: notes.trim() || undefined
        },
        {
          name: clientName.trim(),
          industry: clientIndustry.trim() || 'Technology',
          color,
          status: 'active'
        }
      );
    } else {
      onSaveProject({
        clientId,
        name: name.trim(),
        code: generatedCode,
        status: projectStatus,
        color,
        billable,
        notes: notes.trim() || undefined
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md overflow-hidden">
        <div className="px-5 py-4 bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              {isEditingClientOnly ? (
                <Building className="w-4 h-4" />
              ) : isEditingProject ? (
                <Pencil className="w-4 h-4" />
              ) : (
                <Briefcase className="w-4 h-4" />
              )}
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {isEditingClientOnly
                  ? 'Edit Company / Client'
                  : isEditingProject
                  ? 'Edit Company & Project'
                  : 'Add Company / Project'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isEditingClientOnly
                  ? `Update company details for ${clientToEdit?.name}`
                  : isEditingProject
                  ? `Update project details for ${projectToEdit?.name}`
                  : 'Create a deliverable project & client'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {isEditingClientOnly ? (
            <>
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Company / Client Name
                </label>
                <input
                  type="text"
                  placeholder="e.g., Apex Financial Technologies"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  required
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Industry
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Fintech & Capital Markets"
                    value={clientIndustry}
                    onChange={(e) => setClientIndustry(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Company Status
                  </label>
                  <select
                    value={clientStatus}
                    onChange={(e) => setClientStatus(e.target.value as ClientStatus)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  >
                    <option value="active">Active</option>
                    <option value="lead">Lead / Prospect</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Brand Color
                </label>
                <div className="flex items-center gap-1.5">
                  {PROJECT_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setClientColor(c)}
                      className={`w-5 h-5 rounded-full cursor-pointer ${
                        clientColor === c ? 'ring-2 ring-offset-1 ring-blue-500 scale-110' : ''
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            </>
          ) : (
            <>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Company / Client
                  </label>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => setClientMode('existing')}
                      className={`px-2 py-0.5 rounded text-[11px] cursor-pointer ${
                        clientMode === 'existing'
                          ? 'bg-blue-600 text-white font-semibold'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      Select Existing
                    </button>
                    {isEditingProject && (
                      <button
                        type="button"
                        onClick={() => {
                          const found = clients.find((c) => c.id === clientId);
                          if (found) {
                            setClientName(found.name);
                            setClientIndustry(found.industry);
                          }
                          setClientMode('editCurrent');
                        }}
                        className={`px-2 py-0.5 rounded text-[11px] cursor-pointer ${
                          clientMode === 'editCurrent'
                            ? 'bg-blue-600 text-white font-semibold'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        Edit Company
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setClientName('');
                        setClientIndustry('');
                        setClientMode('new');
                      }}
                      className={`px-2 py-0.5 rounded text-[11px] cursor-pointer ${
                        clientMode === 'new'
                          ? 'bg-blue-600 text-white font-semibold'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      + New Company
                    </button>
                  </div>
                </div>

                {clientMode === 'existing' ? (
                  <select
                    value={clientId}
                    onChange={(e) => handleSelectExistingClientChange(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  >
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.industry})
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Company Name"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                      required
                    />
                    <input
                      type="text"
                      placeholder="Industry"
                      value={clientIndustry}
                      onChange={(e) => setClientIndustry(e.target.value)}
                      className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Project Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Core Platform Modernization"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Code
                  </label>
                  <input
                    type="text"
                    placeholder="CPM-01"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Scope / Deliverable Comment (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Q3 target launch..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Status
                  </label>
                  <select
                    value={projectStatus}
                    onChange={(e) => setProjectStatus(e.target.value as ProjectStatus)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  >
                    <option value="active">Active</option>
                    <option value="planned">Planned</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  {PROJECT_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-5 h-5 rounded-full cursor-pointer ${
                        color === c ? 'ring-2 ring-offset-1 ring-blue-500 scale-110' : ''
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>

                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={billable}
                    onChange={(e) => setBillable(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600"
                  />
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    Billable Project
                  </span>
                </label>
              </div>
            </>
          )}

          <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <div>
              {isEditingProject && projectToEdit && onDeleteProject && (
                <button
                  type="button"
                  onClick={() => {
                    onDeleteProject(projectToEdit.id);
                    onClose();
                  }}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-medium cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Project</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium cursor-pointer"
              >
                {isEditingClientOnly || isEditingProject ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Save Changes</span>
                  </>
                ) : (
                  <span>Create Project</span>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
