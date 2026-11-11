import React, { useState } from 'react';
import { X, Briefcase } from 'lucide-react';
import { Client, Project } from '../types';

interface AddClientProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  clients: Client[];
  onSaveProject: (
    project: Omit<Project, 'id'>,
    newClient?: Omit<Client, 'id'>
  ) => void;
}

const PROJECT_COLORS = [
  '#2563EB',
  '#059669',
  '#D97706',
  '#7C3AED',
  '#DB2777',
  '#0284C7',
  '#4F46E5'
];

export const AddClientProjectModal: React.FC<AddClientProjectModalProps> = ({
  isOpen,
  onClose,
  clients,
  onSaveProject
}) => {
  const [clientMode, setClientMode] = useState<'existing' | 'new'>('existing');
  const [clientId, setClientId] = useState(clients[0]?.id || '');
  const [newClientName, setNewClientName] = useState('');
  const [newClientIndustry, setNewClientIndustry] = useState('');

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [color, setColor] = useState(PROJECT_COLORS[0]);
  const [billable, setBillable] = useState(true);
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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

    if (clientMode === 'new') {
      if (!newClientName.trim()) return;
      onSaveProject(
        {
          clientId: 'NEW',
          name: name.trim(),
          code: generatedCode,
          status: 'active',
          color,
          billable,
          notes: notes.trim() || undefined
        },
        {
          name: newClientName.trim(),
          industry: newClientIndustry.trim() || 'Technology',
          color,
          status: 'active'
        }
      );
    } else {
      onSaveProject({
        clientId,
        name: name.trim(),
        code: generatedCode,
        status: 'active',
        color,
        billable,
        notes: notes.trim() || undefined
      });
    }
    setName('');
    setCode('');
    setNotes('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md overflow-hidden">
        <div className="px-5 py-4 bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Briefcase className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">Add Client / Project</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Create a deliverable project</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-md">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">Client</label>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setClientMode('existing')}
                  className={`px-2 py-0.5 rounded text-[11px] ${
                    clientMode === 'existing'
                      ? 'bg-blue-600 text-white font-semibold'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Existing
                </button>
                <button
                  type="button"
                  onClick={() => setClientMode('new')}
                  className={`px-2 py-0.5 rounded text-[11px] ${
                    clientMode === 'new'
                      ? 'bg-blue-600 text-white font-semibold'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  + New Client
                </button>
              </div>
            </div>

            {clientMode === 'existing' ? (
              <select
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
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
                  placeholder="Client Name"
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  required
                />
                <input
                  type="text"
                  placeholder="Industry"
                  value={newClientIndustry}
                  onChange={(e) => setNewClientIndustry(e.target.value)}
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

          <div>
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

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              {PROJECT_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-5 h-5 rounded-full ${
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
              <span className="font-medium text-slate-700 dark:text-slate-300">Billable Project</span>
            </label>
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
              className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium"
            >
              Create Project
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
