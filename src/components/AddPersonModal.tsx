import React, { useState } from 'react';
import { X, UserPlus } from 'lucide-react';
import {
  Department,
  EmploymentType,
  EMPLOYMENT_TYPES,
  Person
} from '../types';

interface AddPersonModalProps {
  isOpen: boolean;
  onClose: () => void;
  departments: Department[];
  onSavePerson: (person: Omit<Person, 'id'>) => void;
}

const AVATAR_COLORS = [
  '#2563EB',
  '#7C3AED',
  '#059669',
  '#D97706',
  '#0284C7',
  '#DB2777',
  '#4F46E5',
  '#0891B2'
];

export const AddPersonModal: React.FC<AddPersonModalProps> = ({
  isOpen,
  onClose,
  departments,
  onSavePerson
}) => {
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [department, setDepartment] = useState<Department>(departments[0] || 'Engineering');
  const [employmentType, setEmploymentType] = useState<EmploymentType>('Internal');
  const [email, setEmail] = useState('');
  const [maxCapacityPercent, setMaxCapacityPercent] = useState<number>(100);
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const getInitials = (fullName: string) => {
    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 0 || !parts[0]) return 'TM';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !role.trim()) return;
    const color = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
    onSavePerson({
      name: name.trim(),
      role: role.trim(),
      department,
      employmentType,
      email: email.trim() || `${name.trim().toLowerCase().replace(/\s+/g, '.')}@company.internal`,
      maxCapacityPercent,
      avatarColor: color,
      initials: getInitials(name),
      notes: notes.trim() || undefined
    });
    setName('');
    setRole('');
    setEmploymentType('Internal');
    setEmail('');
    setNotes('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md overflow-hidden">
        <div className="px-5 py-4 bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">Add Team Member</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Add a new person to AlloCat</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-md">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
            <input
              type="text"
              placeholder="e.g., Alex Rivera"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              required
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Role / Title</label>
              <input
                type="text"
                placeholder="e.g., Senior Engineer"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Department</label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              >
                {departments.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Employment
            </label>
            <div className="grid grid-cols-3 gap-2">
              {EMPLOYMENT_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setEmploymentType(type)}
                  className={`py-2 px-3 rounded-lg border font-medium text-center transition-all cursor-pointer ${
                    employmentType === type
                      ? 'bg-blue-600 border-blue-600 text-white font-semibold shadow-2xs'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Comments / Staffing Notes (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g., Tech Lead, AWS certified..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">Max Monthly Capacity</label>
              <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{maxCapacityPercent}%</span>
            </div>
            <input
              type="range"
              min={20}
              max={100}
              step={10}
              value={maxCapacityPercent}
              onChange={(e) => setMaxCapacityPercent(Number(e.target.value))}
              className="w-full accent-blue-600 cursor-pointer"
            />
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
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium"
            >
              <UserPlus className="w-3.5 h-3.5" />
              Add Member
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
