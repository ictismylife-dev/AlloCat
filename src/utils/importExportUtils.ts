import {
  Person,
  Client,
  Project,
  Allocation,
  LeaveEntry,
  LeaveType,
  ViewMode,
  MONTH_NAMES,
  MONTH_FULL_NAMES,
  LEAVE_TYPE_CONFIG
} from '../types';
import { AppState } from '../data/seedData';
import {
  getPersonCapacitySummary,
  getProjectStaffingSummary,
  getPersonBenchSummary
} from './allocationMath';

export type ExportScope = ViewMode | 'all';
export type ImportMergeMode = 'merge' | 'replace';

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

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (!parts[0]) return 'TM';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function escapeCsvCell(val: string | number | boolean | undefined | null): string {
  const str = String(val ?? '');
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function rowsToCsv(rows: (string | number | boolean | undefined | null)[][]): string {
  return rows.map((row) => row.map(escapeCsvCell).join(',')).join('\n');
}

export function parseCsvToRows(csvText: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let inQuotes = false;

  const text = csvText.replace(/^\uFEFF/, ''); // strip BOM if present

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        currentField += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        currentField += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        currentRow.push(currentField.trim());
        currentField = '';
      } else if (ch === '\r' && next === '\n') {
        currentRow.push(currentField.trim());
        if (currentRow.some((cell) => cell !== '')) {
          rows.push(currentRow);
        }
        currentRow = [];
        currentField = '';
        i++;
      } else if (ch === '\n' || ch === '\r') {
        currentRow.push(currentField.trim());
        if (currentRow.some((cell) => cell !== '')) {
          rows.push(currentRow);
        }
        currentRow = [];
        currentField = '';
      } else {
        currentField += ch;
      }
    }
  }

  currentRow.push(currentField.trim());
  if (currentRow.some((cell) => cell !== '')) {
    rows.push(currentRow);
  }

  return rows;
}

function parsePercentValue(raw: string | undefined, fallback = 0): number {
  if (!raw) return fallback;
  const cleaned = raw.replace(/%/g, '').replace(/[^\d.-]/g, '').trim();
  if (!cleaned) return fallback;
  const num = Number(cleaned);
  return Number.isFinite(num) ? Math.max(0, Math.round(num)) : fallback;
}

function parseMonthToken(token: string | undefined): number | null {
  if (!token) return null;
  const t = token.trim().toLowerCase();
  if (!t) return null;

  const shortIdx = MONTH_NAMES.findIndex((m) => m.toLowerCase() === t.slice(0, 3));
  if (shortIdx >= 0) return shortIdx;

  const fullIdx = MONTH_FULL_NAMES.findIndex((m) => m.toLowerCase() === t);
  if (fullIdx >= 0) return fullIdx;

  const num = parseInt(t.replace(/^m/i, ''), 10);
  if (!isNaN(num)) {
    if (num >= 1 && num <= 12) return num - 1;
    if (num >= 0 && num <= 11) return num;
  }
  return null;
}

