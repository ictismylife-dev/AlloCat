export type Department = string;

export type EmploymentType = 'Internal' | 'External' | 'B2B';

export const EMPLOYMENT_TYPES: EmploymentType[] = ['Internal', 'External', 'B2B'];

export const EMPLOYMENT_BADGE_CONFIG: Record<
  EmploymentType,
  { label: string; badgeClass: string }
> = {
  Internal: {
    label: 'Internal',
    badgeClass:
      'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/70 dark:text-blue-300 dark:border-blue-800/80'
  },
  External: {
    label: 'External',
    badgeClass:
      'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/70 dark:text-amber-300 dark:border-amber-800/80'
  },
  B2B: {
    label: 'B2B',
    badgeClass:
      'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-800/80'
  }
};

export interface Person {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  role: string;
  department: Department;
  employmentType?: EmploymentType; // 'Internal' | 'External' | 'B2B' (defaults to 'Internal')
  email: string;
  maxCapacityPercent: number; // default 100
  avatarColor: string;
  initials: string;
  notes?: string; // Additional comments / staffing notes
}

export type ClientStatus = 'active' | 'lead' | 'completed';

export interface Client {
  id: string;
  name: string;
  industry: string;
  color: string;
  status: ClientStatus;
}

export type ProjectStatus = 'active' | 'planned' | 'completed';

export interface Project {
  id: string;
  clientId: string;
  name: string;
  code: string;
  status: ProjectStatus;
  color: string;
  billable: boolean;
  notes?: string; // Comments / deliverable scope notes
}

export interface Allocation {
  id: string;
  personId: string;
  projectId: string;
  year: number;
  monthlyPercentage: number[]; // 12 numbers (0..100+) representing Jan through Dec
  notes?: string; // Comments / role detail on this specific assignment
}

export type LeaveType =
  | 'sick'
  | 'maternity'
  | 'paternity'
  | 'vacation'
  | 'sabbatical'
  | 'unpaid'
  | 'other';

export interface LeaveEntry {
  id: string;
  personId: string;
  type: LeaveType;
  title: string;
  year: number;
  startMonth: number; // 0..11
  endMonth: number;   // 0..11
  impactPercent: number; // % reduction in availability during these months (e.g. 100 for full month off, 50 for 2 weeks, 25 for 1 week)
  notes?: string;
}

export type ViewMode = 'people' | 'clients' | 'availability' | 'bench';

export type UtilizationFilter = 'all' | 'overbooked' | 'balanced' | 'underbooked';

export type PeopleSortOrder =
  | 'default'
  | 'firstName-asc'
  | 'firstName-desc'
  | 'lastName-asc'
  | 'lastName-desc';

export type ClientSortOrder =
  | 'default'
  | 'client-asc'
  | 'client-desc'
  | 'project-asc'
  | 'project-desc';

export interface FilterState {
  search: string;
  department: Department | 'all';
  employmentFilter?: EmploymentType | 'all';
  utilization: UtilizationFilter;
  clientFilter: string | 'all';
  peopleSort?: PeopleSortOrder;
  clientSort?: ClientSortOrder;
}

export const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
] as const;

export const MONTH_FULL_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
] as const;

export const LEAVE_TYPE_CONFIG: Record<
  LeaveType,
  { label: string; badgeClass: string; iconName: string; defaultImpact: number }
> = {
  sick: {
    label: 'Sick Leave',
    badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border-amber-300 dark:border-amber-800',
    iconName: 'Activity',
    defaultImpact: 50
  },
  maternity: {
    label: 'Maternity Leave',
    badgeClass: 'bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300 border-purple-300 dark:border-purple-800',
    iconName: 'Baby',
    defaultImpact: 100
  },
  paternity: {
    label: 'Paternity Leave',
    badgeClass: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/80 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800',
    iconName: 'HeartHandshake',
    defaultImpact: 100
  },
  vacation: {
    label: 'Annual Vacation / PTO',
    badgeClass: 'bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 border-blue-300 dark:border-blue-800',
    iconName: 'Palmtree',
    defaultImpact: 50
  },
  sabbatical: {
    label: 'Sabbatical',
    badgeClass: 'bg-teal-100 text-teal-800 dark:bg-teal-950/80 dark:text-teal-300 border-teal-300 dark:border-teal-800',
    iconName: 'BookOpen',
    defaultImpact: 100
  },
  unpaid: {
    label: 'Unpaid Leave',
    badgeClass: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700',
    iconName: 'Clock',
    defaultImpact: 100
  },
  other: {
    label: 'Special Leave / Other',
    badgeClass: 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border-rose-300 dark:border-rose-800',
    iconName: 'CalendarOff',
    defaultImpact: 50
  }
};
