import React, { useState } from 'react';
import { Department, Person } from '../types';
import { X, Building, Pencil, Check, Plus, Trash2 } from 'lucide-react';

interface ManageDepartmentsModalProps {
  isOpen: boolean;
  departments: Department[];
  people: Person[];
  onRenameDepartment: (oldName: Department, newName: Department) => void;
  onAddDepartment: (newName: Department) => void;
  onDeleteDepartment: (name: Department) => void;
  onClose: () => void;
}

export const ManageDepartmentsModal: React.FC<ManageDepartmentsModalProps> = ({
  isOpen,
  departments,
  people,
  onRenameDepartment,
  onAddDepartment,
  onDeleteDepartment,
  onClose
}) => {
  const [editingDept, setEditingDept] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [newDeptName, setNewDeptName] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const startEditing = (dept: string) => {
    setEditingDept(dept);
    setEditValue(dept);
    setError(null);
  };

  const handleSaveRename = (oldName: string) => {
    const trimmed = editValue.trim();
    if (!trimmed) {
      setError('Department name cannot be empty.');
      return;
    }
    if (trimmed.toLowerCase() === 'all') {
      setError('"All" is reserved.');
      return;
    }
    if (
      trimmed !== oldName &&
      departments.some((d) => d.toLowerCase() === trimmed.toLowerCase())
    ) {
      setError(`Department "${trimmed}" already exists.`);
      return;
    }
    onRenameDepartment(oldName, trimmed);
    setEditingDept(null);
    setError(null);
  };

  const handleCreateDept = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newDeptName.trim();
    if (!trimmed) return;
    if (trimmed.toLowerCase() === 'all') {
      setError('"All" is reserved.');
      return;
    }
    if (departments.some((d) => d.toLowerCase() === trimmed.toLowerCase())) {
      setError(`Department "${trimmed}" already exists.`);
      return;
    }
    onAddDepartment(trimmed);
    setNewDeptName('');
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md overflow-hidden">
        <div className="px-5 py-4 bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Building className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Manage Departments
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Rename, add, or remove departments
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {error && (
            <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Current Departments ({departments.length})
            </label>
            <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
              {departments.map((dept) => {
                const memberCount = people.filter((p) => p.department === dept).length;
                const isEditing = editingDept === dept;

                return (
                  <div
                    key={dept}
                    className="flex items-center justify-between px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/60"
                  >
                    {isEditing ? (
                      <div className="flex items-center gap-2 flex-1 mr-2">
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveRename(dept);
                            if (e.key === 'Escape') setEditingDept(null);
                          }}
                          className="flex-1 px-2.5 py-1 text-xs font-medium bg-white dark:bg-slate-900 border border-blue-400 rounded"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveRename(dept)}
                          className="p-1.5 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingDept(null)}
                          className="p-1.5 text-slate-400 hover:text-slate-600 rounded"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                            {dept}
                          </span>
                          <span className="text-[11px] font-mono bg-slate-200/80 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded">
                            {memberCount} {memberCount === 1 ? 'person' : 'people'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => startEditing(dept)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 rounded-md flex items-center gap-1 text-xs font-medium"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            <span>Rename</span>
                          </button>
                          <button
                            type="button"
                            disabled={memberCount > 0 || departments.length <= 1}
                            onClick={() => onDeleteDepartment(dept)}
                            className={`p-1.5 rounded-md ${
                              memberCount > 0 || departments.length <= 1
                                ? 'text-slate-300 dark:text-slate-600 cursor-not-allowed'
                                : 'text-slate-400 hover:text-rose-600'
                            }`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <form onSubmit={handleCreateDept} className="pt-3 border-t border-slate-200 dark:border-slate-800">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Add New Department
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="e.g., Security, Data Science..."
                value={newDeptName}
                onChange={(e) => {
                  setNewDeptName(e.target.value);
                  setError(null);
                }}
                className="flex-1 px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
              />
              <button
                type="submit"
                className="px-3.5 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-1.5 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                Add
              </button>
            </div>
          </form>

          <div className="pt-2 flex items-center justify-end border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 rounded-lg"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
