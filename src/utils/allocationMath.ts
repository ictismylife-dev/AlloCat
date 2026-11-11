import { Allocation, Person, Project, LeaveEntry } from '../types';

export interface MonthlyCapacitySummary {
  totals: number[]; // 12 elements (allocated %)
  effectiveCapacities: number[]; // 12 elements (nominal - leaves)
  leaveReductions: number[]; // 12 elements (% reduction due to leaves)
  monthLeaves: LeaveEntry[][]; // 12 elements of active leaves in each month
  annualAverage: number;
  maxMonthPct: number;
  hasOvertime: boolean;
  overtimeMonths: Array<{
    monthIndex: number;
    totalPct: number;
    effectiveCapacity: number;
    excessPct: number;
    activeLeaves: LeaveEntry[];
  }>;
}

/**
 * Calculates monthly total percentage and overtime alerts for a specific person,
 * factoring in leave reductions (sick leave, maternity, vacation, etc.)
 */
export function getPersonCapacitySummary(
  personId: string,
  year: number,
  allocations: Allocation[],
  maxCapacity: number = 100,
  leaves: LeaveEntry[] = []
): MonthlyCapacitySummary {
  const totals = Array(12).fill(0);
  const effectiveCapacities = Array(12).fill(maxCapacity);
  const leaveReductions = Array(12).fill(0);
  const monthLeaves: LeaveEntry[][] = Array.from({ length: 12 }, () => []);

  // 1. Calculate project allocations
  const personAllocs = allocations.filter(
    (a) => a.personId === personId && a.year === year
  );

  for (const alloc of personAllocs) {
    for (let m = 0; m < 12; m++) {
      totals[m] += alloc.monthlyPercentage[m] || 0;
    }
  }

  // 2. Factor in time off & leaves
  const personLeaves = leaves.filter(
    (l) => l.personId === personId && l.year === year
  );

  for (const leave of personLeaves) {
    const from = Math.min(leave.startMonth, leave.endMonth);
    const to = Math.max(leave.startMonth, leave.endMonth);
    for (let m = from; m <= to; m++) {
      if (m >= 0 && m < 12) {
        leaveReductions[m] = Math.min(100, leaveReductions[m] + leave.impactPercent);
        monthLeaves[m].push(leave);
      }
    }
  }

  for (let m = 0; m < 12; m++) {
    effectiveCapacities[m] = Math.max(0, maxCapacity - leaveReductions[m]);
  }

  // 3. Evaluate overtime conflicts against effective available capacity
  const overtimeMonths: Array<{
    monthIndex: number;
    totalPct: number;
    effectiveCapacity: number;
    excessPct: number;
    activeLeaves: LeaveEntry[];
  }> = [];

  let maxMonthPct = 0;
  let sum = 0;

  for (let m = 0; m < 12; m++) {
    const val = totals[m];
    const effCap = effectiveCapacities[m];
    sum += val;
    if (val > maxMonthPct) maxMonthPct = val;

    if (val > effCap) {
      overtimeMonths.push({
        monthIndex: m,
        totalPct: val,
        effectiveCapacity: effCap,
        excessPct: val - effCap,
        activeLeaves: monthLeaves[m]
      });
    }
  }

  const annualAverage = Math.round(sum / 12);

  return {
    totals,
    effectiveCapacities,
    leaveReductions,
    monthLeaves,
    annualAverage,
    maxMonthPct,
    hasOvertime: overtimeMonths.length > 0,
    overtimeMonths
  };
}

/**
 * Calculates monthly staffing total percentage (FTE%) for a specific project
 */
export function getProjectStaffingSummary(
  projectId: string,
  year: number,
  allocations: Allocation[]
) {
  const totals = Array(12).fill(0);
  const assignedPersonIds = new Set<string>();

  const projectAllocs = allocations.filter(
    (a) => a.projectId === projectId && a.year === year
  );

  for (const alloc of projectAllocs) {
    assignedPersonIds.add(alloc.personId);
    for (let m = 0; m < 12; m++) {
      totals[m] += alloc.monthlyPercentage[m] || 0;
    }
  }

  const sum = totals.reduce((acc, curr) => acc + curr, 0);
  const avgMonthlyFTE = +(sum / (12 * 100)).toFixed(1);

  return {
    totals,
    assignedCount: assignedPersonIds.size,
    avgMonthlyFTE
  };
}

/**
 * Returns clean styling tokens for utilization percentage
 */
