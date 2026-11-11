import React from 'react';
import { Person } from '../types';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface ConfirmDeletePersonModalProps {
  person: Person | null;
  onClose: () => void;
  onConfirmDelete: (personId: string) => void;
}

export const ConfirmDeletePersonModal: React.FC<ConfirmDeletePersonModalProps> = ({
  person,
  onClose,
  onConfirmDelete
}) => {
  if (!person) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md overflow-hidden">
        <div className="px-5 py-4 bg-rose-50/70 dark:bg-rose-950/40 border-b border-rose-200/80 dark:border-rose-900 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-900 text-rose-600 dark:text-rose-300 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Remove Team Member
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                This will also remove their allocations and leaves
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <div
              className="w-9 h-9 rounded-full text-white text-xs font-semibold flex items-center justify-center shrink-0"
              style={{ backgroundColor: person.avatarColor }}
            >
              {person.initials}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                {person.name}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {person.role} · {person.department}
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Are you sure you want to remove <strong>{person.name}</strong> from the team? All project assignments and scheduled leaves for this person will be permanently deleted.
          </p>

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                onConfirmDelete(person.id);
                onClose();
              }}
              className="px-4 py-2 text-xs font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-lg flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Remove Person
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