export function triggerFileDownload(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ============================================================================
// CSV GENERATORS FOR EACH TAB / VIEW
// ============================================================================

/**
 * 1. BY PEOPLE VIEW CSV
 * Exports Person Summary rows + Project Assignment rows for the selected year
 */
export function generatePeopleViewCSV(state: AppState, peopleSubset?: Person[]): string {
  const { clients, projects, allocations, leaves, selectedYear } = state;
  const targetPeople = peopleSubset ?? state.people;

  const headers = [
    'Year',
    'Row Type',
    'Person Name',
    'Role',
    'Department',
    'Email',
    'Max Capacity %',
    'Person Comment',
    'Client',
    'Project',
    'Project Code',
    'Assignment Note',
    'Annual Avg %',
    ...MONTH_NAMES
  ];

  const rows: (string | number)[][] = [headers];

  for (const person of targetPeople) {
    const summary = getPersonCapacitySummary(
      person.id,
      selectedYear,
      allocations,
      person.maxCapacityPercent,
      leaves
    );

    // Person summary row
    rows.push([
      selectedYear,
      'Person Summary',
      person.name,
      person.role,
      person.department,
      person.email,
      `${person.maxCapacityPercent}%`,
      person.notes || '',
      '',
      '',
      '',
      '',
      `${summary.annualAverage}%`,
      ...summary.totals.map((v) => `${v}%`)
    ]);

    // Assigned project sub-rows
    const personAllocs = allocations.filter(
      (a) => a.personId === person.id && a.year === selectedYear
    );

    for (const alloc of personAllocs) {
      const project = projects.find((p) => p.id === alloc.projectId);
      if (!project) continue;
      const client = clients.find((c) => c.id === project.clientId);
      const avg = Math.round(
        alloc.monthlyPercentage.reduce((s, n) => s + (n || 0), 0) / 12
      );

      rows.push([
        selectedYear,
        'Project Assignment',
        person.name,
        person.role,
        person.department,
        person.email,
        `${person.maxCapacityPercent}%`,
        person.notes || '',
        client?.name || 'Internal',
        project.name,
        project.code,
        alloc.notes || project.notes || '',
        `${avg}%`,
        ...alloc.monthlyPercentage.map((v) => `${v}%`)
      ]);
    }
  }

  return rowsToCsv(rows);
}

/**
 * 2. BY CLIENTS & PROJECTS VIEW CSV
 * Exports Project Summary rows + Staff Assignment rows grouped by Client
 */
export function generateClientsViewCSV(state: AppState, projectsSubset?: Project[]): string {
  const { people, clients, allocations, selectedYear } = state;
  const targetProjects = projectsSubset ?? state.projects;

  const headers = [
    'Year',
    'Row Type',
    'Client',
    'Industry',
    'Project',
    'Project Code',
    'Project Status',
    'Billable',
    'Project Scope Comment',
    'Person Name',
    'Role',
    'Department',
    'Assignment Note',
    'Avg FTE / %',
    ...MONTH_NAMES
  ];

  const rows: (string | number)[][] = [headers];

  for (const client of clients) {
    const clientProjects = targetProjects.filter((p) => p.clientId === client.id);
    for (const project of clientProjects) {
      const summary = getProjectStaffingSummary(project.id, selectedYear, allocations);

      // Project summary row
      rows.push([
        selectedYear,
        'Project Summary',
        client.name,
        client.industry,
        project.name,
        project.code,
        project.status,
        project.billable ? 'Yes' : 'No',
        project.notes || '',
        '',
        '',
        '',
        '',
        `${summary.avgMonthlyFTE} FTE`,
        ...summary.totals.map((v) => `${v}%`)
      ]);

      // Assigned staff rows
      const projectAllocs = allocations.filter(
        (a) => a.projectId === project.id && a.year === selectedYear
      );

      for (const alloc of projectAllocs) {
        const person = people.find((p) => p.id === alloc.personId);
        if (!person) continue;
        const avg = Math.round(
          alloc.monthlyPercentage.reduce((s, n) => s + (n || 0), 0) / 12
        );

        rows.push([
          selectedYear,
          'Staff Assignment',
          client.name,
          client.industry,
          project.name,
          project.code,
          project.status,
          project.billable ? 'Yes' : 'No',
          project.notes || '',
          person.name,
          person.role,
          person.department,
          alloc.notes || person.notes || '',
          `${avg}%`,
          ...alloc.monthlyPercentage.map((v) => `${v}%`)
        ]);
      }
    }
  }

  return rowsToCsv(rows);
}

/**
 * 3. AVAILABILITY & LEAVES VIEW CSV
 * Exports Effective Capacity rows + Scheduled Leave Entry rows
 */
export function generateAvailabilityViewCSV(state: AppState, peopleSubset?: Person[]): string {
  const { allocations, leaves, selectedYear } = state;
  const targetPeople = peopleSubset ?? state.people;

  const headers = [
    'Year',
    'Row Type',
    'Person Name',
    'Role',
    'Department',
    'Max Capacity %',
    'Person Comment',
    'Leave Category',
    'Leave Title',
    'Start Month',
    'End Month',
    'Impact %',
    'Leave Note',
    ...MONTH_NAMES
  ];

  const rows: (string | number)[][] = [headers];

  for (const person of targetPeople) {
    const summary = getPersonCapacitySummary(
      person.id,
      selectedYear,
      allocations,
      person.maxCapacityPercent,
      leaves
    );
    const personLeaves = leaves.filter(
      (l) => l.personId === person.id && l.year === selectedYear
    );

    // Person Effective Capacity Row
    rows.push([
      selectedYear,
      'Effective Capacity',
      person.name,
      person.role,
      person.department,
      `${person.maxCapacityPercent}%`,
      person.notes || '',
      '',
      `${personLeaves.length} scheduled leave(s)`,
      '',
      '',
      '',
      '',
      ...summary.effectiveCapacities.map((v) => `${v}%`)
    ]);

    // Scheduled Leave Sub-rows
    for (const leave of personLeaves) {
      const startM = Math.min(leave.startMonth, leave.endMonth);
      const endM = Math.max(leave.startMonth, leave.endMonth);
      const monthCells = MONTH_NAMES.map((_, idx) =>
        idx >= startM && idx <= endM ? `-${leave.impactPercent}%` : '0%'
      );

      rows.push([
        selectedYear,
        'Leave Entry',
        person.name,
        person.role,
        person.department,
        `${person.maxCapacityPercent}%`,
        person.notes || '',
        leave.type,
        leave.title,
        MONTH_NAMES[startM],
        MONTH_NAMES[endM],
        `${leave.impactPercent}%`,
        leave.notes || '',
        ...monthCells
      ]);
    }
  }

  return rowsToCsv(rows);
}

/**
 * 4. BENCH VIEW CSV
 * Exports Bench Availability & Skills Notes for each team member
 */
export function generateBenchViewCSV(state: AppState, peopleSubset?: Person[]): string {
  const { allocations, leaves, selectedYear } = state;
  const targetPeople = peopleSubset ?? state.people;

  const headers = [
    'Year',
    'Row Type',
    'Person Name',
    'Role',
    'Department',
    'Email',
    'Max Capacity %',
    'Skills & Bench Comment',
    'Avg Bench %',
    'Free Months (>0%)',
    ...MONTH_NAMES
  ];

  const rows: (string | number)[][] = [headers];

  for (const person of targetPeople) {
    const bench = getPersonBenchSummary(person, selectedYear, allocations, leaves);

    rows.push([
      selectedYear,
      'Bench Availability',
      person.name,
      person.role,
      person.department,
      person.email,
      `${person.maxCapacityPercent}%`,
      person.notes || '',
      `${bench.annualAverageBenchPct}%`,
      bench.totalBenchMonthsCount,
      ...bench.monthlyBenchPct.map((v) => `${v}%`)
    ]);
  }

  return rowsToCsv(rows);
}

/**
 * 5. ALL VIEWS / MASTER CSV
 * Combines all sections into a unified, self-describing CSV table that can be
 * opened in Excel/Sheets and re-imported to restore People, Clients, Projects, Allocations, and Leaves.
 */
export function generateAllViewsCSV(state: AppState): string {
  const { people, clients, projects, allocations, leaves, selectedYear } = state;

  const headers = [
    'Year',
    'Record Type',
    'Person Name',
    'Role',
    'Department',
    'Email',
    'Max Capacity %',
    'Person Comment',
    'Client',
    'Industry',
    'Project',
    'Project Code',
    'Billable',
    'Project Scope Comment',
    'Assignment Note',
    'Leave Category',
    'Leave Title',
    'Start Month',
    'End Month',
    'Impact %',
    'Leave Note',
    ...MONTH_NAMES
  ];

  const rows: (string | number)[][] = [headers];

  // 1. All People
  for (const person of people) {
    const summary = getPersonCapacitySummary(
      person.id,
      selectedYear,
      allocations,
      person.maxCapacityPercent,
      leaves
    );
    rows.push([
      selectedYear,
      'Person',
      person.name,
      person.role,
      person.department,
      person.email,
      `${person.maxCapacityPercent}%`,
      person.notes || '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      ...summary.totals.map((v) => `${v}%`)
    ]);
  }

  // 2. All Projects & Clients
  for (const project of projects) {
    const client = clients.find((c) => c.id === project.clientId);
    const summary = getProjectStaffingSummary(project.id, selectedYear, allocations);
    rows.push([
      selectedYear,
      'Project',
      '',
      '',
      '',
      '',
      '',
      '',
      client?.name || 'Internal',
      client?.industry || 'Technology',
      project.name,
      project.code,
      project.billable ? 'Yes' : 'No',
      project.notes || '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      ...summary.totals.map((v) => `${v}%`)
    ]);
  }

  // 3. All Allocations
  for (const alloc of allocations) {
    const person = people.find((p) => p.id === alloc.personId);
    const project = projects.find((p) => p.id === alloc.projectId);
    if (!person || !project) continue;
    const client = clients.find((c) => c.id === project.clientId);

    rows.push([
      alloc.year,
      'Allocation',
      person.name,
      person.role,
      person.department,
      person.email,
      `${person.maxCapacityPercent}%`,
      person.notes || '',
      client?.name || 'Internal',
      client?.industry || 'Technology',
      project.name,
      project.code,
      project.billable ? 'Yes' : 'No',
      project.notes || '',
      alloc.notes || '',
      '',
      '',
      '',
      '',
      '',
      '',
      ...alloc.monthlyPercentage.map((v) => `${v}%`)
    ]);
  }

  // 4. All Leaves
  for (const leave of leaves) {
    const person = people.find((p) => p.id === leave.personId);
    if (!person) continue;
    const startM = Math.min(leave.startMonth, leave.endMonth);
    const endM = Math.max(leave.startMonth, leave.endMonth);
    const monthCells = MONTH_NAMES.map((_, idx) =>
      idx >= startM && idx <= endM ? `-${leave.impactPercent}%` : '0%'
    );

    rows.push([
      leave.year,
      'Leave',
      person.name,
      person.role,
      person.department,
      person.email,
      `${person.maxCapacityPercent}%`,
      person.notes || '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      leave.type,
      leave.title,
      MONTH_NAMES[startM],
      MONTH_NAMES[endM],
      `${leave.impactPercent}%`,
      leave.notes || '',
      ...monthCells
    ]);
  }

  return rowsToCsv(rows);
}

/**
 * Generates Scoped JSON for a specific view or the entire workspace
 */
export function generateViewJSON(state: AppState, scope: ExportScope): string {
  const { people, clients, projects, allocations, leaves, selectedYear } = state;

  if (scope === 'all') {
    return JSON.stringify(state, null, 2);
  }

  if (scope === 'people') {
    return JSON.stringify(
      {
        exportScope: 'people',
        selectedYear,
        departments: state.departments,
        people,
        clients,
        projects,
        allocations: allocations.filter((a) => a.year === selectedYear)
      },
      null,
      2
    );
  }

  if (scope === 'clients') {
    return JSON.stringify(
      {
        exportScope: 'clients',
        selectedYear,
        clients,
        projects,
        people,
        allocations: allocations.filter((a) => a.year === selectedYear)
      },
      null,
      2
    );
  }

  if (scope === 'availability') {
    return JSON.stringify(
      {
        exportScope: 'availability',
        selectedYear,
        people,
        leaves: leaves.filter((l) => l.year === selectedYear)
      },
      null,
      2
    );
  }

  // bench
  const benchSummaries = people.map((person) => {
    const b = getPersonBenchSummary(person, selectedYear, allocations, leaves);
    return {
      personId: person.id,
      name: person.name,
      role: person.role,
      department: person.department,
      email: person.email,
      maxCapacityPercent: person.maxCapacityPercent,
      notes: person.notes || '',
      annualAverageBenchPct: b.annualAverageBenchPct,
      totalBenchMonthsCount: b.totalBenchMonthsCount,
      monthlyBenchPct: b.monthlyBenchPct
    };
  });

  return JSON.stringify(
    {
      exportScope: 'bench',
      selectedYear,
      people,
      benchSummaries
    },
    null,
    2
  );
}

/**
 * Generates a pre-built CSV template (either with example rows or empty headers only)
 * for any tab/view so users can fill it out in Excel / Google Sheets and import it.
 */
export function generateTemplateCSV(
  scope: ExportScope,
  selectedYear: number,
  includeExampleRows: boolean = true
): string {
  if (scope === 'people') {
    const headers = [
      'Year',
      'Row Type',
      'Person Name',
      'Role',
      'Department',
      'Email',
      'Max Capacity %',
      'Person Comment',
      'Client',
      'Project',
      'Project Code',
      'Assignment Note',
      'Annual Avg %',
      ...MONTH_NAMES
    ];
    const exampleRows: (string | number)[][] = includeExampleRows
      ? [
          [
            selectedYear,
            'Project Assignment',
            'Jane Doe',
            'Senior Frontend Engineer',
            'Engineering',
            'jane.doe@company.internal',
            '100%',
            'React & TypeScript Lead',
            'Acme FinTech',
            'NextGen Payments Portal',
            'NGP-01',
            'Frontend Architecture Lead',
            '50%',
            '50%',
            '50%',
            '50%',
            '50%',
            '50%',
            '50%',
            '50%',
            '50%',
            '50%',
            '50%',
            '50%',
            '50%'
          ],
          [
            selectedYear,
            'Project Assignment',
            'Jane Doe',
            'Senior Frontend Engineer',
            'Engineering',
            'jane.doe@company.internal',
            '100%',
            'React & TypeScript Lead',
            'Internal',
            'Design System v3',
            'DS-03',
            'Component Library',
            '25%',
            '25%',
            '25%',
            '25%',
            '25%',
            '25%',
            '25%',
            '25%',
            '25%',
            '25%',
            '25%',
            '25%',
            '25%'
          ]
        ]
      : [Array(headers.length).fill('')];

    return rowsToCsv([headers, ...exampleRows]);
  }

  if (scope === 'clients') {
    const headers = [
      'Year',
      'Row Type',
      'Client',
      'Industry',
      'Project',
      'Project Code',
      'Project Status',
      'Billable',
      'Project Scope Comment',
      'Person Name',
      'Role',
      'Department',
      'Assignment Note',
      'Avg FTE / %',
      ...MONTH_NAMES
    ];
    const exampleRows: (string | number)[][] = includeExampleRows
      ? [
          [
            selectedYear,
            'Project Summary',
            'Globex Retail',
            'E-Commerce',
            'Omnichannel Checkout',
            'OMC-01',
            'active',
            'Yes',
            'Q2-Q4 Rollout',
            '',
            '',
            '',
            '',
            '0.8 FTE',
            '0%',
            '0%',
            '100%',
            '100%',
            '100%',
            '100%',
            '100%',
            '100%',
            '100%',
            '100%',
            '100%',
            '0%'
          ],
          [
            selectedYear,
            'Staff Assignment',
            'Globex Retail',
            'E-Commerce',
            'Omnichannel Checkout',
            'OMC-01',
            'active',
            'Yes',
            'Q2-Q4 Rollout',
            'Alex Rivera',
            'Product Designer',
            'Design',
            'UX Lead',
            '100%',
            '0%',
            '0%',
            '100%',
            '100%',
            '100%',
            '100%',
            '100%',
            '100%',
            '100%',
            '100%',
            '100%',
            '0%'
          ]
        ]
      : [Array(headers.length).fill('')];

    return rowsToCsv([headers, ...exampleRows]);
  }

  if (scope === 'availability') {
    const headers = [
      'Year',
      'Row Type',
      'Person Name',
      'Role',
      'Department',
      'Max Capacity %',
      'Person Comment',
      'Leave Category',
      'Leave Title',
      'Start Month',
      'End Month',
      'Impact %',
      'Leave Note',
      ...MONTH_NAMES
    ];
    const exampleRows: (string | number)[][] = includeExampleRows
      ? [
          [
            selectedYear,
            'Leave Entry',
            'Jane Doe',
            'Senior Frontend Engineer',
            'Engineering',
            '100%',
            'Summer PTO planned',
            'vacation',
            'Summer Family Vacation',
            'Jul',
            'Aug',
            '50%',
            'Covered by Alex',
            '0%',
            '0%',
            '0%',
            '0%',
            '0%',
            '0%',
            '-50%',
            '-50%',
            '0%',
            '0%',
            '0%',
            '0%'
          ],
          [
            selectedYear,
            'Leave Entry',
            'Sam Taylor',
            'Backend Architect',
            'Engineering',
            '100%',
            '',
            'paternity',
            'Paternity Leave',
            'Oct',
            'Nov',
            '100%',
            'Full time off Oct-Nov',
            '0%',
            '0%',
            '0%',
            '0%',
            '0%',
            '0%',
            '0%',
            '0%',
            '0%',
            '-100%',
            '-100%',
            '0%'
          ]
        ]
      : [Array(headers.length).fill('')];

    return rowsToCsv([headers, ...exampleRows]);
  }

  if (scope === 'bench') {
    const headers = [
      'Year',
      'Row Type',
      'Person Name',
      'Role',
      'Department',
      'Email',
      'Max Capacity %',
      'Skills & Bench Comment',
      'Avg Bench %',
      'Free Months (>0%)',
      ...MONTH_NAMES
    ];
    const exampleRows: (string | number)[][] = includeExampleRows
      ? [
          [
            selectedYear,
            'Bench Availability',
            'Chris Morgan',
            'DevOps Engineer',
            'Cloud & Infra',
            'chris.morgan@company.internal',
            '100%',
            'Kubernetes, Terraform, AWS Certified — ready for Q3 assignment',
            '50%',
            6,
            '0%',
            '0%',
            '0%',
            '0%',
            '0%',
            '0%',
            '100%',
            '100%',
            '100%',
            '100%',
            '100%',
            '100%'
          ]
        ]
      : [Array(headers.length).fill('')];

    return rowsToCsv([headers, ...exampleRows]);
  }

  // scope === 'all' (Master All-Views Template)
  const headers = [
    'Year',
    'Record Type',
    'Person Name',
    'Role',
    'Department',
    'Email',
    'Max Capacity %',
    'Person Comment',
    'Client',
    'Industry',
    'Project',
    'Project Code',
    'Billable',
    'Project Scope Comment',
    'Assignment Note',
    'Leave Category',
    'Leave Title',
    'Start Month',
    'End Month',
    'Impact %',
    'Leave Note',
    ...MONTH_NAMES
  ];
  const exampleRows: (string | number)[][] = includeExampleRows
    ? [
        [
          selectedYear,
          'Allocation',
          'Jane Doe',
          'Senior Frontend Engineer',
          'Engineering',
          'jane.doe@company.internal',
          '100%',
          'React & TypeScript Lead',
          'Acme FinTech',
          'Financial Services',
          'NextGen Payments Portal',
          'NGP-01',
          'Yes',
          'Core Portal Delivery',
          'Tech Lead',
          '',
          '',
          '',
          '',
          '',
          '',
          '75%',
          '75%',
          '75%',
          '75%',
          '75%',
          '75%',
          '50%',
          '50%',
          '50%',
          '50%',
          '50%',
          '50%'
        ],
        [
          selectedYear,
          'Leave',
          'Jane Doe',
          'Senior Frontend Engineer',
          'Engineering',
          'jane.doe@company.internal',
          '100%',
          'React & TypeScript Lead',
          '',
          '',
          '',
          '',
          '',
          '',
          '',
          'vacation',
          'Summer PTO',
          'Jul',
          'Aug',
          '25%',
          '1 week off each month',
          '0%',
          '0%',
          '0%',
          '0%',
          '0%',
          '0%',
          '-25%',
          '-25%',
          '0%',
          '0%',
          '0%',
          '0%'
        ]
      ]
    : [Array(headers.length).fill('')];

  return rowsToCsv([headers, ...exampleRows]);
}

// ============================================================================
// UNIFIED CSV & JSON IMPORTER ACROSS ALL TABS AND VIEWS
// ============================================================================

export interface ImportResult {
  nextState: AppState;
  summaryMessage: string;
}

export function importDataFromFileContent(
  fileContent: string,
  fileName: string,
  currentState: AppState,
  targetScope: ExportScope,
  mergeMode: ImportMergeMode = 'merge'
): ImportResult {
  const trimmed = fileContent.trim();
  if (trimmed.startsWith('{') || trimmed.startsWith('[') || fileName.toLowerCase().endsWith('.json')) {
    return importFromJsonContent(trimmed, currentState, targetScope, mergeMode);
  }
  return importFromCsvContent(trimmed, currentState, targetScope, mergeMode);
}

function importFromJsonContent(
  jsonText: string,
  currentState: AppState,
  targetScope: ExportScope,
  mergeMode: ImportMergeMode
): ImportResult {
  const parsed = JSON.parse(jsonText);

  // Full backup or scoped JSON object
  const nextPeople = mergeMode === 'replace' && Array.isArray(parsed.people)
    ? [...parsed.people]
    : [...currentState.people];
  const nextClients = mergeMode === 'replace' && Array.isArray(parsed.clients)
    ? [...parsed.clients]
    : [...currentState.clients];
  const nextProjects = mergeMode === 'replace' && Array.isArray(parsed.projects)
    ? [...parsed.projects]
    : [...currentState.projects];
  const nextAllocations = mergeMode === 'replace' && Array.isArray(parsed.allocations)
    ? [...parsed.allocations]
    : [...currentState.allocations];
  const nextLeaves = mergeMode === 'replace' && Array.isArray(parsed.leaves)
    ? [...parsed.leaves]
    : [...currentState.leaves];

  let peopleCount = 0;
  let projectsCount = 0;
  let allocationsCount = 0;
  let leavesCount = 0;

  if (Array.isArray(parsed.people)) {
    for (const p of parsed.people as Person[]) {
      if (!p || !p.name) continue;
      peopleCount++;
      const idx = nextPeople.findIndex(
        (existing) => existing.id === p.id || existing.name.toLowerCase() === p.name.toLowerCase()
      );
      if (idx >= 0) {
        nextPeople[idx] = { ...nextPeople[idx], ...p, id: nextPeople[idx].id };
      } else {
        nextPeople.push({
          ...p,
          id: p.id || `p-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          role: p.role || 'Specialist',
          department: p.department || 'Engineering',
          email: p.email || `${p.name.toLowerCase().replace(/\s+/g, '.')}@company.internal`,
          maxCapacityPercent: p.maxCapacityPercent ?? 100,
          avatarColor: p.avatarColor || AVATAR_COLORS[nextPeople.length % AVATAR_COLORS.length],
          initials: p.initials || getInitials(p.name)
        });
      }
    }
  }

  // Also support benchSummaries array if importing a bench JSON export
  if (Array.isArray(parsed.benchSummaries)) {
    for (const b of parsed.benchSummaries) {
      if (!b || !b.name) continue;
      peopleCount++;
      const idx = nextPeople.findIndex(
        (existing) => existing.id === b.personId || existing.name.toLowerCase() === b.name.toLowerCase()
      );
      if (idx >= 0) {
        nextPeople[idx] = {
          ...nextPeople[idx],
          role: b.role ?? nextPeople[idx].role,
          department: b.department ?? nextPeople[idx].department,
          maxCapacityPercent: b.maxCapacityPercent ?? nextPeople[idx].maxCapacityPercent,
          notes: b.notes !== undefined ? b.notes : nextPeople[idx].notes
        };
      } else {
        nextPeople.push({
          id: b.personId || `p-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          name: b.name,
          role: b.role || 'Specialist',
          department: b.department || 'Engineering',
          email: b.email || `${b.name.toLowerCase().replace(/\s+/g, '.')}@company.internal`,
          maxCapacityPercent: b.maxCapacityPercent ?? 100,
          avatarColor: AVATAR_COLORS[nextPeople.length % AVATAR_COLORS.length],
          initials: getInitials(b.name),
          notes: b.notes || undefined
        });
      }
    }
  }

  if (Array.isArray(parsed.clients)) {
    for (const c of parsed.clients as Client[]) {
      if (!c || !c.name) continue;
      const idx = nextClients.findIndex(
        (existing) => existing.id === c.id || existing.name.toLowerCase() === c.name.toLowerCase()
      );
      if (idx >= 0) {
        nextClients[idx] = { ...nextClients[idx], ...c, id: nextClients[idx].id };
      } else {
        nextClients.push({
          ...c,
          id: c.id || `c-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          industry: c.industry || 'Technology',
          color: c.color || AVATAR_COLORS[nextClients.length % AVATAR_COLORS.length],
          status: c.status || 'active'
        });
      }
    }
  }

  if (Array.isArray(parsed.projects)) {
    for (const proj of parsed.projects as Project[]) {
      if (!proj || !proj.name) continue;
      projectsCount++;
      const idx = nextProjects.findIndex(
        (existing) =>
          existing.id === proj.id ||
          existing.code.toLowerCase() === (proj.code || '').toLowerCase() ||
          existing.name.toLowerCase() === proj.name.toLowerCase()
      );
      if (idx >= 0) {
        nextProjects[idx] = { ...nextProjects[idx], ...proj, id: nextProjects[idx].id };
      } else {
        nextProjects.push({
          ...proj,
          id: proj.id || `proj-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          clientId: proj.clientId || nextClients[0]?.id || 'c-default',
          code: proj.code || proj.name.slice(0, 4).toUpperCase(),
          status: proj.status || 'active',
          color: proj.color || AVATAR_COLORS[nextProjects.length % AVATAR_COLORS.length],
          billable: proj.billable ?? true
        });
      }
    }
  }

  if (Array.isArray(parsed.allocations)) {
    for (const alloc of parsed.allocations as Allocation[]) {
      if (!alloc || !Array.isArray(alloc.monthlyPercentage)) continue;
      allocationsCount++;
      const idx = nextAllocations.findIndex(
        (existing) =>
          existing.id === alloc.id ||
          (existing.personId === alloc.personId &&
            existing.projectId === alloc.projectId &&
            existing.year === alloc.year)
      );
      if (idx >= 0) {
        nextAllocations[idx] = {
          ...nextAllocations[idx],
          ...alloc,
          id: nextAllocations[idx].id
        };
      } else {
        nextAllocations.push({
          ...alloc,
          id: alloc.id || `a-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
        });
      }
    }
  }

  if (Array.isArray(parsed.leaves)) {
    for (const leave of parsed.leaves as LeaveEntry[]) {
      if (!leave || !leave.personId) continue;
      leavesCount++;
      const idx = nextLeaves.findIndex(
        (existing) =>
          existing.id === leave.id ||
          (existing.personId === leave.personId &&
            existing.year === leave.year &&
            existing.title.toLowerCase() === (leave.title || '').toLowerCase() &&
            existing.startMonth === leave.startMonth)
      );
      if (idx >= 0) {
        nextLeaves[idx] = { ...nextLeaves[idx], ...leave, id: nextLeaves[idx].id };
      } else {
        nextLeaves.push({
          ...leave,
          id: leave.id || `leave-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
        });
      }
    }
  }

  const allYears = Array.from(
    new Set([
      ...currentState.availableYears,
      ...(Array.isArray(parsed.availableYears) ? parsed.availableYears : []),
      ...(typeof parsed.selectedYear === 'number' ? [parsed.selectedYear] : []),
      ...nextAllocations.map((a) => a.year),
      ...nextLeaves.map((l) => l.year)
    ])
  ).sort((a, b) => a - b);

  const allDepts = Array.from(
    new Set([
      ...currentState.departments,
      ...(Array.isArray(parsed.departments) ? parsed.departments : []),
      ...nextPeople.map((p) => p.department).filter(Boolean)
    ])
  );

  const nextState: AppState = {
    people: nextPeople,
    clients: nextClients,
    projects: nextProjects,
    allocations: nextAllocations,
    leaves: nextLeaves,
    availableYears: allYears.length > 0 ? allYears : [2025, 2026, 2027],
    selectedYear:
      typeof parsed.selectedYear === 'number'
        ? parsed.selectedYear
        : currentState.selectedYear,
    departments: allDepts
  };

  const parts: string[] = [];
  if (peopleCount > 0) parts.push(`${peopleCount} people`);
  if (projectsCount > 0) parts.push(`${projectsCount} projects`);
  if (allocationsCount > 0) parts.push(`${allocationsCount} allocations`);
  if (leavesCount > 0) parts.push(`${leavesCount} leaves`);

  return {
    nextState,
    summaryMessage:
      parts.length > 0
        ? `Successfully imported JSON (${parts.join(', ')})!`
        : `Successfully imported JSON data for ${targetScope} view!`
  };
}

function importFromCsvContent(
  csvText: string,
  currentState: AppState,
  targetScope: ExportScope,
  mergeMode: ImportMergeMode
): ImportResult {
  const rows = parseCsvToRows(csvText);
  if (rows.length < 2) {
    throw new Error('CSV file must contain a header row and at least one data row.');
  }

  const rawHeaders = rows[0].map((h) => h.trim());
  const lowerHeaders = rawHeaders.map((h) => h.toLowerCase());

  const colIndex = (candidates: string[]): number => {
    for (const c of candidates) {
      const idx = lowerHeaders.findIndex((h) => h === c.toLowerCase());
      if (idx >= 0) return idx;
    }
    for (const c of candidates) {
      const idx = lowerHeaders.findIndex((h) => h.includes(c.toLowerCase()));
      if (idx >= 0) return idx;
    }
    return -1;
  };

  const idxYear = colIndex(['year']);
  const idxRowType = colIndex(['row type', 'record type', 'type']);
  const idxPersonName = colIndex(['person name', 'team member', 'person', 'name', 'staff']);
  const idxRole = colIndex(['role', 'title', 'job title']);
  const idxDept = colIndex(['department', 'dept']);
  const idxEmail = colIndex(['email']);
  const idxMaxCap = colIndex(['max capacity %', 'max capacity', 'base capacity']);
  const idxPersonComment = colIndex([
    'person comment',
    'skills & bench comment',
    'staffing note',
    'skills note',
    'person note',
    'comment'
  ]);

  const idxClient = colIndex(['client', 'client name']);
  const idxIndustry = colIndex(['industry']);
  const idxProject = colIndex(['project', 'project name']);
  const idxProjectCode = colIndex(['project code', 'code']);
  const idxProjectStatus = colIndex(['project status', 'status']);
  const idxBillable = colIndex(['billable']);
  const idxProjectComment = colIndex(['project scope comment', 'scope note', 'project note']);
  const idxAllocComment = colIndex(['assignment note', 'role note', 'allocation note']);

  const idxLeaveType = colIndex(['leave category', 'leave type']);
  const idxLeaveTitle = colIndex(['leave title', 'reason']);
  const idxStartMonth = colIndex(['start month', 'from month']);
  const idxEndMonth = colIndex(['end month', 'to month']);
  const idxImpact = colIndex(['impact %', 'impact', 'capacity reduction']);
  const idxLeaveNote = colIndex(['leave note']);

  const monthIndices: number[] = MONTH_NAMES.map((m, i) => {
    const full = MONTH_FULL_NAMES[i].toLowerCase();
    const short = m.toLowerCase();
    return lowerHeaders.findIndex(
      (h) => h === short || h === full || h.startsWith(`${short} `)
    );
  });

  const nextPeople = [...currentState.people];
  const nextClients = [...currentState.clients];
  const nextProjects = [...currentState.projects];
  let nextAllocations =
    mergeMode === 'replace' && (targetScope === 'people' || targetScope === 'clients' || targetScope === 'all')
      ? currentState.allocations.filter((a) => a.year !== currentState.selectedYear)
      : [...currentState.allocations];
  let nextLeaves =
    mergeMode === 'replace' && (targetScope === 'availability' || targetScope === 'all')
      ? currentState.leaves.filter((l) => l.year !== currentState.selectedYear)
      : [...currentState.leaves];

  let updatedPeopleCount = 0;
  let updatedProjectsCount = 0;
  let updatedAllocationsCount = 0;
  let updatedLeavesCount = 0;

  const ensurePerson = (
    name: string,
    role?: string,
    dept?: string,
    email?: string,
    maxCap?: number,
    notes?: string
  ): Person => {
    const existingIdx = nextPeople.findIndex(
      (p) => p.name.toLowerCase() === name.toLowerCase()
    );
    if (existingIdx >= 0) {
      const existing = nextPeople[existingIdx];
      const updated: Person = {
        ...existing,
        role: role || existing.role,
        department: dept || existing.department,
        email: email || existing.email,
        maxCapacityPercent: maxCap !== undefined ? maxCap : existing.maxCapacityPercent,
        notes: notes !== undefined && notes !== '' ? notes : existing.notes
      };
      nextPeople[existingIdx] = updated;
      updatedPeopleCount++;
      return updated;
    }

    const created: Person = {
      id: `p-${Date.now()}-${ nextPeople.length + 1}`,
      name,
      role: role || 'Specialist',
      department: dept || 'Engineering',
      email: email || `${name.toLowerCase().replace(/\s+/g, '.')}@company.internal`,
      maxCapacityPercent: maxCap ?? 100,
      avatarColor: AVATAR_COLORS[nextPeople.length % AVATAR_COLORS.length],
      initials: getInitials(name),
      notes: notes || undefined
    };
    nextPeople.push(created);
    updatedPeopleCount++;
    return created;
  };

  const ensureClient = (clientName: string, industry?: string): Client => {
    const cleanName = clientName.trim() || 'Internal';
    const existingIdx = nextClients.findIndex(
      (c) => c.name.toLowerCase() === cleanName.toLowerCase()
    );
    if (existingIdx >= 0) {
      if (industry) {
        nextClients[existingIdx] = { ...nextClients[existingIdx], industry };
      }
      return nextClients[existingIdx];
    }

    const created: Client = {
      id: `c-${Date.now()}-${nextClients.length + 1}`,
      name: cleanName,
      industry: industry || 'Technology',
      color: AVATAR_COLORS[nextClients.length % AVATAR_COLORS.length],
      status: 'active'
    };
    nextClients.push(created);
    return created;
  };

  const ensureProject = (
    projectName: string,
    projectCode: string | undefined,
    clientId: string,
    status?: string,
    billableStr?: string,
    scopeNotes?: string
  ): Project => {
    const existingIdx = nextProjects.findIndex(
      (p) =>
        p.name.toLowerCase() === projectName.toLowerCase() ||
        (projectCode && p.code.toLowerCase() === projectCode.toLowerCase())
    );
    const isBillable =
      billableStr !== undefined && billableStr !== ''
        ? !['no', 'false', '0'].includes(billableStr.toLowerCase())
        : undefined;

    if (existingIdx >= 0) {
      const existing = nextProjects[existingIdx];
      const updated: Project = {
        ...existing,
        clientId: clientId || existing.clientId,
        code: projectCode || existing.code,
        billable: isBillable !== undefined ? isBillable : existing.billable,
        notes: scopeNotes !== undefined && scopeNotes !== '' ? scopeNotes : existing.notes
      };
      nextProjects[existingIdx] = updated;
      updatedProjectsCount++;
      return updated;
    }

    const code =
      projectCode ||
      projectName
        .split(/\s+/)
        .map((w) => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 6) ||
      'PRJ';

    const created: Project = {
      id: `proj-${Date.now()}-${nextProjects.length + 1}`,
      clientId,
      name: projectName,
      code,
      status:
        status === 'planned' || status === 'completed' ? status : 'active',
      color: AVATAR_COLORS[nextProjects.length % AVATAR_COLORS.length],
      billable: isBillable ?? true,
      notes: scopeNotes || undefined
    };
    nextProjects.push(created);
    updatedProjectsCount++;
    return created;
  };

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    const getCell = (idx: number): string => (idx >= 0 && idx < row.length ? row[idx].trim() : '');

    const rowYearNum = parseInt(getCell(idxYear), 10);
    const year = !isNaN(rowYearNum) && rowYearNum >= 2000 && rowYearNum <= 2100
      ? rowYearNum
      : currentState.selectedYear;

    const rowType = getCell(idxRowType).toLowerCase();
    const personName = getCell(idxPersonName);
    const role = getCell(idxRole);
    const dept = getCell(idxDept);
    const email = getCell(idxEmail);
    const maxCapRaw = getCell(idxMaxCap);
    const maxCap = maxCapRaw ? parsePercentValue(maxCapRaw, 100) : undefined;
    const personComment = getCell(idxPersonComment);

    const clientName = getCell(idxClient);
    const industry = getCell(idxIndustry);
    const projectName = getCell(idxProject);
    const projectCode = getCell(idxProjectCode);
    const projectStatus = getCell(idxProjectStatus);
    const billableStr = getCell(idxBillable);
    const projectComment = getCell(idxProjectComment);
    const allocComment = getCell(idxAllocComment);

    const leaveTypeRaw = getCell(idxLeaveType).toLowerCase();
    const leaveTitle = getCell(idxLeaveTitle);
    const startMonthStr = getCell(idxStartMonth);
    const endMonthStr = getCell(idxEndMonth);
    const impactStr = getCell(idxImpact);
    const leaveNote = getCell(idxLeaveNote);

    const monthValues = monthIndices.map((colIdx) =>
      colIdx >= 0 ? parsePercentValue(getCell(colIdx), 0) : 0
    );
    const hasMonthColumns = monthIndices.some((colIdx) => colIdx >= 0);

    // 1. Ensure Person if personName is present
    let personObj: Person | null = null;
    if (personName) {
      personObj = ensurePerson(personName, role, dept, email, maxCap, personComment);
    }

    // 2. Ensure Client & Project if projectName is present
    let projectObj: Project | null = null;
    if (projectName) {
      const clientObj = ensureClient(clientName || 'Internal', industry);
      projectObj = ensureProject(
        projectName,
        projectCode,
        clientObj.id,
        projectStatus,
        billableStr,
        projectComment
      );
    }

    // 3. Handle Leave Entry row
    const isLeaveRow =
      rowType.includes('leave') ||
      (personObj &&
        (leaveTypeRaw in LEAVE_TYPE_CONFIG ||
          (leaveTitle && !leaveTitle.includes('scheduled leave(s)'))));

    if (isLeaveRow && personObj) {
      const validType: LeaveType =
        leaveTypeRaw in LEAVE_TYPE_CONFIG ? (leaveTypeRaw as LeaveType) : 'vacation';

      let startM = parseMonthToken(startMonthStr);
      let endM = parseMonthToken(endMonthStr);

      // If start/end months weren't explicit columns, infer from non-zero month columns
      if (startM === null || endM === null) {
        const activeMonths = monthIndices
          .map((colIdx, mIdx) => {
            if (colIdx < 0) return -1;
            const raw = getCell(colIdx);
            return parsePercentValue(raw, 0) > 0 ? mIdx : -1;
          })
          .filter((mIdx) => mIdx >= 0);

        if (activeMonths.length > 0) {
          startM = Math.min(...activeMonths);
          endM = Math.max(...activeMonths);
        } else {
          startM = startM ?? 0;
          endM = endM ?? startM;
        }
      }

      const impact = impactStr
        ? parsePercentValue(impactStr, LEAVE_TYPE_CONFIG[validType].defaultImpact)
        : LEAVE_TYPE_CONFIG[validType].defaultImpact;

      const title = leaveTitle || LEAVE_TYPE_CONFIG[validType].label;

      const existingLeaveIdx = nextLeaves.findIndex(
        (l) =>
          l.personId === personObj!.id &&
          l.year === year &&
          l.startMonth === startM &&
          l.endMonth === endM &&
          l.type === validType
      );

      if (existingLeaveIdx >= 0) {
        nextLeaves[existingLeaveIdx] = {
          ...nextLeaves[existingLeaveIdx],
          title,
          impactPercent: impact,
          notes: leaveNote || nextLeaves[existingLeaveIdx].notes
        };
      } else {
        nextLeaves.push({
          id: `leave-${Date.now()}-${nextLeaves.length + 1}`,
          personId: personObj.id,
          type: validType,
          title,
          year,
          startMonth: startM,
          endMonth: endM,
          impactPercent: impact,
          notes: leaveNote || undefined
        });
      }
      updatedLeavesCount++;
      continue;
    }

    // 4. Handle Allocation Row (when both Person and Project are present on the row)
    const isSummaryOnlyRow =
      rowType === 'person summary' ||
      rowType === 'project summary' ||
      rowType === 'effective capacity' ||
      rowType === 'bench availability';

    if (personObj && projectObj && !isSummaryOnlyRow && hasMonthColumns) {
      const existingAllocIdx = nextAllocations.findIndex(
        (a) =>
          a.personId === personObj!.id &&
          a.projectId === projectObj!.id &&
          a.year === year
      );

      if (existingAllocIdx >= 0) {
        nextAllocations[existingAllocIdx] = {
          ...nextAllocations[existingAllocIdx],
          monthlyPercentage: monthValues,
          notes: allocComment || nextAllocations[existingAllocIdx].notes
        };
      } else {
        nextAllocations.push({
          id: `a-${Date.now()}-${nextAllocations.length + 1}`,
          personId: personObj.id,
          projectId: projectObj.id,
          year,
          monthlyPercentage: monthValues,
          notes: allocComment || undefined
        });
      }
      updatedAllocationsCount++;
    }
  }

  const allYears = Array.from(
    new Set([
      ...currentState.availableYears,
      ...nextAllocations.map((a) => a.year),
      ...nextLeaves.map((l) => l.year)
    ])
  ).sort((a, b) => a - b);

  const allDepts = Array.from(
    new Set([
      ...currentState.departments,
      ...nextPeople.map((p) => p.department).filter(Boolean)
    ])
  );

  const nextState: AppState = {
    people: nextPeople,
    clients: nextClients,
    projects: nextProjects,
    allocations: nextAllocations,
    leaves: nextLeaves,
    availableYears: allYears,
    selectedYear: currentState.selectedYear,
    departments: allDepts
  };

  const summaryParts: string[] = [];
  if (updatedPeopleCount > 0) summaryParts.push(`${updatedPeopleCount} people rows`);
  if (updatedProjectsCount > 0) summaryParts.push(`${updatedProjectsCount} project rows`);
  if (updatedAllocationsCount > 0) summaryParts.push(`${updatedAllocationsCount} allocations`);
  if (updatedLeavesCount > 0) summaryParts.push(`${updatedLeavesCount} leaves`);

  return {
    nextState,
    summaryMessage:
      summaryParts.length > 0
        ? `Imported CSV (${summaryParts.join(', ')})!`
        : 'CSV processed successfully.'
  };
}