export function getUtilizationColorClass(percentage: number, isSubCell: boolean = false) {
  if (percentage === 0) {
    return {
      text: 'text-slate-400 dark:text-slate-500',
      bg: isSubCell ? 'bg-transparent' : 'bg-slate-50 dark:bg-slate-800/40',
      badge: 'text-slate-400 bg-slate-100 dark:bg-slate-800',
      status: 'idle' as const
    };
  }

  if (percentage > 100) {
    return {
      text: 'text-rose-700 dark:text-rose-400 font-semibold',
      bg: isSubCell ? 'bg-rose-50/70 dark:bg-rose-950/30' : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900',
      badge: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-800',
      status: 'overallocated' as const
    };
  }

  if (percentage >= 80) {
    return {
      text: 'text-emerald-700 dark:text-emerald-400 font-medium',
      bg: isSubCell ? 'bg-emerald-50/50 dark:bg-emerald-950/20' : 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900',
      badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
      status: 'optimal' as const
    };
  }

  if (percentage >= 50) {
    return {
      text: 'text-sky-700 dark:text-sky-400 font-medium',
      bg: isSubCell ? 'bg-sky-50/40 dark:bg-sky-950/20' : 'bg-sky-50/50 dark:bg-sky-950/25 border-sky-200 dark:border-sky-900',
      badge: 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300',
      status: 'moderate' as const
    };
  }

  return {
    text: 'text-amber-700 dark:text-amber-400 font-medium',
    bg: isSubCell ? 'bg-amber-50/30 dark:bg-amber-950/15' : 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900',
    badge: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
    status: 'underallocated' as const
  };
}

/**
 * Calculates high level KPI stats for the executive header toolbar
 */
export function calculateExecutiveKPIs(
  people: Person[],
  projects: Project[],
  allocations: Allocation[],
  leaves: LeaveEntry[] = [],
  year: number
) {
  let totalPersonMonthsOverbooked = 0;
  let totalUtilizationSum = 0;
  let overbookedPeopleCount = 0;
  let totalLeaveMonthsCount = 0;

  for (const person of people) {
    const summary = getPersonCapacitySummary(
      person.id,
      year,
      allocations,
      person.maxCapacityPercent,
      leaves
    );
    totalUtilizationSum += summary.annualAverage;
    if (summary.hasOvertime) {
      overbookedPeopleCount++;
      totalPersonMonthsOverbooked += summary.overtimeMonths.length;
    }
  }

  // Count active leaves in this year
  const yearLeaves = leaves.filter((l) => l.year === year);
  for (const leave of yearLeaves) {
    totalLeaveMonthsCount += Math.abs(leave.endMonth - leave.startMonth) + 1;
  }

  const teamAverageUtilization = people.length > 0 ? Math.round(totalUtilizationSum / people.length) : 0;
  const activeProjectsCount = projects.filter((p) => p.status === 'active').length;

  return {
    totalPeople: people.length,
    activeProjectsCount,
    teamAverageUtilization,
    overbookedPeopleCount,
    totalPersonMonthsOverbooked,
    totalLeaveMonthsCount,
    activeLeavesCount: yearLeaves.length
  };
}

export interface PersonBenchSummary {
  person: Person;
  monthlyBenchPct: number[]; // 12 numbers (0..100) representing bench availability
  monthlyBookedPct: number[]; // 12 numbers
  monthlyEffectiveCap: number[]; // 12 numbers
  annualAverageBenchPct: number;
  totalBenchMonthsCount: number; // months with > 0% bench
  fullyFreeMonthsCount: number; // months with >= 100% bench
  currentAllocations: Allocation[];
  activeLeaves: LeaveEntry[];
}

/**
 * Calculates available bench capacity (unassigned working capacity) for a person
 */
export function getPersonBenchSummary(
  person: Person,
  year: number,
  allocations: Allocation[],
  leaves: LeaveEntry[] = []
): PersonBenchSummary {
  const capacitySummary = getPersonCapacitySummary(
    person.id,
    year,
    allocations,
    person.maxCapacityPercent,
    leaves
  );

  const monthlyBenchPct = Array(12).fill(0);
  let totalBenchSum = 0;
  let totalBenchMonthsCount = 0;
  let fullyFreeMonthsCount = 0;

  for (let m = 0; m < 12; m++) {
    const effCap = capacitySummary.effectiveCapacities[m];
    const booked = capacitySummary.totals[m];
    const bench = Math.max(0, effCap - booked);
    monthlyBenchPct[m] = bench;
    totalBenchSum += bench;
    if (bench > 0) totalBenchMonthsCount++;
    if (bench >= 100) fullyFreeMonthsCount++;
  }

  const annualAverageBenchPct = Math.round(totalBenchSum / 12);
  const personAllocs = allocations.filter((a) => a.personId === person.id && a.year === year);
  const personLeaves = leaves.filter((l) => l.personId === person.id && l.year === year);

  return {
    person,
    monthlyBenchPct,
    monthlyBookedPct: capacitySummary.totals,
    monthlyEffectiveCap: capacitySummary.effectiveCapacities,
    annualAverageBenchPct,
    totalBenchMonthsCount,
    fullyFreeMonthsCount,
    currentAllocations: personAllocs,
    activeLeaves: personLeaves
  };
}

/**
 * Formats a person's name as "Last Name, First Name" for table presentation.
 */
export function formatPersonTableName(person: Person): string {
  const first = (person.firstName ?? '').trim();
  const last = (person.lastName ?? '').trim();
  if (last && first) {
    return `${last}, ${first}`;
  }
  const full = (person.name ?? '').trim();
  if (!full) return '';
  if (full.includes(',')) return full;
  const parts = full.split(/\s+/);
  if (parts.length >= 2) {
    const firstPart = parts[0];
    const lastPart = parts.slice(1).join(' ');
    return `${lastPart}, ${firstPart}`;
  }
  return full;
}

