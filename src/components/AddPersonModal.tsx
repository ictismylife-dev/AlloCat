import React, { useState, useEffect } from 'react';
import { X, UserPlus, Pencil, Check } from 'lucide-react';
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
  personToEdit?: Person | null;
  onSavePerson: (person: Omit<Person, 'id'>) => void;
  onUpdatePerson?: (person: Person) => void;
}

const AVATAR_COLORS = [
  '#2563EB',
  '#7C3AED',
  '#059669',
  '#D97706',
  '#0284C7',
  '#DB2777',
  '#4F46E5',
  '#0891B2',
  '#16A34A',
  '#EA580C'
];

export const AddPersonModal: React.FC<AddPersonModalProps> = ({
  isOpen,
  onClose,
  departments,
  personToEdit,
  onSavePerson,
  onUpdatePerson
}) => {
  const isEditing = Boolean(personToEdit);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [role, setRole] = useState('');
  const [department, setDepartment] = useState<Department>(
    departments[0] || 'Engineering'
  );
  const [employmentType, setEmploymentType] = useState<EmploymentType>('Internal');
  const [email, setEmail] = useState('');
  const [maxCapacityPercent, setMaxCapacityPercent] = useState<number>(100);
  const [avatarColor, setAvatarColor] = useState<string>(AVATAR_COLORS[0]);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    if (personToEdit) {
      const rawFull = (personToEdit.name || '').trim();
      const parts = rawFull ? rawFull.split(/\s+/) : [];
      setFirstName(personToEdit.firstName || parts[0] || '');
      setLastName(
        personToEdit.lastName !== undefined && personToEdit.lastName !== ''
          ? personToEdit.lastName
          : parts.length > 1
          ? parts.slice(1).join(' ')
          : ''
      );
      setRole(personToEdit.role || '');
      setDepartment(personToEdit.department || departments[0] || 'Engineering');
      setEmploymentType(personToEdit.employmentType || 'Internal');
      setEmail(personToEdit.email || '');
      setMaxCapacityPercent(personToEdit.maxCapacityPercent ?? 100);
      setAvatarColor(personToEdit.avatarColor || AVATAR_COLORS[0]);
      setNotes(personToEdit.notes || '');
    } else {
      setFirstName('');
      setLastName('');
      setRole('');
      setDepartment(departments[0] || 'Engineering');
      setEmploymentType('Internal');
      setEmail('');
      setMaxCapacityPercent(100);
      setAvatarColor(
        AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)]
      );
      setNotes('');
    }
  }, [isOpen, personToEdit, departments]);

  if (!isOpen) return null;

  const getInitials = (first: string, last: string) => {
    const f = first.trim();
    const l = last.trim();
    if (!f && !l) return 'TM';
    if (f && l) return (f[0] + l[0]).toUpperCase();
    const single = f || l;
    return single.slice(0, 2).toUpperCase();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanFirst = firstName.trim();
    const cleanLast = lastName.trim();
    if (!cleanFirst || !cleanLast || !role.trim()) return;
    const fullName = `${cleanFirst} ${cleanLast}`.trim();
    const computedEmail =
      email.trim() ||
      `${cleanFirst.toLowerCase()}.${cleanLast.toLowerCase().replace(/\s+/g, '')}@company.internal`;

    if (isEditing && personToEdit && onUpdatePerson) {
      onUpdatePerson({
        ...personToEdit,
        firstName: cleanFirst,
        lastName: cleanLast,
        name: fullName,
        role: role.trim(),
        department,
        employmentType,
        email: computedEmail,
        maxCapacityPercent,
        avatarColor,
        initials: getInitials(cleanFirst, cleanLast),
        notes: notes.trim() || undefined
      });
    } else {
      onSavePerson({
        firstName: cleanFirst,
        lastName: cleanLast,
        name: fullName,
        role: role.trim(),
        department,
        employmentType,
        email: computedEmail,
        maxCapacityPercent,
        avatarColor,
        initials: getInitials(cleanFirst, cleanLast),
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
              {isEditing ? (
                <Pencil className="w-4 h-4" />
              ) : (
                <UserPlus className="w-4 h-4" />
              )}
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {isEditing ? 'Edit Team Member' : 'Add Team Member'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isEditing
                  ? `Update details for ${personToEdit?.name}`
                  : 'Add a new person to AlloCat'}
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
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                First Name
              </label>
              <input
                type="text"
                placeholder="e.g., Alex"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                required
                autoFocus
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Last Name
              </label>
              <input
                type="text"
                placeholder="e.g., Rivera"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Role / Title
              </label>
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
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Department
              </label>
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
              Email (Optional)
            </label>
            <input
              type="email"
              placeholder="e.g., alex.rivera@company.internal"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            />
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

          <div className="flex items-center justify-between gap-4">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Avatar Color
              </label>
              <div className="flex items-center gap-1.5">
                {AVATAR_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setAvatarColor(c)}
                    className={`w-5 h-5 rounded-full transition-transform cursor-pointer ${
                      avatarColor === c
                        ? 'ring-2 ring-offset-1 ring-blue-500 scale-110'
                        : 'opacity-80 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            <div className="flex-1 max-w-[170px]">
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Max Capacity
                </label>
                <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                  {maxCapacityPercent}%
                </span>
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
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
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
              {isEditing ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Save Changes</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Add Member</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
